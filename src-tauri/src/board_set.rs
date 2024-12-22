use std::{sync::mpsc::{self, Receiver, Sender}, thread::JoinHandle};

use log::{debug, error, info};
use pedal_board::PedalBoard;
use tauri::ipc::Channel;
use thread_priority::{ThreadBuilder, ThreadPriority};
use crate::{alsa_device::{AlsaDevice, Callback}, box_error::BoxError, param_message::{JamParam, ParamMessage}, utils::{get_micro_time, MicroTimer}};
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
        // Prevent double start
        if  self.cmd_tx.is_some() {
            // we have already been started
            error!("attempting to double start audio");
            return Err("Cannot start over!".into());
        }

        // Create a channel to talk to the audio thread
        let (command_tx, command_rx): (mpsc::Sender<ParamMessage>, mpsc::Receiver<ParamMessage>) = mpsc::channel();

        self.cmd_tx = Some(command_tx);
        let boardset = BoardSet::new(channel, command_rx);

        let alsa_device = AlsaDevice::new(&in_dev, &out_dev)?;

        let builder = ThreadBuilder::default()
            .name("Real-Time Thread".to_string())
            .priority(ThreadPriority::Max);

        let alsa_handle = builder.spawn(move |_result| {
            match alsa_thread_run(boardset, alsa_device) {
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
    right_board: PedalBoard,
    left_board: PedalBoard,
    pub event_channel: Channel<Value>,
    pub rx_cmd: Receiver<ParamMessage>,
    pub running: bool,
}

impl BoardSet {
    pub fn new(channel: Channel<Value>, rx_cmd: Receiver<ParamMessage>) -> BoardSet {
        BoardSet {
            left_board: PedalBoard::new(0),
            right_board: PedalBoard::new(1),
            event_channel: channel,
            rx_cmd: rx_cmd,
            running: true,
        }
    }
    pub fn process_command(&mut self, msg: ParamMessage) -> () {
        match msg.param {
            JamParam::ShutdownAudio => {
                self.running = false;
            }
            _ => {
                error!("received unknown command: {}", msg);
            }
        }
    }
}

// By implementing the Callback trait (defined in alsa_device) this structure can
// be passed into the process_a_frame function on the alsa device.  The alsa device will
// call the function named "call" with a frame of audio samples.
impl Callback for BoardSet {
    fn call(&mut self, 
            in_a: &[f32], 
            in_b: &[f32], 
            out_a: &mut [f32], 
            out_b: &mut [f32]
    ) -> () {
        self.left_board.process(in_a, out_a);
        self.right_board.process(in_b, out_b);    
        // make it stereo
        for (i, _v) in in_a.iter().enumerate() {
            let left = out_a[i];
            out_a[i] += out_b[i];
            out_b[i] += left;
        }
    }
}

fn alsa_thread_run(mut boardset: BoardSet, mut alsa_device: AlsaDevice) -> Result<(), BoxError> {
    // If we got here, we just loop and process
    info!("inside alsa_thread_run");
    let mut now = get_micro_time();
    let mut update_timer = MicroTimer::new(now, 150_000);
    
    let mut frame_count: usize = 1;
    while boardset.running {
        // process a frame of audio
        alsa_device.process_a_frame(&mut boardset)?;
        now = get_micro_time();
        // check for any incoming commands
        if let Ok(msg) = boardset.rx_cmd.try_recv() {
            info!("got message: {}", msg);
            boardset.process_command(msg);
        }
        // Send any updates, but don't do this every frame
        if update_timer.expired(now) {
            update_timer.reset(now);
            debug!("sending update with frame_count: {}", frame_count);
            boardset.event_channel.send(json!({
                "bob": "is your uncle",
                "frame_count": frame_count,
            }))?;
        }
        frame_count += 1;
    }
    Ok(())
}