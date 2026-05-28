//! Crypto module for WASM
//! Provides cryptographic functionality: hashing, encryption, decryption, key generation

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use sha2::{Sha256, Sha512, Digest};
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use aes_gcm::aead::Aead;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use rand::RngCore;

/// Hash data using specified algorithm
#[wasm_bindgen]
pub fn hash_data(args: &str) -> String {
    let response = hash_data_impl(args);
    serialize_response(&response)
}

pub fn hash_data_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error("Usage: hash <algorithm>:<data>".to_string());
    }

    let parts: Vec<&str> = args.splitn(2, ':').collect();
    if parts.len() != 2 {
        return CommandResponse::error("Invalid format. Usage: hash <algorithm>:<data>".to_string());
    }

    let algorithm = parts[0].to_lowercase();
    let data = parts[1];

    match algorithm.as_str() {
        "sha256" => {
            let mut hasher = Sha256::new();
            hasher.update(data.as_bytes());
            let result = hasher.finalize();
            let hex_output = hex::encode(result);
            CommandResponse::success(format!("SHA256: {}", hex_output))
        }
        "sha512" => {
            let mut hasher = Sha512::new();
            hasher.update(data.as_bytes());
            let result = hasher.finalize();
            let hex_output = hex::encode(result);
            CommandResponse::success(format!("SHA512: {}", hex_output))
        }
        _ => CommandResponse::error(format!("Unknown algorithm: {}. Supported: sha256, sha512", algorithm)),
    }
}

/// Encrypt data using AES-256-GCM
#[wasm_bindgen]
pub fn encrypt_data(args: &str) -> String {
    let response = encrypt_data_impl(args);
    serialize_response(&response)
}

pub fn encrypt_data_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error("Usage: encrypt <key>:<data>".to_string());
    }

    let parts: Vec<&str> = args.splitn(2, ':').collect();
    if parts.len() != 2 {
        return CommandResponse::error("Invalid format. Usage: encrypt <key>:<data>".to_string());
    }

    let key_str = parts[0];
    let data = parts[1];

    // Derive a 32-byte key from the input (in production, use proper key derivation)
    let mut key_bytes = [0u8; 32];
    let key_input = key_str.as_bytes();
    let len = key_input.len().min(32);
    key_bytes[..len].copy_from_slice(&key_input[..len]);

    // Generate random nonce
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Create cipher
    let cipher = match Aes256Gcm::new_from_slice(&key_bytes) {
        Ok(c) => c,
        Err(e) => return CommandResponse::error(format!("Key error: {}", e)),
    };

    // Encrypt
    let ciphertext = match cipher.encrypt(nonce, data.as_bytes()) {
        Ok(c) => c,
        Err(e) => return CommandResponse::error(format!("Encryption error: {}", e)),
    };

    // Combine nonce and ciphertext, then base64 encode
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    let encoded = BASE64.encode(&combined);

    CommandResponse::success(format!("Encrypted (AES-256-GCM): {}", encoded))
}

/// Decrypt data using AES-256-GCM
#[wasm_bindgen]
pub fn decrypt_data(args: &str) -> String {
    let response = decrypt_data_impl(args);
    serialize_response(&response)
}

pub fn decrypt_data_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error("Usage: decrypt <key>:<encrypted_data>".to_string());
    }

    let parts: Vec<&str> = args.splitn(2, ':').collect();
    if parts.len() != 2 {
        return CommandResponse::error("Invalid format. Usage: decrypt <key>:<encrypted_data>".to_string());
    }

    let key_str = parts[0];
    let encrypted_b64 = parts[1];

    // Decode base64
    let decoded = match BASE64.decode(encrypted_b64) {
        Ok(d) => d,
        Err(e) => return CommandResponse::error(format!("Base64 decode error: {}", e)),
    };

    if decoded.len() < 12 {
        return CommandResponse::error("Invalid encrypted data format".to_string());
    }

    // Extract nonce and ciphertext
    let nonce_bytes = &decoded[..12];
    let ciphertext = &decoded[12..];

    // Derive key
    let mut key_bytes = [0u8; 32];
    let key_input = key_str.as_bytes();
    let len = key_input.len().min(32);
    key_bytes[..len].copy_from_slice(&key_input[..len]);

    // Create cipher
    let cipher = match Aes256Gcm::new_from_slice(&key_bytes) {
        Ok(c) => c,
        Err(e) => return CommandResponse::error(format!("Key error: {}", e)),
    };

    // Decrypt
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = match cipher.decrypt(nonce, ciphertext) {
        Ok(p) => p,
        Err(e) => return CommandResponse::error(format!("Decryption error: {}", e)),
    };

    let decrypted_text = String::from_utf8_lossy(&plaintext).to_string();
    CommandResponse::success(format!("Decrypted: {}", decrypted_text))
}

/// Generate a random key
#[wasm_bindgen]
pub fn generate_key(args: &str) -> String {
    let response = generate_key_impl(args);
    serialize_response(&response)
}

pub fn generate_key_impl(args: &str) -> CommandResponse {
    let size = if args.is_empty() {
        32
    } else {
        args.parse::<usize>().unwrap_or(32)
    };

    let mut key_bytes = vec![0u8; size];
    rand::thread_rng().fill_bytes(&mut key_bytes);
    let hex_key = hex::encode(&key_bytes);

    CommandResponse::success(format!("Generated {}-byte key: {}", size, hex_key))
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
    fn test_hash_sha256() {
        let result = hash_data_impl("sha256:hello");
        assert!(result.success);
        assert!(result.output.contains("SHA256"));
    }

    #[test]
    fn test_hash_sha512() {
        let result = hash_data_impl("sha512:hello");
        assert!(result.success);
        assert!(result.output.contains("SHA512"));
    }

    #[test]
    fn test_hash_invalid_algorithm() {
        let result = hash_data_impl("md5:hello");
        assert!(!result.success);
    }

    #[test]
    fn test_encrypt_decrypt() {
        let key = "mysecretkey123";
        let data = "Hello, World!";

        // Encrypt
        let encrypt_args = format!("{}:{}", key, data);
        let encrypt_result = encrypt_data_impl(&encrypt_args);
        assert!(encrypt_result.success);

        // Extract encrypted value
        let encrypted = encrypt_result.output.replace("Encrypted (AES-256-GCM): ", "");

        // Decrypt
        let decrypt_args = format!("{}:{}", key, encrypted);
        let decrypt_result = decrypt_data_impl(&decrypt_args);
        assert!(decrypt_result.success);
        assert!(decrypt_result.output.contains(data));
    }

    #[test]
    fn test_generate_key() {
        let result = generate_key_impl("32");
        assert!(result.success);
        assert!(result.output.contains("Generated"));
    }
}
