use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OptimizationSettings {
    pub rtk_enabled: bool,
    pub caveman_enabled: bool,
    pub dcp_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PermissionSettings {
    pub permission_mode: String,
}

#[tauri::command]
pub async fn get_optimization_settings(state: State<'_, AppState>) -> AppResult<OptimizationSettings> {
    let settings = sqlx::query_as::<_, OptimizationSettings>(
        "SELECT rtk_enabled, caveman_enabled, dcp_enabled FROM settings WHERE id = 1"
    )
    .fetch_one(state.pool())
    .await?;
    
    Ok(settings)
}

#[tauri::command]
pub async fn update_optimization_settings(
    state: State<'_, AppState>,
    rtk_enabled: bool,
    caveman_enabled: bool,
    dcp_enabled: bool,
) -> AppResult<()> {
    sqlx::query(
        "UPDATE settings SET rtk_enabled = ?1, caveman_enabled = ?2, dcp_enabled = ?3, updated_at = datetime('now') WHERE id = 1"
    )
    .bind(rtk_enabled)
    .bind(caveman_enabled)
    .bind(dcp_enabled)
    .execute(state.pool())
    .await?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_permission_settings(state: State<'_, AppState>) -> AppResult<PermissionSettings> {
    let settings = sqlx::query_as::<_, PermissionSettings>(
        "SELECT permission_mode FROM settings WHERE id = 1"
    )
    .fetch_one(state.pool())
    .await?;
    
    Ok(settings)
}

#[tauri::command]
pub async fn update_permission_mode(
    state: State<'_, AppState>,
    mode: String,
) -> AppResult<()> {
    sqlx::query(
        "UPDATE settings SET permission_mode = ?1, updated_at = datetime('now') WHERE id = 1"
    )
    .bind(mode)
    .execute(state.pool())
    .await?;
    
    Ok(())
}
