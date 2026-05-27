//! Flag Validator module for WASM
//! Provides CTF flag validation functionality

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use regex::Regex;
use sha2::{Sha256, Digest};
use serde_json::json;

// Simulated valid flags (in production, these would come from a backend)
const VALID_FLAGS: &[&str] = &[
    "FLAG{welcome_to_cyberedu}",
    "FLAG{basic_linux_commands}",
    "FLAG{network_scanning_master}",
    "FLAG{crypto_enthusiast}",
    "FLAG{log_analysis_expert}",
];

/// Submit a flag for validation
#[wasm_bindgen]
pub fn submit_flag(args: &str) -> String {
    let response = submit_flag_impl(args);
    serialize_response(&response)
}

fn submit_flag_impl(flag: &str) -> CommandResponse {
    if flag.is_empty() {
        return CommandResponse::error("Usage: flag <flag_value>".to_string());
    }

    // Validate flag format
    let flag_pattern = Regex::new(r"^FLAG\{[a-zA-Z0-9_]+\}$").unwrap();
    if !flag_pattern.is_match(flag) {
        return CommandResponse::error(
            "Invalid flag format. Flags should be in format: FLAG{something}".to_string()
        );
    }

    // Check if flag is valid
    if VALID_FLAGS.contains(&flag) {
        let hash = compute_flag_hash(flag);
        CommandResponse::success(format!(
            "\x1b[32m✓ Correct! Flag validated successfully!\x1b[0m\n\
             Points awarded: 100\n\
             Hash: {}",
            hash
        ))
    } else {
        CommandResponse::error(
            "\x1b[31m✗ Incorrect flag. Try again!\x1b[0m\n\
             Hint: Look for flags in files, logs, or network responses.".to_string()
        )
    }
}

/// Check if a flag exists (without submitting)
#[wasm_bindgen]
pub fn check_flag(args: &str) -> String {
    let response = check_flag_impl(args);
    serialize_response(&response)
}

fn check_flag_impl(flag: &str) -> CommandResponse {
    if flag.is_empty() {
        return CommandResponse::error("Usage: check_flag <flag_value>".to_string());
    }

    // Validate flag format first
    let flag_pattern = Regex::new(r"^FLAG\{[a-zA-Z0-9_]+\}$").unwrap();
    if !flag_pattern.is_match(flag) {
        return CommandResponse::error(
            "Invalid flag format. Flags should be in format: FLAG{something}".to_string()
        );
    }

    // Check existence without revealing if it's been submitted
    if VALID_FLAGS.contains(&flag) {
        CommandResponse::success(format!(
            "Flag '{}' exists in the system.\nSubmit it using: flag {}",
            flag, flag
        ))
    } else {
        // Don't reveal whether the flag doesn't exist or is invalid format
        CommandResponse::error(format!("Flag '{}' not found in the system.", flag))
    }
}

/// Compute a hash of a validated flag (for tracking purposes)
fn compute_flag_hash(flag: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(flag.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

/// Get list of available flag hints (for educational purposes)
#[wasm_bindgen]
pub fn get_flag_hints() -> String {
    let hints = vec![
        "Some flags are hidden in files you can read with 'cat'",
        "Network scans might reveal interesting information",
        "Check logs for suspicious patterns",
        "Crypto challenges require decryption skills",
    ];

    let mut output = String::from("\x1b[1mAvailable Hints:\x1b[0m\n");
    for (i, hint) in hints.iter().enumerate() {
        output.push_str(&format!("  {}. {}\n", i + 1, hint));
    }

    let response = CommandResponse::success(output);
    serialize_response(&response)
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
    fn test_submit_empty_flag() {
        let result = submit_flag_impl("");
        assert!(!result.success);
    }

    #[test]
    fn test_submit_invalid_format() {
        let result = submit_flag_impl("invalid_flag");
        assert!(!result.success);
        assert!(result.error.unwrap().contains("Invalid flag format"));
    }

    #[test]
    fn test_submit_valid_flag() {
        let result = submit_flag_impl("FLAG{welcome_to_cyberedu}");
        assert!(result.success);
        assert!(result.output.contains("Correct"));
    }

    #[test]
    fn test_submit_wrong_flag() {
        let result = submit_flag_impl("FLAG{wrong_answer}");
        assert!(!result.success);
        assert!(result.error.unwrap().contains("Incorrect"));
    }

    #[test]
    fn test_check_flag_valid() {
        let result = check_flag_impl("FLAG{basic_linux_commands}");
        assert!(result.success);
    }

    #[test]
    fn test_check_flag_invalid() {
        let result = check_flag_impl("FLAG{nonexistent}");
        assert!(!result.success);
    }

    #[test]
    fn test_flag_hash() {
        let hash1 = compute_flag_hash("FLAG{test}");
        let hash2 = compute_flag_hash("FLAG{test}");
        let hash3 = compute_flag_hash("FLAG{different}");
        
        assert_eq!(hash1, hash2);
        assert_ne!(hash1, hash3);
        assert_eq!(hash1.len(), 64); // SHA256 hex length
    }
}
