use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::SqlitePool;
use std::path::PathBuf;

use crate::error::{AppError, AppResult};
use super::now_rfc3339;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub enabled: bool,
    pub config: Option<String>, // JSON
    pub installed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub tools: Vec<Value>,
    pub commands: Vec<Value>,
    pub settings: Option<Value>,
}

pub struct PluginService;

impl PluginService {
    pub async fn list_plugins(db: &SqlitePool) -> AppResult<Vec<Plugin>> {
        let plugins = sqlx::query_as::<_, Plugin>(
            "SELECT id, name, version, description, author, enabled, config, installed_at FROM plugins ORDER BY installed_at DESC"
        )
        .fetch_all(db)
        .await?;
        Ok(plugins)
    }

    pub async fn enable_plugin(db: &SqlitePool, id: &str) -> AppResult<()> {
        sqlx::query("UPDATE plugins SET enabled = ?1 WHERE id = ?2")
            .bind(true)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }

    pub async fn disable_plugin(db: &SqlitePool, id: &str) -> AppResult<()> {
        sqlx::query("UPDATE plugins SET enabled = ?1 WHERE id = ?2")
            .bind(false)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }

    pub async fn register_plugin(db: &SqlitePool, manifest: &PluginManifest) -> AppResult<Plugin> {
        let installed_at = now_rfc3339();
        let config = manifest.settings.as_ref().map(|s| s.to_string());

        sqlx::query(
            "INSERT INTO plugins (id, name, version, description, author, enabled, config, installed_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET 
                name = ?2, version = ?3, description = ?4, author = ?5, config = ?7"
        )
        .bind(&manifest.id)
        .bind(&manifest.name)
        .bind(&manifest.version)
        .bind(&manifest.description)
        .bind(&manifest.author)
        .bind(true)
        .bind(&config)
        .bind(&installed_at)
        .execute(db)
        .await?;

        Ok(Plugin {
            id: manifest.id.clone(),
            name: manifest.name.clone(),
            version: manifest.version.clone(),
            description: manifest.description.clone(),
            author: manifest.author.clone(),
            enabled: true,
            config,
            installed_at,
        })
    }

    pub async fn update_plugin(db: &SqlitePool, id: &str, manifest: &PluginManifest) -> AppResult<()> {
        let config = manifest.settings.as_ref().map(|s| s.to_string());

        sqlx::query(
            "UPDATE plugins SET name = ?1, version = ?2, description = ?3, author = ?4, config = ?5 WHERE id = ?6"
        )
        .bind(&manifest.name)
        .bind(&manifest.version)
        .bind(&manifest.description)
        .bind(&manifest.author)
        .bind(&config)
        .bind(id)
        .execute(db)
        .await?;

        Ok(())
    }

    pub fn load_plugins() -> AppResult<Vec<PluginManifest>> {
        let home = std::env::var("HOME").map_err(|_| AppError::Internal("HOME not set".into()))?;
        let plugins_dir = PathBuf::from(home).join(".enowx-coder/plugins");

        if !plugins_dir.exists() {
            return Ok(vec![]);
        }

        let mut manifests = vec![];

        for entry in std::fs::read_dir(&plugins_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                let manifest_path = path.join("plugin.json");
                if manifest_path.exists() {
                    let content = std::fs::read_to_string(&manifest_path)?;
                    let manifest: PluginManifest = serde_json::from_str(&content)?;
                    manifests.push(manifest);
                }
            }
        }

        Ok(manifests)
    }

    pub async fn install_plugin(db: &SqlitePool, path: &str) -> AppResult<Plugin> {
        let manifest_path = PathBuf::from(path).join("plugin.json");
        
        if !manifest_path.exists() {
            return Err(AppError::Internal("plugin.json not found".into()));
        }

        let content = std::fs::read_to_string(&manifest_path)?;
        let manifest: PluginManifest = serde_json::from_str(&content)?;

        // Copy to plugins dir
        let home = std::env::var("HOME").map_err(|_| AppError::Internal("HOME not set".into()))?;
        let plugins_dir = PathBuf::from(home).join(".enowx-coder/plugins");
        std::fs::create_dir_all(&plugins_dir)?;

        let dest = plugins_dir.join(&manifest.id);
        if dest.exists() {
            std::fs::remove_dir_all(&dest)?;
        }

        copy_dir_all(path, &dest)?;

        Self::register_plugin(db, &manifest).await
    }
}

fn copy_dir_all(src: impl AsRef<std::path::Path>, dst: impl AsRef<std::path::Path>) -> std::io::Result<()> {
    std::fs::create_dir_all(&dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}
