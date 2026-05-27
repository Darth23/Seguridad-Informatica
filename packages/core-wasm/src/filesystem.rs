//! Filesystem module for WASM
//! Provides filesystem operations: listing, reading, creating files and directories
//! Note: This is a simulated filesystem for security reasons in the browser environment

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use std::collections::HashMap;
use serde_json::json;

// Simulated in-memory filesystem
// In a real application, this would interface with the actual filesystem via JS
static mut FILESYSTEM: Option<FilesystemState> = None;

struct FilesystemState {
    current_dir: String,
    directories: HashMap<String, Vec<String>>,
    files: HashMap<String, String>,
}

impl FilesystemState {
    fn new() -> Self {
        let mut directories = HashMap::new();
        let mut files = HashMap::new();

        // Initialize root directory
        directories.insert("/".to_string(), vec!["home".to_string(), "tmp".to_string()]);
        directories.insert("/home".to_string(), vec!["user".to_string()]);
        directories.insert("/home/user".to_string(), vec![
            "documentos".to_string(),
            "descargas".to_string(),
        ]);
        directories.insert("/tmp".to_string(), vec![]);

        // Initialize some files
        files.insert("/home/user/notas.txt".to_string(), 
            "Notas de estudio para el curso de ciberseguridad.".to_string());
        files.insert("/home/user/config.json".to_string(),
            "{\n  \"theme\": \"dark\",\n  \"language\": \"es\"\n}".to_string());
        files.insert("/home/user/secret.flag".to_string(),
            "FLAG{simulated_ctf_flag}".to_string());

        FilesystemState {
            current_dir: "/home/user".to_string(),
            directories,
            files,
        }
    }
}

fn get_filesystem() -> &'static mut FilesystemState {
    unsafe {
        if FILESYSTEM.is_none() {
            FILESYSTEM = Some(FilesystemState::new());
        }
        FILESYSTEM.as_mut().unwrap()
    }
}

/// List directory contents
#[wasm_bindgen]
pub fn list_directory(args: &str) -> String {
    let response = list_directory_impl(args);
    serialize_response(&response)
}

fn list_directory_impl(path: &str) -> CommandResponse {
    let fs = get_filesystem();
    
    let target_path = if path.is_empty() {
        fs.current_dir.clone()
    } else {
        resolve_path(&fs.current_dir, path)
    };

    let dirs = fs.directories.get(&target_path);
    let mut output = String::new();

    if let Some(entries) = dirs {
        // Add subdirectories (blue)
        for dir in entries {
            output.push_str(&format!("\x1b[1;34m{}/\x1b[0m  ", dir));
        }

        // Add files from the files map
        for (file_path, _content) in &fs.files {
            if let Some(parent) = parent_path(file_path) {
                if parent == target_path {
                    let filename = file_path.rsplit('/').next().unwrap_or("");
                    if filename.ends_with(".flag") {
                        output.push_str(&format!("\x1b[31m{}\x1b[0m  ", filename));
                    } else if filename.ends_with(".json") {
                        output.push_str(&format!("\x1b[35m{}\x1b[0m  ", filename));
                    } else if filename.ends_with(".txt") {
                        output.push_str(&format!("\x1b[32m{}\x1b[0m  ", filename));
                    } else {
                        output.push_str(&format!("{}  ", filename));
                    }
                }
            }
        }

        if output.is_empty() {
            CommandResponse::success(format!("Directory {} is empty", target_path))
        } else {
            CommandResponse::success(output.trim().to_string())
        }
    } else {
        CommandResponse::error(format!("ls: cannot access '{}': No such directory", path))
    }
}

/// Read file contents
#[wasm_bindgen]
pub fn read_file(args: &str) -> String {
    let response = read_file_impl(args);
    serialize_response(&response)
}

fn read_file_impl(path: &str) -> CommandResponse {
    if path.is_empty() {
        return CommandResponse::error("cat: missing file operand".to_string());
    }

    let fs = get_filesystem();
    let full_path = resolve_path(&fs.current_dir, path);

    if let Some(content) = fs.files.get(&full_path) {
        // Special handling for flag files (simulated access control)
        if full_path.contains("secret.flag") {
            return CommandResponse::success(
                "\x1b[31m⚠️ Acceso denegado. Necesitas permisos de root.\x1b[0m".to_string()
            );
        }
        CommandResponse::success(content.clone())
    } else {
        // Check if it's a directory
        if fs.directories.contains_key(&full_path) {
            CommandResponse::error(format!("cat: {}: Is a directory", path))
        } else {
            CommandResponse::error(format!("cat: {}: No such file or directory", path))
        }
    }
}

