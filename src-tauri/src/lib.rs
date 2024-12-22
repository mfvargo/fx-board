#[macro_use]
extern crate num_derive;

use log::info;
use param_message::ParamMessage;
use serde_json::Value;
use std::sync::Mutex;

use tauri::{ipc::Channel, State};

mod alsa_device;
mod box_error;
mod board_set;
mod utils;
mod param_message;

use board_set::BoardConnection;

struct UnitState(Mutex<BoardConnection>);

#[tauri::command]
fn start(
    unit_state: State<'_, UnitState>,
    on_event: Channel<Value>,
    in_dev: String,
    out_dev: String
) -> Result<(), String> {
    info!("Starting board set");
    let mut board_con = unit_state.0.lock().unwrap();
    match board_con.start(on_event, in_dev, out_dev) {
        Ok(()) => { Ok(()) }
        Err(e) => { Err(e.to_string()) }
    }
}

#[tauri::command]
fn stop(unit_state: State<'_, UnitState>) -> Result<(), String> {
    info!("Stopping board set");
    let mut board_con = unit_state.0.lock().unwrap();
    match board_con.stop() {
        Ok(()) => { Ok(()) }
        Err(e) => { Err(e.to_string()) }
    }
}



#[tauri::command]
fn send_command(unit_state: State<'_, UnitState>, msg: Value) -> Result<(), String> {
    info!("Sending command to board set {}", msg);
    let mut board_con = unit_state.0.lock().unwrap();
    match ParamMessage::from_json(&msg) {
        Ok(param_message) => {
            match board_con.send_command(param_message)  {
                Ok(()) => { Ok(()) }
                Err(e) => { Err(e.to_string()) }
            }
        }
        Err(e) => {
            Err(e.to_string())
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(UnitState(Mutex::new(BoardConnection::new())))
        .invoke_handler(tauri::generate_handler![greet, start, stop, send_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
