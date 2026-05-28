//! Filesystem module for WASM
//! Provides filesystem operations: listing, reading, creating files and directories
//! Note: This is a simulated filesystem for security reasons in the browser environment

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use std::collections::HashMap;

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
        directories.insert("/".to_string(), vec!["home".to_string(), "tmp".to_string(), "var".to_string(), "etc".to_string()]);
        directories.insert("/home".to_string(), vec!["user".to_string()]);
        directories.insert("/home/user".to_string(), vec![
            "documentos".to_string(),
            "descargas".to_string(),
        ]);
        directories.insert("/tmp".to_string(), vec![]);
        directories.insert("/var".to_string(), vec!["log".to_string()]);
        directories.insert("/var/log".to_string(), vec![]);
        directories.insert("/etc".to_string(), vec![]);

        // Initialize user files
        files.insert("/home/user/notas.txt".to_string(), 
            "Notas de estudio para el curso de ciberseguridad.".to_string());
        files.insert("/home/user/config.json".to_string(),
            "{\n  \"theme\": \"dark\",\n  \"language\": \"es\"\n}".to_string());
        files.insert("/home/user/secret.flag".to_string(),
            "FLAG{simulated_ctf_flag}".to_string());
        files.insert("/home/user/.secret_data".to_string(),
            "Acceso autorizado. FLAG{basic_linux_commands}".to_string());

        // Apache access log (simulated)
        files.insert("/var/log/access.log".to_string(),
            "192.168.1.10 - - [15/Jan/2024:10:00:01 +0000] \"GET /index.html HTTP/1.1\" 200 1234\n\
             192.168.1.20 - - [15/Jan/2024:10:00:02 +0000] \"POST /login HTTP/1.1\" 302 0\n\
             10.0.0.5 - - [15/Jan/2024:10:00:03 +0000] \"GET /admin HTTP/1.1\" 403 512\n\
             192.168.1.10 - - [15/Jan/2024:10:00:04 +0000] \"GET /api/users HTTP/1.1\" 200 4096\n\
             172.16.0.1 - - [15/Jan/2024:10:00:05 +0000] \"DELETE /api/resource/1 HTTP/1.1\" 204 0\n\
             192.168.1.30 - - [15/Jan/2024:10:00:06 +0000] \"GET /robots.txt HTTP/1.1\" 200 128\n\
             10.0.0.5 - - [15/Jan/2024:10:00:07 +0000] \"PUT /api/config HTTP/1.1\" 401 0\n\
             192.168.1.10 - - [15/Jan/2024:10:00:08 +0000] \"GET /dashboard HTTP/1.1\" 200 8192\n\
             203.0.113.50 - - [15/Jan/2024:10:00:09 +0000] \"POST /wp-login.php HTTP/1.1\" 404 312\n\
             192.168.1.40 - - [15/Jan/2024:10:00:10 +0000] \"GET /backup.sql HTTP/1.1\" 200 65536\n".to_string());

        // Apache error log (simulated)
        files.insert("/var/log/error.log".to_string(),
            "[Sun Jan 15 10:00:01.123456 2024] [core:notice] [pid 1234] AH00094: Command line: '/usr/sbin/apache2'\n\
             [Sun Jan 15 10:00:02.234567 2024] [mpm_prefork:notice] [pid 1234] AH00163: Apache/2.4.57 configured\n\
             [Sun Jan 15 10:00:03.345678 2024] [authz_core:error] [pid 1234] [client 10.0.0.5] AH01630: client denied by server configuration\n\
             [Sun Jan 15 10:00:04.456789 2024] [php:error] [pid 1234] [client 192.168.1.30] PHP Fatal error: Uncaught Error\n\
             [Sun Jan 15 10:00:05.567890 2024] [ssl:info] [pid 1234] [client 192.168.1.10] AH01964: Connection to child established\n\
             [Sun Jan 15 10:00:06.678901 2024] [proxy:error] [pid 1234] [client 203.0.113.50] AH00898: Error reading from remote server\n\
             [Sun Jan 15 10:00:07.789012 2024] [core:error] [pid 1234] [client 172.16.0.1] AH00035: access denied by rule\n\
             [Sun Jan 15 10:00:08.890123 2024] [ssl:warn] [pid 1234] AH01907: mod_md: restarting, will try again\n".to_string());

        // Auth/syslog (simulated)
        files.insert("/var/log/auth.log".to_string(),
            "Jan 15 10:00:01 server sshd[1234]: Accepted publickey for admin from 192.168.1.10 port 22 ssh2\n\
             Jan 15 10:00:02 server sshd[1235]: Failed password for root from 10.0.0.5 port 22 ssh2\n\
             Jan 15 10:00:03 server sshd[1236]: Failed password for root from 10.0.0.5 port 22 ssh2\n\
             Jan 15 10:00:04 server sshd[1237]: Failed password for root from 10.0.0.5 port 22 ssh2\n\
             Jan 15 10:00:05 server sshd[1238]: Connection closed by 10.0.0.5 port 22 [preauth]\n\
             Jan 15 10:00:06 server sudo: admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/cat /etc/shadow\n\
             Jan 15 10:00:07 server kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.50 DST=192.168.1.1 PROTO=TCP DPT=3306\n\
             Jan 15 10:00:08 server sshd[1239]: pam_unix(sshd:session): session opened for user deploy by (uid=0)\n\
             Jan 15 10:00:09 server sshd[1240]: Failed password for invalid user admin from 172.16.0.1 port 22 ssh2\n\
             Jan 15 10:00:10 server login[1241]: FAILED LOGIN (1) FOR 'admin', LOGIN ON 1 BY root\n".to_string());

        // Syslog
        files.insert("/var/log/syslog".to_string(),
            "Jan 15 10:00:01 server kernel: [    0.000000] Linux version 5.15.0-generic\n\
             Jan 15 10:00:02 server systemd[1]: Started Apache HTTP Server\n\
             Jan 15 10:00:03 server sshd[1234]: Server listening on 0.0.0.0 port 22\n\
             Jan 15 10:00:04 server kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.50 DST=192.168.1.1 PROTO=TCP DPT=3306\n\
             Jan 15 10:00:05 server cron[567]: (root) CMD (/usr/bin/backup.sh)\n\
             Jan 15 10:00:06 server nginx[789]: 2024/01/15 10:00:06 [notice] 789#0: signal process started\n\
             Jan 15 10:00:07 server kernel: [UFW BLOCK] IN=eth0 OUT= SRC=10.0.0.99 DST=192.168.1.1 PROTO=ICMP\n\
             Jan 15 10:00:08 server dockerd[901]: time=\"2024-01-15T10:00:08Z\" level=info msg=\"Container started\"\n".to_string());

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

pub fn list_directory_impl(path: &str) -> CommandResponse {
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

pub fn read_file_impl(path: &str) -> CommandResponse {
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

pub fn create_directory_impl(path: &str) -> CommandResponse {
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

pub fn create_file_impl(path: &str) -> CommandResponse {
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
