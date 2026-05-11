use crate::error::AppError;
use portable_pty::{CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

pub struct TerminalService {
    sessions: Arc<Mutex<HashMap<String, TerminalSession>>>,
}

struct TerminalSession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    _reader_handle: std::thread::JoinHandle<()>,
}

impl TerminalService {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn spawn_terminal(
        &self,
        session_id: String,
        working_dir: Option<String>,
        app_handle: AppHandle,
    ) -> Result<(), AppError> {
        let pty_system = NativePtySystem::default();
        let pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::Internal(format!("Failed to open PTY: {}", e)))?;

        let mut cmd = CommandBuilder::new("bash");
        cmd.env("TERM", "xterm-256color");

        if let Some(dir) = working_dir {
            cmd.cwd(dir);
        }

        let mut child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| AppError::Internal(format!("Failed to spawn shell: {}", e)))?;

        let master = pair.master;
        
        let reader = master
            .try_clone_reader()
            .map_err(|e| AppError::Internal(format!("Failed to clone reader: {}", e)))?;

        let writer = master
            .take_writer()
            .map_err(|e| AppError::Internal(format!("Failed to take writer: {}", e)))?;

        let session_id_clone = session_id.clone();
        let reader_handle = std::thread::spawn(move || {
            let mut buf_reader = BufReader::new(reader);
            let mut line = String::new();

            loop {
                line.clear();
                match buf_reader.read_line(&mut line) {
                    Ok(0) => break,
                    Ok(_) => {
                        let _ = app_handle
                            .emit(&format!("terminal-output:{}", session_id_clone), &line);
                    }
                    Err(_) => break,
                }
            }

            let _ = child.wait();
            let _ = app_handle.emit(&format!("terminal-exit:{}", session_id_clone), ());
        });

        let session = TerminalSession {
            writer,
            master,
            _reader_handle: reader_handle,
        };

        self.sessions
            .lock()
            .map_err(|_| AppError::Internal("Lock poisoned".to_string()))?
            .insert(session_id, session);

        Ok(())
    }

    pub fn write_to_terminal(&self, session_id: &str, data: &str) -> Result<(), AppError> {
        let mut sessions = self
            .sessions
            .lock()
            .map_err(|_| AppError::Internal("Lock poisoned".to_string()))?;

        let session = sessions.get_mut(session_id).ok_or_else(|| {
            AppError::NotFound(format!("Terminal session not found: {}", session_id))
        })?;

        session
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| AppError::Io(format!("Failed to write to terminal: {}", e)))?;

        session
            .writer
            .flush()
            .map_err(|e| AppError::Io(format!("Failed to flush terminal: {}", e)))?;

        Ok(())
    }

    pub fn close_terminal(&self, session_id: &str) -> Result<(), AppError> {
        self.sessions
            .lock()
            .map_err(|_| AppError::Internal("Lock poisoned".to_string()))?
            .remove(session_id)
            .ok_or_else(|| {
                AppError::NotFound(format!("Terminal session not found: {}", session_id))
            })?;

        Ok(())
    }

    pub fn resize_terminal(
        &self,
        session_id: &str,
        rows: u16,
        cols: u16,
    ) -> Result<(), AppError> {
        let mut sessions = self
            .sessions
            .lock()
            .map_err(|_| AppError::Internal("Lock poisoned".to_string()))?;

        let session = sessions.get_mut(session_id).ok_or_else(|| {
            AppError::NotFound(format!("Terminal session not found: {}", session_id))
        })?;

        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::Internal(format!("Failed to resize PTY: {}", e)))?;

        Ok(())
    }
}
