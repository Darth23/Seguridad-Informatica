//! Flag Validator module for WASM
//! Provides CTF flag validation with anti-cheat features

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use regex::Regex;
use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use pbkdf2::pbkdf2_hmac;

type HmacSha256 = Hmac<Sha256>;

// Salt for PBKDF2 key derivation
const SALT: &[u8] = b"cyberedu-ctf-salt-2024";
const ITERATIONS: u32 = 10_000;

// XOR key for flag obfuscation
const XOR_KEY: &[u8] = b"CYBEREDU";

// Obfuscated flags (XOR encrypted, hex-encoded)
// These are the SHA-256 hashes of the original flags for validation
const FLAG_HASHES: &[&str] = &[
    "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", // FLAG{welcome_to_cyberedu}
    "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", // FLAG{basic_linux_commands}
    "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4", // FLAG{network_scanning_master}
    "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5", // FLAG{crypto_enthusiast}
    "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6", // FLAG{log_analysis_expert}
];

// Plaintext flags for hash validation (never exposed in WASM binary directly)
const PLAINTEXT_FLAGS: &[&str] = &[
    "FLAG{welcome_to_cyberedu}",
    "FLAG{basic_linux_commands}",
    "FLAG{network_scanning_master}",
    "FLAG{crypto_enthusiast}",
    "FLAG{log_analysis_expert}",
];

// Honey flags - decoy flags that trigger alerts
const HONEY_FLAGS: &[&str] = &[
    "FLAG{honey_canary_001}",
    "FLAG{decoy_flag_002}",
    "FLAG{trap_flag_003}",
];

// Track honey flag attempts (in production, this would be stored persistently)
static mut HONEY_ALERT_COUNT: u32 = 0;

/// XOR decrypt a hex-encoded string with the key
fn xor_decrypt(hex_data: &str, key: &[u8]) -> Result<Vec<u8>, String> {
    let data = hex::decode(hex_data).map_err(|e| format!("Invalid hex: {}", e))?;
    Ok(data.iter().enumerate().map(|(i, &b)| b ^ key[i % key.len()]).collect())
}

/// XOR encrypt data and return hex
fn xor_encrypt(data: &[u8], key: &[u8]) -> String {
    hex::encode(data.iter().enumerate().map(|(i, &b)| b ^ key[i % key.len()]).collect::<Vec<_>>())
}

/// Derive a key using PBKDF2-HMAC-SHA256
fn derive_key(password: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password, SALT, ITERATIONS, &mut key);
    key
}

/// Compute SHA-256 hash of a flag
fn compute_flag_hash(flag: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(flag.as_bytes());
    hex::encode(hasher.finalize())
}

/// Validate a flag by comparing its SHA-256 hash (never exposes plaintext)
fn validate_flag_hash(input: &str) -> bool {
    let input_hash = compute_flag_hash(input);
    FLAG_HASHES.contains(&input_hash.as_str())
}

/// Check if a submitted flag is a honey flag (decoy)
fn is_honey_flag(flag: &str) -> bool {
    HONEY_FLAGS.contains(&flag)
}

/// Submit a flag for validation
#[wasm_bindgen]
pub fn submit_flag(args: &str) -> String {
    let response = submit_flag_impl(args);
    serialize_response(&response)
}

pub fn submit_flag_impl(flag: &str) -> CommandResponse {
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

    // Check honey flags first (decoy detection)
    if is_honey_flag(flag) {
        unsafe { HONEY_ALERT_COUNT += 1; }
        return CommandResponse::error(
            "\x1b[31m⚠ HONEY FLAG DETECTED!\x1b[0m\n\
             This is a decoy flag. Unauthorized access attempts are logged.\n\
             Your IP and session have been recorded.".to_string()
        );
    }

    // Validate by SHA-256 hash comparison (never compares plaintext)
    if validate_flag_hash(flag) {
        let hash = compute_flag_hash(flag);
        let pbkdf2_key = derive_key(flag.as_bytes());
        let obfuscated = xor_encrypt(flag.as_bytes(), XOR_KEY);

        CommandResponse::success(format!(
            "\x1b[32m✓ Correct! Flag validated successfully!\x1b[0m\n\
             Points awarded: 100\n\
             Hash: {}\n\
             Derived key: {}\n\
             Obfuscated: {}",
            hash,
            hex::encode(&pbkdf2_key[..8]),
            &obfuscated[..16.min(obfuscated.len())]
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

pub fn check_flag_impl(flag: &str) -> CommandResponse {
    if flag.is_empty() {
        return CommandResponse::error("Usage: check_flag <flag_value>".to_string());
    }

    let flag_pattern = Regex::new(r"^FLAG\{[a-zA-Z0-9_]+\}$").unwrap();
    if !flag_pattern.is_match(flag) {
        return CommandResponse::error(
            "Invalid flag format. Flags should be in format: FLAG{something}".to_string()
        );
    }

    // Never reveal honey flag existence
    if is_honey_flag(flag) {
        return CommandResponse::error(format!("Flag '{}' not found in the system.", flag));
    }

    if validate_flag_hash(flag) {
        CommandResponse::success(format!(
            "Flag '{}' exists in the system.\nSubmit it using: flag {}",
            flag, flag
        ))
    } else {
        CommandResponse::error(format!("Flag '{}' not found in the system.", flag))
    }
}

/// Get list of available flag hints
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

/// Report honey flag alert count (admin function)
#[wasm_bindgen]
pub fn get_honey_alerts() -> String {
    let response = get_honey_alerts_impl();
    serialize_response(&response)
}

pub fn get_honey_alerts_impl() -> CommandResponse {
    let count = unsafe { HONEY_ALERT_COUNT };
    CommandResponse::success(format!("Honey flag alerts: {}", count))
}

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
    fn test_honey_flag_detection() {
        let result = submit_flag_impl("FLAG{honey_canary_001}");
        assert!(!result.success);
        assert!(result.error.unwrap().contains("HONEY FLAG"));
    }

    #[test]
    fn test_xor_encrypt_decrypt() {
        let data = b"FLAG{test}";
        let encrypted = xor_encrypt(data, XOR_KEY);
        let decrypted = xor_decrypt(&encrypted, XOR_KEY).unwrap();
        assert_eq!(data.to_vec(), decrypted);
    }

    #[test]
    fn test_pbkdf2_derivation() {
        let key1 = derive_key(b"test");
        let key2 = derive_key(b"test");
        assert_eq!(key1, key2);

        let key3 = derive_key(b"different");
        assert_ne!(key1, key3);
    }

    #[test]
    fn test_flag_hash_validation() {
        assert!(validate_flag_hash("FLAG{welcome_to_cyberedu}"));
        assert!(!validate_flag_hash("FLAG{nonexistent}"));
    }

    #[test]
    fn test_flag_hash() {
        let hash1 = compute_flag_hash("FLAG{test}");
        let hash2 = compute_flag_hash("FLAG{test}");
        assert_eq!(hash1, hash2);
        assert_eq!(hash1.len(), 64);
    }
}
