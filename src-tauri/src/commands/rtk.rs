use tauri::State;

use crate::{
    error::AppResult,
    services::rtk_service::{RTKService, TokenSavings},
    state::AppState,
};

#[tauri::command]
pub async fn get_token_savings(state: State<'_, AppState>) -> AppResult<Vec<TokenSavings>> {
    RTKService::get_savings(state.pool()).await
}

#[tauri::command]
pub async fn get_total_token_savings(state: State<'_, AppState>) -> AppResult<i64> {
    RTKService::get_total_savings(state.pool()).await
}
