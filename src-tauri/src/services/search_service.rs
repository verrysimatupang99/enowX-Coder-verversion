use crate::error::AppError;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub file_path: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub matches: Vec<SearchMatch>,
    pub total_matches: usize,
    pub files_searched: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceResult {
    pub file_path: String,
    pub replacements: usize,
}

pub struct SearchService;

impl SearchService {
    pub fn search_in_files(
        root_path: &str,
        query: &str,
        is_regex: bool,
        case_sensitive: bool,
        file_pattern: Option<&str>,
        exclude_patterns: Option<Vec<String>>,
    ) -> Result<SearchResult, AppError> {
        let root = Path::new(root_path);
        if !root.exists() {
            return Err(AppError::NotFound(format!(
                "Path does not exist: {}",
                root_path
            )));
        }

        let pattern = if is_regex {
            if case_sensitive {
                Regex::new(query)
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            } else {
                Regex::new(&format!("(?i){}", query))
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            }
        } else {
            let escaped = regex::escape(query);
            if case_sensitive {
                Regex::new(&escaped)
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            } else {
                Regex::new(&format!("(?i){}", escaped))
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            }
        };

        let file_filter = file_pattern.and_then(|p| Regex::new(p).ok());
        let exclude_filters: Vec<Regex> = exclude_patterns
            .unwrap_or_default()
            .iter()
            .filter_map(|p| Regex::new(p).ok())
            .collect();

        let mut matches = Vec::new();
        let mut files_searched = 0;

        for entry in WalkDir::new(root)
            .follow_links(false)
            .into_iter()
            .filter_entry(|e| {
                let path = e.path();
                let path_str = path.to_string_lossy();

                if path_str.contains("/.git/")
                    || path_str.contains("/node_modules/")
                    || path_str.contains("/target/")
                    || path_str.contains("/dist/")
                {
                    return false;
                }

                for exclude in &exclude_filters {
                    if exclude.is_match(&path_str) {
                        return false;
                    }
                }

                true
            })
        {
            let entry = entry.map_err(|e| AppError::Io(e.to_string()))?;
            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            if let Some(ref filter) = file_filter {
                if !filter.is_match(&path.to_string_lossy()) {
                    continue;
                }
            }

            files_searched += 1;

            let content = match fs::read_to_string(path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            for (line_num, line) in content.lines().enumerate() {
                for mat in pattern.find_iter(line) {
                    matches.push(SearchMatch {
                        file_path: path.to_string_lossy().to_string(),
                        line_number: line_num + 1,
                        line_content: line.to_string(),
                        match_start: mat.start(),
                        match_end: mat.end(),
                    });
                }
            }
        }

        Ok(SearchResult {
            total_matches: matches.len(),
            matches,
            files_searched,
        })
    }

    pub fn replace_in_file(
        file_path: &str,
        search: &str,
        replace: &str,
        is_regex: bool,
        case_sensitive: bool,
    ) -> Result<ReplaceResult, AppError> {
        let path = Path::new(file_path);
        if !path.exists() {
            return Err(AppError::NotFound(format!(
                "File does not exist: {}",
                file_path
            )));
        }

        let content = fs::read_to_string(path)
            .map_err(|e| AppError::Io(format!("Failed to read file: {}", e)))?;

        let pattern = if is_regex {
            if case_sensitive {
                Regex::new(search)
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            } else {
                Regex::new(&format!("(?i){}", search))
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            }
        } else {
            let escaped = regex::escape(search);
            if case_sensitive {
                Regex::new(&escaped)
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            } else {
                Regex::new(&format!("(?i){}", escaped))
                    .map_err(|e| AppError::Internal(format!("Invalid regex: {}", e)))?
            }
        };

        let replacements = pattern.find_iter(&content).count();
        let new_content = pattern.replace_all(&content, replace);

        fs::write(path, new_content.as_bytes())
            .map_err(|e| AppError::Io(format!("Failed to write file: {}", e)))?;

        Ok(ReplaceResult {
            file_path: file_path.to_string(),
            replacements,
        })
    }

    pub fn replace_in_files(
        file_paths: Vec<String>,
        search: &str,
        replace: &str,
        is_regex: bool,
        case_sensitive: bool,
    ) -> Result<Vec<ReplaceResult>, AppError> {
        let mut results = Vec::new();

        for file_path in file_paths {
            match Self::replace_in_file(&file_path, search, replace, is_regex, case_sensitive) {
                Ok(result) => results.push(result),
                Err(e) => {
                    log::warn!("Failed to replace in {}: {}", file_path, e);
                }
            }
        }

        Ok(results)
    }
}
