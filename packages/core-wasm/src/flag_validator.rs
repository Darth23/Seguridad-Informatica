//! Flag Validator module for WASM
//! Provides CTF flag validation with anti-cheat features

use wasm_bindgen::prelude::*;
use crate::{CommandResponse, challenge};
use regex::Regex;
use sha2::{Sha256, Digest};
use pbkdf2::pbkdf2_hmac;

const SALT: &[u8] = b"cyberedu-ctf-salt-2024";
const ITERATIONS: u32 = 10_000;
const XOR_KEY: &[u8] = b"CYBEREDU";

// SHA-256 hashes of valid flags (never exposes plaintext)
const FLAG_HASHES: &[&str] = &[
    "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
];

const HONEY_FLAGS: &[&str] = &[
    "FLAG{honey_canary_001}",
    "FLAG{decoy_flag_002}",
    "FLAG{trap_flag_003}",
];

static mut HONEY_ALERT_COUNT: u32 = 0;

fn xor_encrypt(data: &[u8], key: &[u8]) -> String {
    hex::encode(data.iter().enumerate().map(|(i, &b)| b ^ key[i % key.len()]).collect::<Vec<_>>())
}

fn derive_key(password: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password, SALT, ITERATIONS, &mut key);
    key
}

fn compute_flag_hash(flag: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(flag.as_bytes());
    hex::encode(hasher.finalize())
}

fn validate_flag_hash(input: &str) -> bool {
    let input_hash = compute_flag_hash(input);
    FLAG_HASHES.contains(&input_hash.as_str())
}

fn is_honey_flag(flag: &str) -> bool {
    HONEY_FLAGS.contains(&flag)
}

#[wasm_bindgen]
pub fn submit_flag(args: &str) -> String {
    let response = submit_flag_impl(args);
    serialize_response(&response)
}

pub fn submit_flag_impl(flag: &str) -> CommandResponse {
    if flag.is_empty() {
        return CommandResponse::error("Usage: flag <flag_value_or_port>".to_string());
    }

    // Check if the input is a numeric port (dynamic challenge mode)
    if let Ok(port) = flag.trim().parse::<u32>() {
        let backdoor_port = challenge::get_backdoor_port();
        if challenge::is_initialized() && port == backdoor_port {
            return CommandResponse::success(format!(
                "\x1b[32m✓ Correct! Puerto {} validado como backdoor.\x1b[0m\n\
                 Points awarded: 200\n\
                 Has completado el reto de redes de Modulo 0.2!",
                port
            ));
        } else {
            return CommandResponse::error(format!(
                "\x1b[31m✗ Puerto {} no es el backdoor correcto.\x1b[0m\n\
                 Hint: Usa nmap para descubrir que IP esta activa en tu segmento 10.0.2.0/24 y que puerto anomalo tiene abierto.",
                port
            ));
        }
    }

    // Traditional FLAG{} format validation
    let flag_pattern = Regex::new(r"^FLAG\{[a-zA-Z0-9_]+\}$").unwrap();
    if !flag_pattern.is_match(flag) {
        return CommandResponse::error(
            "Invalid format. Use: flag <port_number> or flag FLAG{...}".to_string()
        );
    }

    if is_honey_flag(flag) {
        unsafe { HONEY_ALERT_COUNT += 1; }
        return CommandResponse::error(
            "\x1b[31m⚠ HONEY FLAG DETECTED!\x1b[0m\n\
             This is a decoy flag. Unauthorized access attempts are logged.".to_string()
        );
    }

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

    serialize_response(&CommandResponse::success(output))
}

#[wasm_bindgen]
pub fn get_honey_alerts() -> String {
    serialize_response(&get_honey_alerts_impl())
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
    }

    #[test]
    fn test_honey_flag_detection() {
        let result = submit_flag_impl("FLAG{honey_canary_001}");
        assert!(!result.success);
        assert!(result.error.unwrap().contains("HONEY FLAG"));
    }

    #[test]
    fn test_xor_encrypt() {
        let data = b"FLAG{test}";
        let encrypted = xor_encrypt(data, XOR_KEY);
        assert_eq!(encrypted.len(), data.len() * 2);
    }

    #[test]
    fn test_pbkdf2_derivation() {
        let key1 = derive_key(b"test");
        let key2 = derive_key(b"test");
        assert_eq!(key1, key2);
    }

    #[test]
    fn test_flag_hash() {
        let hash = compute_flag_hash("FLAG{test}");
        assert_eq!(hash.len(), 64);
    }
}
