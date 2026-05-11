use crate::services::git_service::{GitBranch, GitService, GitStatus};

#[tauri::command]
pub async fn git_status(repo_path: String) -> Result<GitStatus, String> {
    GitService::get_status(&repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_list_branches(repo_path: String) -> Result<Vec<GitBranch>, String> {
    GitService::list_branches(&repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_checkout_branch(repo_path: String, branch_name: String) -> Result<(), String> {
    GitService::checkout_branch(&repo_path, &branch_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_commit(
    repo_path: String,
    message: String,
    files: Vec<String>,
) -> Result<String, String> {
    GitService::create_commit(&repo_path, &message, files).map_err(|e| e.to_string())
}
