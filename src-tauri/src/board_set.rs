use std::{str::FromStr, sync::mpsc::{self, Receiver, Sender}, thread::JoinHandle};

use log::{debug, error, info};
use pedal_board::PedalBoard;
use pedal_board::dsp::{power_meter::PowerMeter, tuner::Tuner};
use tauri::ipc::Channel;
use thread_priority::{ThreadBuilder, ThreadPriority};
use crate::{alsa_thread::{self, SoundCallback, CHANNELS, FRAME_SIZE}, box_error::BoxError, param_message::{JamParam, ParamMessage}, utils::{get_micro_time, MicroTimer}};
use serde_json::{json, Value};

/// The BoardConnection will retain the channel to the alsa thread
pub struct BoardConnection {
    cmd_tx: Option<Sender<ParamMessage>>,
    handle: Option<JoinHandle<()>>,
}

impl BoardConnection {
    pub fn new() -> BoardConnection {
        BoardConnection {
            cmd_tx: None,
            handle: None,
        }
    }
    // Gentlemen, start your engines..
    pub fn start(&mut self, channel: Channel<Value>, in_dev: String, out_dev: String) -> Result<(), BoxError> {
        info!("starting audio: {}, {}", in_dev, out_dev);
        // Prevent double start
        if  self.cmd_tx.is_some() {
            // we have already been started
            error!("attempting to double start audio");
            return Err("Cannot start over!".into());
        }

        // Create a channel to talk to the audio thread
        let (command_tx, command_rx): (mpsc::Sender<ParamMessage>, mpsc::Receiver<ParamMessage>) = mpsc::channel();

        self.cmd_tx = Some(command_tx);

        let builder = ThreadBuilder::default()
            .name("Real-Time Thread".to_string())
            .priority(ThreadPriority::Max);

        let alsa_handle = builder.spawn(move |_result| {
            match alsa_thread::run(&mut BoardSet::new(channel, command_rx), &in_dev, &out_dev) {
                Ok(()) => {
                    info!("alsa ended with OK");
                }
                Err(e) => {
                    error!("alsa exited with error {}", e);
                }
            }
        })?;
        self.handle = Some(alsa_handle);
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), BoxError> {
        // Prevent double stop
        if self.cmd_tx.is_none() {
            // we are already stopped
            error!("attempting double stop of audio");
            return Err("Double Stop".into());
        }
        match self.send_command(
            ParamMessage::new(JamParam::ShutdownAudio, 0, 0, 0.0, "")
        ) {
            Ok(()) => { () }
            Err(e) => {
                error!("could not send command to stop: {}", e);
            }
        }
        self.cmd_tx = None;
        Ok(())
    }

    // This will send a command to the box thread
    pub fn send_command(&mut self, msg: ParamMessage) -> Result<(), BoxError> {
        if let Some(tx) = &self.cmd_tx {
            tx.send(msg)?;
        }
        Ok(())
    }
}

pub struct BoardSet {
    boards: [PedalBoard; CHANNELS],
    pub event_channel: Channel<Value>,
    pub rx_cmd: Receiver<ParamMessage>,
    pub running: bool,
    input_meters: [PowerMeter; CHANNELS],
    output_meters: [PowerMeter; CHANNELS],
    output_buffers: [Vec<f32>; 2],
    tuners: [Tuner; 2],
    update_timer: MicroTimer,
    frame_count: usize,
}

