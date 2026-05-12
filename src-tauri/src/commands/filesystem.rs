use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::State;

use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<DirEntry>>,
    pub git_status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirTree {
    pub root: DirEntry,
}

#[tauri::command]
pub async fn read_directory_tree(
    path: String,
    max_depth: Option<usize>,
    _state: State<'_, AppState>,
) -> AppResult<DirTree> {
    let root_path = PathBuf::from(&path);
    
    if !root_path.exists() {
        return Err(crate::error::AppError::Internal("Path does not exist".into()));
    }

    let git_status = get_git_status_internal(&path).await.unwrap_or_default();
    let root = read_dir_recursive(&root_path, &root_path, max_depth.unwrap_or(5), 0, &git_status)?;

    Ok(DirTree { root })
}

fn read_dir_recursive(
    path: &Path,
    root: &Path,
    max_depth: usize,
    current_depth: usize,
    git_status: &HashMap<String, String>,
) -> AppResult<DirEntry> {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    
    let path_str = path.to_string_lossy().to_string();
    let relative_path = path.strip_prefix(root)
        .ok()
        .and_then(|p| p.to_str())
        .unwrap_or("")
        .to_string();
    
    let git_status_val = git_status.get(&relative_path).cloned();

    if !path.is_dir() {
        return Ok(DirEntry {
            name,
            path: path_str,
            is_dir: false,
            children: None,
            git_status: git_status_val,
        });
    }

    let mut children = Vec::new();

    if current_depth < max_depth {
        if let Ok(entries) = std::fs::read_dir(path) {
            let mut entries: Vec<_> = entries.filter_map(|e| e.ok()).collect();
            entries.sort_by(|a, b| {
                let a_is_dir = a.path().is_dir();
                let b_is_dir = b.path().is_dir();
                match (a_is_dir, b_is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.file_name().cmp(&b.file_name()),
                }
            });

            for entry in entries {
                let entry_path = entry.path();
                
                // Skip hidden files/dirs except .git
                if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with('.') && name != ".git" {
                        continue;
                    }
                    // Skip common build/dep dirs
                    if name == "node_modules" || name == "target" || name == "dist" || name == ".next" {
                        continue;
                    }
                }

                if let Ok(child) = read_dir_recursive(&entry_path, root, max_depth, current_depth + 1, git_status) {
                    children.push(child);
                }
            }
        }
    }

    Ok(DirEntry {
        name,
        path: path_str,
        is_dir: true,
        children: Some(children),
        git_status: git_status_val,
    })
}

#[tauri::command]
pub async fn get_file_content(
    path: String,
    _state: State<'_, AppState>,
) -> AppResult<String> {
    let content = std::fs::read_to_string(&path)
        .map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    Ok(content)
}

#[tauri::command]
pub async fn get_git_status(
    path: String,
    _state: State<'_, AppState>,
) -> AppResult<HashMap<String, String>> {
    get_git_status_internal(&path).await
}

async fn get_git_status_internal(path: &str) -> AppResult<HashMap<String, String>> {
    use std::process::Command;

    let output = Command::new("git")
        .args(&["status", "--porcelain"])
        .current_dir(path)
        .output();

    let output = match output {
        Ok(o) => o,
        Err(_) => return Ok(HashMap::new()), // Not a git repo
    };

    if !output.status.success() {
        return Ok(HashMap::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut status_map = HashMap::new();

    for line in stdout.lines() {
        if line.len() < 4 {
            continue;
        }

        let status_code = &line[0..2];
        let file_path = line[3..].trim();

        let status = match status_code.trim() {
            "M" | " M" | "MM" => "M",  // Modified
            "A" | "AM" => "A",          // Added
            "D" | " D" => "D",          // Deleted
            "R" => "R",                 // Renamed
            "C" => "C",                 // Copied
            "U" => "U",                 // Updated but unmerged
            "??" => "??",               // Untracked
            _ => "M",
        };

        status_map.insert(file_path.to_string(), status.to_string());
    }

    Ok(status_map)
}
