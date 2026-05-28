//! Rate Limiter module for WASM
//! Provides rate limiting functionality to prevent abuse

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use std::collections::HashMap;

// Simulated rate limiter state
// In production, this would be backed by a proper storage mechanism
static mut RATE_LIMITER: Option<RateLimiterState> = None;

struct RateLimiterState {
    requests: HashMap<String, Vec<u64>>,
    limits: HashMap<String, u32>,
    window_size_ms: u64,
}

impl RateLimiterState {
    fn new() -> Self {
        let mut limits = HashMap::new();
        
        // Default limits for different operations
        limits.insert("nmap".to_string(), 5);      // 5 scans per window
        limits.insert("ping".to_string(), 10);     // 10 pings per window
        limits.insert("http_get".to_string(), 20); // 20 requests per window
        limits.insert("hash".to_string(), 50);     // 50 hashes per window
        limits.insert("encrypt".to_string(), 30);  // 30 encryptions per window
        limits.insert("flag".to_string(), 10);     // 10 flag submissions per window
        
        RateLimiterState {
            requests: HashMap::new(),
            limits,
            window_size_ms: 60000, // 1 minute window
        }
    }

    fn get_key(&self, operation: &str, client_id: &str) -> String {
        format!("{}:{}", operation, client_id)
    }

    fn check_rate(&mut self, operation: &str, client_id: &str) -> Result<bool, String> {
        let key = self.get_key(operation, client_id);
        let limit = *self.limits.get(operation).unwrap_or(&10);
        let now = current_time_ms();

        // Get or create request list
        let requests = self.requests.entry(key.clone()).or_insert_with(Vec::new);

        // Remove old requests outside the window
        let window_start = now.saturating_sub(self.window_size_ms);
        requests.retain(|&timestamp| timestamp > window_start);

        // Check if under limit
        if requests.len() as u32 >= limit {
            return Ok(false);
        }

        // Record this request
        requests.push(now);

        Ok(true)
    }

    fn reset(&mut self, operation: &str, client_id: &str) {
        let key = self.get_key(operation, client_id);
        self.requests.remove(&key);
    }

    fn get_usage(&self, operation: &str, client_id: &str) -> (u32, u32) {
        let key = self.get_key(operation, client_id);
        let limit = *self.limits.get(operation).unwrap_or(&10);
        let now = current_time_ms();
        let window_start = now.saturating_sub(self.window_size_ms);

        if let Some(requests) = self.requests.get(&key) {
            let current_count = requests.iter().filter(|&&t| t > window_start).count() as u32;
            (current_count, limit)
        } else {
            (0, limit)
        }
    }
}

/// Get current time in milliseconds
fn current_time_ms() -> u64 {
    // In WASM, we'll use JS Date through wasm-bindgen
    // For now, use a simple counter (in production, use proper time)
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

fn get_rate_limiter() -> &'static mut RateLimiterState {
    unsafe {
        if RATE_LIMITER.is_none() {
            RATE_LIMITER = Some(RateLimiterState::new());
        }
        RATE_LIMITER.as_mut().unwrap()
    }
}

/// Check rate limit for an operation
#[wasm_bindgen]
pub fn check_rate(args: &str) -> String {
    let response = check_rate_impl(args);
    serialize_response(&response)
}

pub fn check_rate_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error("Usage: rate_check <operation>:<client_id>".to_string());
    }

    let parts: Vec<&str> = args.splitn(2, ':').collect();
    if parts.len() != 2 {
        return CommandResponse::error("Invalid format. Usage: rate_check <operation>:<client_id>".to_string());
    }

    let operation = parts[0];
    let client_id = parts[1];

    let limiter = get_rate_limiter();
    let (current, limit) = limiter.get_usage(operation, client_id);

    let allowed = match limiter.check_rate(operation, client_id) {
        Ok(a) => a,
        Err(e) => return CommandResponse::error(format!("Rate check error: {}", e)),
    };

    if allowed {
        CommandResponse::success(format!(
            "\x1b[32m✓ Request allowed\x1b[0m\n\
             Operation: {}\n\
             Usage: {}/{}\n\
             Window: 60 seconds",
            operation, current + 1, limit
        ))
    } else {
        CommandResponse::error(format!(
            "\x1b[31m✗ Rate limit exceeded\x1b[0m\n\
             Operation: {}\n\
             Usage: {}/{}\n\
             Please wait before trying again.",
            operation, current, limit
        ))
    }
}

/// Reset rate limit for an operation
#[wasm_bindgen]
pub fn reset_rate(args: &str) -> String {
    let response = reset_rate_impl(args);
    serialize_response(&response)
}

pub fn reset_rate_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error("Usage: rate_reset <operation>:<client_id>".to_string());
    }

    let parts: Vec<&str> = args.splitn(2, ':').collect();
    if parts.len() != 2 {
        return CommandResponse::error("Invalid format. Usage: rate_reset <operation>:<client_id>".to_string());
    }

    let operation = parts[0];
    let client_id = parts[1];

    let limiter = get_rate_limiter();
    limiter.reset(operation, client_id);

    CommandResponse::success(format!(
        "Rate limit reset for operation '{}' (client: {})",
        operation, client_id
    ))
}

/// Get rate limit status without consuming a request
#[wasm_bindgen]
pub fn get_status(args: &str) -> String {
    let response = get_status_impl(args);
    serialize_response(&response)
}

fn get_status_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error("Usage: rate_status <operation>:<client_id>".to_string());
    }

    let parts: Vec<&str> = args.splitn(2, ':').collect();
    if parts.len() != 2 {
        return CommandResponse::error("Invalid format. Usage: rate_status <operation>:<client_id>".to_string());
    }

    let operation = parts[0];
    let client_id = parts[1];

    let limiter = get_rate_limiter();
    let (current, limit) = limiter.get_usage(operation, client_id);
    let remaining = limit.saturating_sub(current);

    CommandResponse::success(format!(
        "Rate Limit Status:\n\
         Operation: {}\n\
         Client: {}\n\
         Usage: {}/{}\n\
         Remaining: {}\n\
         Window: 60 seconds",
        operation, client_id, current, limit, remaining
    ))
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
    fn test_check_rate_empty_args() {
        let result = check_rate_impl("");
        assert!(!result.success);
    }

    #[test]
    fn test_check_rate_allowed() {
        // Reset first
        reset_rate_impl("test_op:test_client");
        
        let result = check_rate_impl("test_op:test_client");
        assert!(result.success);
        assert!(result.output.contains("Request allowed"));
    }

    #[test]
    fn test_reset_rate() {
        let result = reset_rate_impl("test_op2:test_client");
        assert!(result.success);
        assert!(result.output.contains("reset"));
    }

    #[test]
    fn test_get_status() {
        let result = get_status_impl("test_op3:test_client");
        assert!(result.success);
        assert!(result.output.contains("Rate Limit Status"));
    }
}
