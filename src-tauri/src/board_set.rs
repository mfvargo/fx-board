use std::sync::mpsc::{self, Receiver, Sender};

use log::{info, error};
use pedal_board::PedalBoard;
use tauri::ipc::Channel;
use thread_priority::{ThreadBuilder, ThreadPriority};
use crate::{alsa_device::{AlsaDevice, Callback}, box_error::BoxError};
use serde_json::{json, Value};

/// The BoardConnection will retain the channel to the alsa thread
pub struct BoardConnection {
    cmd_tx: Option<Sender<Value>>,
}

impl BoardConnection {
    pub fn new() -> BoardConnection {
        BoardConnection {
            cmd_tx: None,
        }
    }
    // Gentlemen, start your engines..
    pub fn start(&mut self, channel: Channel<Value>, in_dev: String, out_dev: String) -> Result<(), BoxError> {

        // Create a channel to talk to the audio thread
        let (command_tx, command_rx): (mpsc::Sender<Value>, mpsc::Receiver<Value>) = mpsc::channel();

        self.cmd_tx = Some(command_tx);
        let boardset = BoardSet::new(channel, command_rx);

        let alsa_device = AlsaDevice::new(&in_dev, &out_dev)?;

        let builder = ThreadBuilder::default()
            .name("Real-Time Thread".to_string())
            .priority(ThreadPriority::Max);

        let _alsa_handle = builder.spawn(move |_result| {
            match alsa_thread_run(boardset, alsa_device) {
                Ok(()) => {
                    info!("alsa ended with OK");
                }
                Err(e) => {
                    error!("alsa exited with error {}", e);
                }
            }
        })?;
        Ok(())
    }
    // This will send a command to the box thread
    pub fn send_command(&mut self, msg: Value) -> Result<(), BoxError> {
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
    pub rx_cmd: Receiver<Value>,
}

impl BoardSet {
    pub fn new(channel: Channel<Value>, rx_cmd: Receiver<Value>) -> BoardSet {
        BoardSet {
            left_board: PedalBoard::new(0),
            right_board: PedalBoard::new(1),
            event_channel: channel,
            rx_cmd: rx_cmd,
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
    
    loop {
        // process a frame of audio
        alsa_device.process_a_frame(&mut boardset)?;
        // check for any incoming commands
        if let Ok(msg) = boardset.rx_cmd.try_recv() {
            info!("got message: {}", msg);
        }
        // Send any updates, but don't do this every frame
        boardset.event_channel.send(json!({"bob": "is your uncle"}))?;
    }
    // Ok(())
}