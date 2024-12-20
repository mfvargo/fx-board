use std::time::{SystemTime, UNIX_EPOCH};
// Get the time in microseconds
pub fn get_micro_time() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_micros()
}

#[derive(Debug)]
pub struct MicroTimer {
    last_time: u128,
    interval: u128,
}

impl MicroTimer {
    /// create a new timer with the current microsecond value and the interval (in microseconds)
    pub fn new(now: u128, interval: u128) -> MicroTimer {
        MicroTimer {
            last_time: now,
            interval: interval,
        }
    }
    /// recofigure the interval
    pub fn _set_interval(&mut self, interval: u128) -> () {
        self.interval = interval;
    }
    /// check if the timer is expired
    pub fn expired(&self, now: u128) -> bool {
        (self.last_time + self.interval) < now
    }
    /// reset the timer to the value of now
    pub fn reset(&mut self, now: u128) {
        self.last_time = now;
    }
    /// Add to the last time to move timer ahead
    pub fn _advance(&mut self, delta: u128) {
        self.last_time += delta;
    }
    /// Ask how long since the last time you were reset
    pub fn _since(&mut self, now: u128) -> u128 {
        now - self.last_time
    }
}