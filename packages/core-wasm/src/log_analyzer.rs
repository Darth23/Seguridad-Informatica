//! Log Analyzer module for WASM
//! Provides log analysis functionality: parsing, searching, pattern matching

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use regex::Regex;

/// Analyze log content
#[wasm_bindgen]
pub fn analyze(args: &str) -> String {
    let response = analyze_impl(args);
    serialize_response(&response)
}

pub fn analyze_impl(log_content: &str) -> CommandResponse {
    if log_content.is_empty() {
        return CommandResponse::error("Log content is required. Usage: analyze_log <log_content>".to_string());
    }

    let mut output = String::from("=== Log Analysis Report ===\n\n");

    // Count total lines
    let lines: Vec<&str> = log_content.lines().collect();
    let total_lines = lines.len();
    output.push_str(&format!("Total lines: {}\n", total_lines));

    // Count log levels
    let error_count = count_pattern(log_content, r"(?i)\berror\b");
    let warning_count = count_pattern(log_content, r"(?i)\bwarn(ing)?\b");
    let info_count = count_pattern(log_content, r"(?i)\binfo\b");
    let debug_count = count_pattern(log_content, r"(?i)\bdebug\b");

    output.push_str(&format!("\nLog Levels:\n"));
    output.push_str(&format!("  ERROR:   {}\n", error_count));
    output.push_str(&format!("  WARNING: {}\n", warning_count));
    output.push_str(&format!("  INFO:    {}\n", info_count));
    output.push_str(&format!("  DEBUG:   {}\n", debug_count));

    // Find IP addresses
    let ip_pattern = Regex::new(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b").unwrap();
    let ips: Vec<_> = ip_pattern.find_iter(log_content).map(|m| m.as_str()).collect();
    if !ips.is_empty() {
        output.push_str(&format!("\nIP Addresses found: {}\n", ips.len()));
        for ip in ips.iter().take(10) {
            output.push_str(&format!("  - {}\n", ip));
        }
        if ips.len() > 10 {
            output.push_str(&format!("  ... and {} more\n", ips.len() - 10));
        }
    }

    // Find timestamps (common formats)
    let timestamp_pattern = Regex::new(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}").unwrap();
    let timestamps: Vec<_> = timestamp_pattern.find_iter(log_content).map(|m| m.as_str()).collect();
    if !timestamps.is_empty() {
        output.push_str(&format!("\nTimestamps found: {}\n", timestamps.len()));
        if let Some(first) = timestamps.first() {
            output.push_str(&format!("  First: {}\n", first));
        }
        if let Some(last) = timestamps.last() {
            output.push_str(&format!("  Last:  {}\n", last));
        }
    }

    output.push_str("\n=== End of Analysis ===");

    CommandResponse::success(output)
}

/// Search log content with regex pattern
#[wasm_bindgen]
pub fn search(args: &str) -> String {
    let response = search_impl(args);
    serialize_response(&response)
}

/// Detect potentially dangerous regex patterns (ReDoS)
fn is_redos_prone(pattern: &str) -> bool {
    // Heuristic: detect nested quantifiers like (a+)+, (a*)*, (a+)*, etc.
    let dangerous = [
        r"\+\)", r"\*\)", r"\+\+", r"\*\+",
        r"\+\{", r"\*\{",
    ];
    for d in &dangerous {
        if pattern.contains(d) {
            return true;
        }
    }
    // Detect nested groups with quantifiers
    let mut depth = 0;
    let mut has_quantifier_after_close = false;
    for ch in pattern.chars() {
        match ch {
            '(' => { depth += 1; has_quantifier_after_close = false; }
            ')' => { has_quantifier_after_close = true; }
            '+' | '*' | '{' if has_quantifier_after_close && depth > 0 => {
                return true;
            }
            _ => { has_quantifier_after_close = false; }
        }
    }
    false
}

/// Safe regex compilation with timeout heuristic
fn safe_regex(pattern_str: &str) -> Result<Regex, String> {
    if is_redos_prone(pattern_str) {
        return Err(format!(
            "Pattern '{}' may cause catastrophic backtracking (ReDoS). Simplify the pattern.",
            pattern_str
        ));
    }
    // Limit pattern complexity
    if pattern_str.len() > 512 {
        return Err("Pattern too long (max 512 characters)".to_string());
    }
    Regex::new(pattern_str).map_err(|e| format!("Invalid regex: {}", e))
}

pub fn search_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error("Usage: search_log <pattern>:<log_content>".to_string());
    }

    let parts: Vec<&str> = args.splitn(2, ':').collect();
    if parts.len() != 2 {
        return CommandResponse::error("Invalid format. Usage: search_log <pattern>:<log_content>".to_string());
    }

    let pattern_str = parts[0];
    let log_content = parts[1];

    // Compile regex pattern safely
    let regex = match safe_regex(pattern_str) {
        Ok(r) => r,
        Err(e) => return CommandResponse::error(e),
    };

    // Find all matches
    let lines: Vec<&str> = log_content.lines().collect();
    let mut matches = Vec::new();

    for (line_num, line) in lines.iter().enumerate() {
        if regex.is_match(line) {
            matches.push((line_num + 1, *line));
        }
    }

    if matches.is_empty() {
        return CommandResponse::success(format!("No matches found for pattern: {}", pattern_str));
    }

    let mut output = format!("Found {} matches for pattern '{}':\n\n", matches.len(), pattern_str);
    for (line_num, line) in matches.iter().take(50) {
        output.push_str(&format!("{:4}: {}\n", line_num, line));
    }

    if matches.len() > 50 {
        output.push_str(&format!("\n... and {} more matches", matches.len() - 50));
    }

    CommandResponse::success(output)
}

/// Helper function to count pattern occurrences
fn count_pattern(text: &str, pattern_str: &str) -> usize {
    match Regex::new(pattern_str) {
        Ok(re) => re.find_iter(text).count(),
        Err(_) => 0,
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
    fn test_analyze_empty() {
        let result = analyze_impl("");
        assert!(!result.success);
    }

    #[test]
    fn test_analyze_basic() {
        let log = "2024-01-15 10:00:00 INFO Application started\n\
                   2024-01-15 10:00:01 ERROR Connection failed\n\
                   2024-01-15 10:00:02 WARNING Low memory";
        let result = analyze_impl(log);
        assert!(result.success);
        assert!(result.output.contains("Total lines: 3"));
        assert!(result.output.contains("ERROR:   1"));
    }

    #[test]
    fn test_search_no_matches() {
        let args = "notfound:hello world";
        let result = search_impl(args);
        assert!(result.success);
        assert!(result.output.contains("No matches"));
    }

    #[test]
    fn test_search_with_matches() {
        let args = "error:This is an ERROR message\nThis is info";
        let result = search_impl(args);
        assert!(result.success);
        assert!(result.output.contains("Found 1 matches"));
    }

    #[test]
    fn test_search_invalid_regex() {
        let args = "[invalid:hello world";
        let result = search_impl(args);
        assert!(!result.success);
    }
}