impl BoardSet {
    pub fn new(channel: Channel<Value>, rx_cmd: Receiver<ParamMessage>) -> BoardSet {
        BoardSet {
            boards: [PedalBoard::new(0), PedalBoard::new(1)],
            input_meters: [PowerMeter::new(), PowerMeter::new()],
            output_meters: [PowerMeter::new(), PowerMeter::new()],
            output_buffers: [vec!(0.0; FRAME_SIZE), vec!(0.0; FRAME_SIZE)],
            tuners: [Tuner::new(), Tuner::new()],
            event_channel: channel,
            rx_cmd: rx_cmd,
            running: true,
            update_timer: MicroTimer::new(get_micro_time(), 150_000),
            frame_count: 0,
        }
    }
    fn process_command(&mut self) -> () {
        if let Ok(msg) = self.rx_cmd.try_recv() {
            info!("got message: {}", msg);
            match msg.param {
                JamParam::ShutdownAudio => {
                    self.running = false;
                }
                JamParam::GetConfigJson => {
                    match self.event_channel.send(self.board_config()) {
                        Ok(()) => {}
                        Err(e) => {
                            error!("Error retrieving board config: {}", e);
                        }
                    }
                }
                JamParam::LoadBoard => {
                    let idx = msg.ivalue_1 as usize;
                    if idx < CHANNELS {
                        self.boards[idx] = PedalBoard::new(idx);
                        self.boards[idx].load_from_json(&msg.svalue);
                    }
                }
                JamParam::InsertPedal => {
                    let idx = msg.ivalue_1 as usize;
                    if idx < CHANNELS {
                        self.boards[idx].insert_pedal(&msg.svalue, msg.ivalue_2 as usize);
                    }
                }
                JamParam::DeletePedal => {
                    let idx = msg.ivalue_1 as usize;
                    if idx < CHANNELS {
                        self.boards[idx].delete_pedal(msg.ivalue_2 as usize);
                    }
                }
                JamParam::MovePedal => {
                    let idx = msg.ivalue_1 as usize;
                    if idx < CHANNELS {
                        let from_idx: usize = msg.ivalue_2 as usize;
                        let to_idx: usize = msg.fvalue.round() as usize;
                        self.boards[idx].move_pedal(from_idx, to_idx);
                    }
                }
                JamParam::SetEffectConfig => {
                    let idx = msg.ivalue_1 as usize;
                    if idx < CHANNELS {
                        match serde_json::Value::from_str(&msg.svalue) {
                            Ok(setting) => {
                                self.boards[idx].change_value(msg.ivalue_2 as usize, &setting);
                            }
                            Err(e) => {
                                // error parsing json to modify a setting
                                dbg!(e);
                            }
                        }

                        self.boards[idx].load_from_json(&msg.svalue);
                    }
                }
            }
        }
    }

    pub fn levels(&mut self) -> Value {
        json!({
            "levelEvent" : {
                "inputLeft": {
                    "level": self.input_meters[0].get_avg(),
                    "peak": self.input_meters[0].get_peak(),
                },
                "inputRight": {
                    "level": self.input_meters[1].get_avg(),
                    "peak": self.input_meters[1].get_peak(),
                },
                "outputLeft": {
                    "level": self.output_meters[0].get_avg(),
                    "peak": self.output_meters[0].get_peak(),
                },
                "outputRight": {
                    "level": self.output_meters[1].get_avg(),
                    "peak": self.output_meters[1].get_peak(),
                },
                "leftFreq": self.tuners[0].get_note(),
                "rightFreq": self.tuners[1].get_note(),
            }
        })
    }
    pub fn board_config(&self) -> Value {
        json!({
            "pedalTypes": PedalBoard::get_pedal_types(),
            "pedalInfo": [
                self.boards[0].as_json(0),
                self.boards[1].as_json(1),
            ]
        })
    }
}

// By implementing the Callback trait (defined in alsa_device) this structure can
// be passed into the process_a_frame function on the alsa device.  The alsa device will
// call the function named "call" with a frame of audio samples.
impl SoundCallback for BoardSet {
    fn process_inputs(&mut self, in_a: &[f32], in_b: &[f32]) -> () {
        // count frames
        self.frame_count += 1;
        // Check for any commands
        self.process_command();
        // Push a frame of data into the system
        self.tuners[0].add_samples(in_a);
        self.tuners[1].add_samples(in_b);
        self.input_meters[0].add_frame(in_a, 1.0);
        self.input_meters[1].add_frame(in_b, 1.0);
        self.boards[0].process(in_a, &mut self.output_buffers[0]);
        self.boards[1].process(in_b, &mut self.output_buffers[1]);
        self.output_meters[0].add_frame(&self.output_buffers[0], 1.0);    
        self.output_meters[1].add_frame(&self.output_buffers[1], 1.0);
        // Check if we need to send a latency update
        let now = get_micro_time();
        if self.update_timer.expired(now) {
            self.update_timer.reset(now);
            debug!("sending update with frame_count: {}", self.frame_count);
            let levels = self.levels();
            match self.event_channel.send(levels) {
                Ok(()) => {}
                Err(e) => {
                    error!("failed to send update: {}", e);
                }
            }
        }

    }
    fn get_playback_data(&mut self, out_a: &mut [f32], out_b: &mut [f32]) -> () {
        let mut i: usize = 0;
        while i < FRAME_SIZE {
            out_a[i] = self.output_buffers[0][i] + self.output_buffers[1][i];
            out_b[i] = self.output_buffers[0][i] + self.output_buffers[1][i];
            i += 1;
        }
    }

    /// This will let you know if the engine is still running
    fn is_running(&self) -> bool {
        self.running
    }
}
