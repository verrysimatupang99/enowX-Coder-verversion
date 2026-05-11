use crate::models::FileNode;
use crate::services::file_service::FileService;

#[tauri::command]
pub async fn list_files(path: String) -> Result<Vec<FileNode>, String> {
    FileService::list_files(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    FileService::read_file(&path).map_err(|e| e.to_string())
}
