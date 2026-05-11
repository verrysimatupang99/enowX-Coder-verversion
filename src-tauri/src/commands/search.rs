use crate::error::AppResult;
use crate::services::search_service::{ReplaceResult, SearchResult, SearchService};

#[tauri::command]
pub async fn search_in_files(
    root_path: String,
    query: String,
    is_regex: bool,
    case_sensitive: bool,
    file_pattern: Option<String>,
    exclude_patterns: Option<Vec<String>>,
) -> AppResult<SearchResult> {
    SearchService::search_in_files(
        &root_path,
        &query,
        is_regex,
        case_sensitive,
        file_pattern.as_deref(),
        exclude_patterns,
    )
}

#[tauri::command]
pub async fn replace_in_file(
    file_path: String,
    search: String,
    replace: String,
    is_regex: bool,
    case_sensitive: bool,
) -> AppResult<ReplaceResult> {
    SearchService::replace_in_file(&file_path, &search, &replace, is_regex, case_sensitive)
}

#[tauri::command]
pub async fn replace_in_files(
    file_paths: Vec<String>,
    search: String,
    replace: String,
    is_regex: bool,
    case_sensitive: bool,
) -> AppResult<Vec<ReplaceResult>> {
    SearchService::replace_in_files(file_paths, &search, &replace, is_regex, case_sensitive)
}