/// Create a new directory
#[wasm_bindgen]
pub fn create_directory(args: &str) -> String {
    let response = create_directory_impl(args);
    serialize_response(&response)
}

fn create_directory_impl(path: &str) -> CommandResponse {
    if path.is_empty() {
        return CommandResponse::error("mkdir: missing operand".to_string());
    }

    let fs = get_filesystem();
    let full_path = resolve_path(&fs.current_dir, path);

    if let Some(parent) = parent_path(&full_path) {
        if !fs.directories.contains_key(&parent) {
            return CommandResponse::error(format!(
                "mkdir: cannot create directory '{}': No such parent directory",
                path
            ));
        }

        if fs.directories.contains_key(&full_path) {
            return CommandResponse::error(format!(
                "mkdir: cannot create directory '{}': File exists",
                path
            ));
        }

        let dir_name = full_path.rsplit('/').next().unwrap_or(path).to_string();
        if let Some(parent_entries) = fs.directories.get_mut(&parent) {
            parent_entries.push(dir_name);
        }
        fs.directories.insert(full_path, vec![]);

        CommandResponse::success(format!("Directory '{}' created", path))
    } else {
        CommandResponse::error(format!("mkdir: invalid path '{}'", path))
    }
}

/// Create a new file
#[wasm_bindgen]
pub fn create_file(args: &str) -> String {
    let response = create_file_impl(args);
    serialize_response(&response)
}

fn create_file_impl(path: &str) -> CommandResponse {
    if path.is_empty() {
        return CommandResponse::error("touch: missing file operand".to_string());
    }

    let fs = get_filesystem();
    let full_path = resolve_path(&fs.current_dir, path);

    if let Some(parent) = parent_path(&full_path) {
        if !fs.directories.contains_key(&parent) && parent != "/" {
            return CommandResponse::error(format!(
                "touch: cannot touch '{}': No such directory",
                path
            ));
        }

        // Create or update file
        fs.files.entry(full_path).or_insert(String::new());

        CommandResponse::success(format!("File '{}' created/updated", path))
    } else {
        CommandResponse::error(format!("touch: invalid path '{}'", path))
    }
}

/// Resolve a path relative to current directory
fn resolve_path(current: &str, path: &str) -> String {
    if path.starts_with('/') {
        return path.to_string();
    }

    if path == "." {
        return current.to_string();
    }

    if path == ".." {
        return parent_path(current).unwrap_or("/".to_string());
    }

    format!("{}/{}", current.trim_end_matches('/'), path)
}

/// Get parent directory of a path
fn parent_path(path: &str) -> Option<String> {
    if path == "/" || path.is_empty() {
        return None;
    }
    
    let parent = path.rsplit_once('/')?;
    if parent.0.is_empty() {
        Some("/".to_string())
    } else {
        Some(parent.0.to_string())
    }
}

/// Helper to serialize response
fn serialize_response(response: &CommandResponse) -> String {
    serde_json::to_string(response).unwrap_or_else(|e| {
        serde_json::to_string(&CommandResponse::error(format!("Serialization error: {}", e)))
            .unwrap()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_root() {
        let result = list_directory_impl("/");
        assert!(result.success);
    }

    #[test]
    fn test_read_file() {
        let result = read_file_impl("notas.txt");
        assert!(result.success);
    }

    #[test]
    fn test_read_nonexistent_file() {
        let result = read_file_impl("nonexistent.txt");
        assert!(!result.success);
    }

    #[test]
    fn test_resolve_path() {
        assert_eq!(resolve_path("/home/user", "docs"), "/home/user/docs");
        assert_eq!(resolve_path("/home/user", "/tmp"), "/tmp");
        assert_eq!(resolve_path("/home/user", ".."), "/home");
    }

    #[test]
    fn test_parent_path() {
        assert_eq!(parent_path("/home/user"), Some("/home".to_string()));
        assert_eq!(parent_path("/home"), Some("/".to_string()));
        assert_eq!(parent_path("/"), None);
    }
}
