use crate::error::AppError;
use crate::models::FileNode;
use std::fs;
use std::path::Path;

pub struct FileService;

impl FileService {
    pub fn list_files(path: &str) -> Result<Vec<FileNode>, AppError> {
        let root = Path::new(path);

        if !root.exists() {
            return Err(AppError::NotFound(format!("Path not found: {}", path)));
        }

        if !root.is_dir() {
            return Err(AppError::Validation("Path is not a directory".to_string()));
        }

        let mut nodes = Vec::new();
        let entries = fs::read_dir(root)
            .map_err(|e| AppError::Io(format!("Failed to read directory: {}", e)))?;

        for entry in entries {
            let entry = entry.map_err(|e| AppError::Io(format!("Failed to read entry: {}", e)))?;
            let path = entry.path();
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("?")
                .to_string();

            // Skip hidden files/folders
            if name.starts_with('.') {
                continue;
            }

            let is_directory = path.is_dir();
            let path_str = path.to_string_lossy().to_string();

            let children = if is_directory {
                Some(Self::list_files_recursive(&path, 1)?)
            } else {
                None
            };

            nodes.push(FileNode {
                name,
                path: path_str,
                is_directory,
                children,
            });
        }

        // Sort: directories first, then alphabetically
        nodes.sort_by(|a, b| match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });

        Ok(nodes)
    }

    fn list_files_recursive(path: &Path, depth: usize) -> Result<Vec<FileNode>, AppError> {
        // Limit recursion depth to avoid performance issues
        if depth > 3 {
            return Ok(Vec::new());
        }

        let mut nodes = Vec::new();
        let entries = fs::read_dir(path)
            .map_err(|e| AppError::Io(format!("Failed to read directory: {}", e)))?;

        for entry in entries {
            let entry = entry.map_err(|e| AppError::Io(format!("Failed to read entry: {}", e)))?;
            let path = entry.path();
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("?")
                .to_string();

            // Skip hidden files/folders
            if name.starts_with('.') {
                continue;
            }

            let is_directory = path.is_dir();
            let path_str = path.to_string_lossy().to_string();

            let children = if is_directory {
                Some(Self::list_files_recursive(&path, depth + 1)?)
            } else {
                None
            };

            nodes.push(FileNode {
                name,
                path: path_str,
                is_directory,
                children,
            });
        }

        // Sort: directories first, then alphabetically
        nodes.sort_by(|a, b| match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });

        Ok(nodes)
    }

    pub fn read_file(path: &str) -> Result<String, AppError> {
        let content = fs::read_to_string(path)
            .map_err(|e| AppError::Io(format!("Failed to read file: {}", e)))?;
        Ok(content)
    }
}
