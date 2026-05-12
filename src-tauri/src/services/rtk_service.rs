use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::error::{AppError, AppResult};
use super::now_rfc3339;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandFilter {
    pub command: String,
    pub action: FilterAction,
    pub cache_ttl: Option<u64>, // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FilterAction {
    Cache,
    Summarize,
    Skip,
    Pass,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TokenSavings {
    pub id: String,
    pub command: String,
    pub tokens_saved: i64,
    pub executions: i64,
    pub created_at: String,
}

#[derive(Clone)]
pub struct RTKService {
    cache: Arc<Mutex<HashMap<String, (String, std::time::Instant)>>>,
    filters: Arc<Mutex<Vec<CommandFilter>>>,
}

impl RTKService {
    pub fn new() -> Self {
        let default_filters = vec![
            CommandFilter {
                command: "git status".to_string(),
                action: FilterAction::Cache,
                cache_ttl: Some(5),
            },
            CommandFilter {
                command: "ls".to_string(),
                action: FilterAction::Cache,
                cache_ttl: Some(10),
            },
            CommandFilter {
                command: "find".to_string(),
                action: FilterAction::Summarize,
                cache_ttl: None,
            },
            CommandFilter {
                command: "npm list".to_string(),
                action: FilterAction::Summarize,
                cache_ttl: None,
            },
        ];

        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            filters: Arc::new(Mutex::new(default_filters)),
        }
    }

    pub async fn should_filter(&self, command: &str, db: &SqlitePool) -> Option<FilterAction> {
        // Check if RTK is enabled
        let enabled: Result<(bool,), sqlx::Error> = sqlx::query_as(
            "SELECT rtk_enabled FROM settings WHERE id = 1"
        )
        .fetch_one(db)
        .await;
        
        if let Ok((rtk_enabled,)) = enabled {
            if !rtk_enabled {
                return None;
            }
        }
        
        if let Ok(filters) = self.filters.lock() {
            for filter in filters.iter() {
                if command.starts_with(&filter.command) {
                    return Some(filter.action.clone());
                }
            }
        }
        None
    }

    pub fn get_cached(&self, command: &str) -> Option<String> {
        if let Ok(cache) = self.cache.lock() {
            if let Some((output, timestamp)) = cache.get(command) {
                if timestamp.elapsed().as_secs() < 60 {
                    return Some(output.clone());
                }
            }
        }
        None
    }

    pub fn set_cache(&self, command: String, output: String) {
        if let Ok(mut cache) = self.cache.lock() {
            cache.insert(command, (output, std::time::Instant::now()));
        }
    }

    pub fn summarize_output(&self, output: &str) -> String {
        let lines: Vec<&str> = output.lines().collect();
        let total = lines.len();

        if total <= 20 {
            return output.to_string();
        }

        let preview = lines.iter().take(10).cloned().collect::<Vec<_>>().join("\n");
        format!("{}\n... ({} more lines, {} total)", preview, total - 10, total)
    }

    pub async fn record_savings(
        db: &SqlitePool,
        command: &str,
        tokens_saved: i64,
    ) -> AppResult<()> {
        let id = uuid::Uuid::new_v4().to_string();
        let created_at = now_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO token_savings (id, command, tokens_saved, executions, created_at)
            VALUES (?1, ?2, ?3, 1, ?4)
            ON CONFLICT(command) DO UPDATE SET
                tokens_saved = tokens_saved + ?3,
                executions = executions + 1
            "#,
        )
        .bind(&id)
        .bind(command)
        .bind(tokens_saved)
        .bind(&created_at)
        .execute(db)
        .await?;

        Ok(())
    }

    pub async fn get_savings(db: &SqlitePool) -> AppResult<Vec<TokenSavings>> {
        let savings = sqlx::query_as::<_, TokenSavings>(
            "SELECT id, command, tokens_saved, executions, created_at FROM token_savings ORDER BY tokens_saved DESC LIMIT 50"
        )
        .fetch_all(db)
        .await?;
        Ok(savings)
    }

    pub async fn get_total_savings(db: &SqlitePool) -> AppResult<i64> {
        let row: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(tokens_saved), 0) FROM token_savings")
            .fetch_one(db)
            .await?;
        Ok(row.0)
    }
}

impl Default for RTKService {
    fn default() -> Self {
        Self::new()
    }
}
