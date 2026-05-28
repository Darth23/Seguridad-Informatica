//! Core WASM module for CyberEdu Zero-Trust Academy
//! 
//! This module provides core functionality exposed to JavaScript via wasm-bindgen

pub mod network;
pub mod crypto;
pub mod log_analyzer;
pub mod filesystem;
pub mod flag_validator;
pub mod rate_limiter;

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

// Initialize console error panic hook for better error messages in development
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Result type for WASM operations
pub type WasmResult<T> = Result<T, JsValue>;

/// Command response structure
#[derive(Serialize, Deserialize)]
pub struct CommandResponse {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
}

impl CommandResponse {
    pub fn success(output: String) -> Self {
        CommandResponse {
            success: true,
            output,
            error: None,
        }
    }

    pub fn error(error: String) -> Self {
        CommandResponse {
            success: false,
            output: String::new(),
            error: Some(error),
        }
    }
}

/// Process a command and return the result as JSON string
#[wasm_bindgen]
pub fn process_command(command: &str, args: &str) -> String {
    let response = execute_command(command, args);
    serde_json::to_string(&response).unwrap_or_else(|e| {
        serde_json::to_string(&CommandResponse::error(format!("Serialization error: {}", e)))
            .unwrap()
    })
}

/// Execute a command and return structured response
fn execute_command(command: &str, args: &str) -> CommandResponse {
    match command {
        // Network commands
        "nmap" => network::scan_host_impl(args),
        "scan_network" => network::scan_network_impl(),
        "ping" => network::ping_host_impl(args),
        "http_get" => network::http_get_impl(args),
        
        // Crypto commands
        "hash" => crypto::hash_data_impl(args),
        "encrypt" => crypto::encrypt_data_impl(args),
        "decrypt" => crypto::decrypt_data_impl(args),
        "generate_key" => crypto::generate_key_impl(args),
        
        // Log analysis commands
        "analyze_log" => log_analyzer::analyze_impl(args),
        "search_log" => log_analyzer::search_impl(args),
        
        // Filesystem commands
        "ls" => filesystem::list_directory_impl(args),
        "cat" => filesystem::read_file_impl(args),
        "mkdir" => filesystem::create_directory_impl(args),
        "touch" => filesystem::create_file_impl(args),
        
        // Flag validation commands
        "flag" => flag_validator::submit_flag_impl(args),
        "check_flag" => flag_validator::check_flag_impl(args),
        "honey_alerts" => flag_validator::get_honey_alerts_impl(),
        
        // Rate limiter commands
        "rate_check" => rate_limiter::check_rate_impl(args),
        "rate_reset" => rate_limiter::reset_rate_impl(args),
        
        _ => CommandResponse::error(format!("Unknown command: {}", command)),
    }
}

/// Get WASM module version
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Health check endpoint
#[wasm_bindgen]
pub fn health_check() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_check() {
        assert!(health_check());
    }

    #[test]
    fn test_version() {
        let version = get_version();
        assert!(!version.is_empty());
    }

    #[test]
    fn test_unknown_command() {
        let response = execute_command("unknown_cmd", "");
        assert!(!response.success);
        assert!(response.error.is_some());
    }
}
