use crate::error::AppError;
use git2::{BranchType, Repository, StatusOptions};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    pub branch: String,
    pub files: Vec<GitFileStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitFileStatus {
    pub path: String,
    pub status: String, // "modified", "added", "deleted", "untracked", etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitBranch {
    pub name: String,
    pub is_current: bool,
}

pub struct GitService;

impl GitService {
    pub fn get_status(repo_path: &str) -> Result<GitStatus, AppError> {
        let repo = Repository::open(repo_path)
            .map_err(|e| AppError::Internal(format!("Failed to open git repo: {}", e)))?;

        let head = repo
            .head()
            .map_err(|e| AppError::Internal(format!("Failed to get HEAD: {}", e)))?;

        let branch = head
            .shorthand()
            .unwrap_or("(detached)")
            .to_string();

        let mut opts = StatusOptions::new();
        opts.include_untracked(true);
        opts.recurse_untracked_dirs(false);

        let statuses = repo
            .statuses(Some(&mut opts))
            .map_err(|e| AppError::Internal(format!("Failed to get status: {}", e)))?;

        let mut files = Vec::new();
        for entry in statuses.iter() {
            let path = entry.path().unwrap_or("?").to_string();
            let status_flags = entry.status();

            let status = if status_flags.is_wt_new() || status_flags.is_index_new() {
                "added"
            } else if status_flags.is_wt_modified() || status_flags.is_index_modified() {
                "modified"
            } else if status_flags.is_wt_deleted() || status_flags.is_index_deleted() {
                "deleted"
            } else if status_flags.is_wt_renamed() || status_flags.is_index_renamed() {
                "renamed"
            } else {
                "untracked"
            };

            files.push(GitFileStatus {
                path,
                status: status.to_string(),
            });
        }

        Ok(GitStatus { branch, files })
    }

    pub fn list_branches(repo_path: &str) -> Result<Vec<GitBranch>, AppError> {
        let repo = Repository::open(repo_path)
            .map_err(|e| AppError::Internal(format!("Failed to open git repo: {}", e)))?;

        let branches = repo
            .branches(Some(BranchType::Local))
            .map_err(|e| AppError::Internal(format!("Failed to list branches: {}", e)))?;

        let current_branch = repo
            .head()
            .ok()
            .and_then(|h| h.shorthand().map(|s| s.to_string()));

        let mut result = Vec::new();
        for branch in branches {
            let (branch, _) = branch.map_err(|e| AppError::Internal(format!("Branch error: {}", e)))?;
            let name = branch
                .name()
                .map_err(|e| AppError::Internal(format!("Failed to get branch name: {}", e)))?
                .unwrap_or("?")
                .to_string();

            let is_current = current_branch.as_ref().map(|c| c == &name).unwrap_or(false);

            result.push(GitBranch { name, is_current });
        }

        Ok(result)
    }

    pub fn checkout_branch(repo_path: &str, branch_name: &str) -> Result<(), AppError> {
        let repo = Repository::open(repo_path)
            .map_err(|e| AppError::Internal(format!("Failed to open git repo: {}", e)))?;

        let obj = repo
            .revparse_single(&format!("refs/heads/{}", branch_name))
            .map_err(|e| AppError::Internal(format!("Branch not found: {}", e)))?;

        repo.checkout_tree(&obj, None)
            .map_err(|e| AppError::Internal(format!("Checkout failed: {}", e)))?;

        repo.set_head(&format!("refs/heads/{}", branch_name))
            .map_err(|e| AppError::Internal(format!("Failed to set HEAD: {}", e)))?;

        Ok(())
    }

    pub fn create_commit(
        repo_path: &str,
        message: &str,
        files: Vec<String>,
    ) -> Result<String, AppError> {
        let repo = Repository::open(repo_path)
            .map_err(|e| AppError::Internal(format!("Failed to open git repo: {}", e)))?;

        let mut index = repo
            .index()
            .map_err(|e| AppError::Internal(format!("Failed to get index: {}", e)))?;

        for file in files {
            index
                .add_path(std::path::Path::new(&file))
                .map_err(|e| AppError::Internal(format!("Failed to add file: {}", e)))?;
        }

        index
            .write()
            .map_err(|e| AppError::Internal(format!("Failed to write index: {}", e)))?;

        let tree_id = index
            .write_tree()
            .map_err(|e| AppError::Internal(format!("Failed to write tree: {}", e)))?;

        let tree = repo
            .find_tree(tree_id)
            .map_err(|e| AppError::Internal(format!("Failed to find tree: {}", e)))?;

        let sig = repo
            .signature()
            .map_err(|e| AppError::Internal(format!("Failed to get signature: {}", e)))?;

        let parent_commit = repo
            .head()
            .ok()
            .and_then(|h| h.target())
            .and_then(|oid| repo.find_commit(oid).ok());

        let parents = if let Some(ref p) = parent_commit {
            vec![p]
        } else {
            vec![]
        };

        let oid = repo
            .commit(Some("HEAD"), &sig, &sig, message, &tree, &parents)
            .map_err(|e| AppError::Internal(format!("Failed to create commit: {}", e)))?;

        Ok(oid.to_string())
    }
}
