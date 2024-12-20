// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::info;

fn main() {
    // Turn on the logger
    env_logger::init();
    
    info!("starting app");
    fx_board_lib::run()
}
