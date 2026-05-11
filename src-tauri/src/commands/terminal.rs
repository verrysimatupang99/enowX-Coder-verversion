use crate::state::AppState;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn spawn_terminal(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    session_id: String,
    working_dir: Option<String>,
) -> Result<(), String> {
    state
        .terminal_service()
        .spawn_terminal(session_id, working_dir, app_handle)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_terminal(
    state: State<'_, AppState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    state
        .terminal_service()
        .write_to_terminal(&session_id, &data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn close_terminal(state: State<'_, AppState>, session_id: String) -> Result<(), String> {
    state
        .terminal_service()
        .close_terminal(&session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resize_terminal(
    state: State<'_, AppState>,
    session_id: String,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    state
        .terminal_service()
        .resize_terminal(&session_id, rows, cols)
        .map_err(|e| e.to_string())
}
