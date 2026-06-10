use std::process::{Child, Command};
use std::sync::Mutex;

pub type SharedKeepAwakeManager = Mutex<KeepAwakeManager>;

pub trait KeepAwakeProcess: Send {
    fn id(&self) -> u32;
    fn stop(&mut self);
}

impl KeepAwakeProcess for Child {
    fn id(&self) -> u32 {
        Child::id(self)
    }

    fn stop(&mut self) {
        let _ = self.kill();
        let _ = self.wait();
    }
}

pub struct KeepAwakeManager {
    process: Option<Box<dyn KeepAwakeProcess>>,
}

impl KeepAwakeManager {
    pub fn new() -> Self {
        Self { process: None }
    }

    pub fn enable_with<P, F>(&mut self, spawn: F) -> Result<(), String>
    where
        P: KeepAwakeProcess + 'static,
        F: FnOnce() -> Result<P, String>,
    {
        if self.process.is_some() {
            return Ok(());
        }

        self.process = Some(Box::new(spawn()?));
        Ok(())
    }

    pub fn enable(&mut self) -> Result<(), String> {
        self.enable_with(spawn_caffeinate)
    }

    pub fn disable(&mut self) {
        if let Some(mut process) = self.process.take() {
            process.stop();
        }
    }

    pub fn active_process_id(&self) -> Option<u32> {
        self.process.as_ref().map(|process| process.id())
    }
}

impl Default for KeepAwakeManager {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for KeepAwakeManager {
    fn drop(&mut self) {
        self.disable();
    }
}

fn spawn_caffeinate() -> Result<Child, String> {
    Command::new("caffeinate")
        .args(["-d", "-i", "-s", "-u"])
        .spawn()
        .map_err(|e| format!("failed to start caffeinate: {e}"))
}

#[tauri::command]
pub fn enable_keep_awake(state: tauri::State<'_, SharedKeepAwakeManager>) -> Result<(), String> {
    state
        .lock()
        .map_err(|_| "keep awake state is poisoned".to_string())?
        .enable()
}

#[tauri::command]
pub fn disable_keep_awake(state: tauri::State<'_, SharedKeepAwakeManager>) -> Result<(), String> {
    state
        .lock()
        .map_err(|_| "keep awake state is poisoned".to_string())?
        .disable();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{KeepAwakeManager, KeepAwakeProcess};

    struct TestKeepAwakeProcess {
        id: u32,
    }

    impl TestKeepAwakeProcess {
        fn new(id: u32) -> Self {
            Self { id }
        }
    }

    impl KeepAwakeProcess for TestKeepAwakeProcess {
        fn id(&self) -> u32 {
            self.id
        }

        fn stop(&mut self) {}
    }

    #[test]
    fn keep_awake_manager_is_idempotent_and_releasable() {
        let mut manager = KeepAwakeManager::new();

        manager
            .enable_with(|| Ok(TestKeepAwakeProcess::new(1)))
            .expect("first enable should start a process");
        manager
            .enable_with(|| Ok(TestKeepAwakeProcess::new(2)))
            .expect("second enable should be a no-op");

        assert_eq!(manager.active_process_id(), Some(1));

        manager.disable();

        assert_eq!(manager.active_process_id(), None);

        manager
            .enable_with(|| Ok(TestKeepAwakeProcess::new(3)))
            .expect("enable after disable should start a new process");

        assert_eq!(manager.active_process_id(), Some(3));
    }
}
