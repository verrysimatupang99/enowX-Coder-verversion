use crate::error::AppResult;
use crate::services::plugin_service::{Plugin, PluginService};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn list_plugins(state: State<'_, AppState>) -> AppResult<Vec<Plugin>> {
    PluginService::list_plugins(state.pool()).await
}

#[tauri::command]
pub async fn enable_plugin(state: State<'_, AppState>, id: String) -> AppResult<()> {
    PluginService::enable_plugin(state.pool(), &id).await
}

#[tauri::command]
pub async fn disable_plugin(state: State<'_, AppState>, id: String) -> AppResult<()> {
    PluginService::disable_plugin(state.pool(), &id).await
}

#[tauri::command]
pub async fn install_plugin(state: State<'_, AppState>, path: String) -> AppResult<Plugin> {
    PluginService::install_plugin(state.pool(), &path).await
}
