//! Network module for WASM
//! Provides network-related functionality: scanning, ping, HTTP requests

use wasm_bindgen::prelude::*;
use crate::{CommandResponse, WasmResult};
use serde_json::json;

/// Scan a host (simulated nmap)
#[wasm_bindgen]
pub fn scan_host(args: &str) -> String {
    let response = scan_host_impl(args);
    serialize_response(&response)
}

fn scan_host_impl(host: &str) -> CommandResponse {
    if host.is_empty() {
        return CommandResponse::error("Host is required. Usage: nmap <host>".to_string());
    }

    // Simulated scan results
    let ports = vec![
        (22, "ssh", "open"),
        (80, "http", "open"),
        (443, "https", "open"),
    ];

    let mut output = format!("Starting Nmap simulation for {}...\n\n", host);
    output.push_str(&format!("Nmap scan report for {}\n", host));
    output.push_str("Host is up (0.0012s latency).\n");
    output.push_str("Not shown: 997 closed ports\n");
    output.push_str("PORT   STATE SERVICE\n");

    for (port, service, state) in ports {
        output.push_str(&format!("{}/tcp {}  {}\n", port, state, service));
    }

    output.push_str("\nNmap done: 1 IP address (1 host up) scanned in 0.15 seconds");

    CommandResponse::success(output)
}

/// Ping a host (simulated)
#[wasm_bindgen]
pub fn ping_host(args: &str) -> String {
    let response = ping_host_impl(args);
    serialize_response(&response)
}

fn ping_host_impl(host: &str) -> CommandResponse {
    if host.is_empty() {
        return CommandResponse::error("Host is required. Usage: ping <host>".to_string());
    }

    let output = format!(
        "PING {} (127.0.0.1) 56(84) bytes of data.\n\
         64 bytes from localhost (127.0.0.1): icmp_seq=1 ttl=64 time=0.012 ms\n\
         64 bytes from localhost (127.0.0.1): icmp_seq=2 ttl=64 time=0.008 ms\n\
         64 bytes from localhost (127.0.0.1): icmp_seq=3 ttl=64 time=0.009 ms\n\
         \n\
         --- {} ping statistics ---\n\
         3 packets transmitted, 3 received, 0% packet loss, time 2ms\n\
         rtt min/avg/max/mdev = 0.008/0.009/0.012/0.001 ms",
        host, host
    );

    CommandResponse::success(output)
}

/// HTTP GET request (simulated)
#[wasm_bindgen]
pub fn http_get(args: &str) -> String {
    let response = http_get_impl(args);
    serialize_response(&response)
}

fn http_get_impl(url: &str) -> CommandResponse {
    if url.is_empty() {
        return CommandResponse::error("URL is required. Usage: http_get <url>".to_string());
    }

    // Validate URL format
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return CommandResponse::error("Invalid URL format. Must start with http:// or https://".to_string());
    }

    let output = format!(
        "HTTP/1.1 200 OK\n\
         Content-Type: text/html\n\
         Content-Length: 1234\n\
         \n\
         <!DOCTYPE html>\n\
         <html><head><title>{}</title></head>\n\
         <body><h1>Simulated Response</h1></body></html>",
        url
    );

    CommandResponse::success(output)
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
    fn test_scan_host_empty() {
        let result = scan_host_impl("");
        assert!(!result.success);
    }

    #[test]
    fn test_scan_host_valid() {
        let result = scan_host_impl("localhost");
        assert!(result.success);
        assert!(result.output.contains("Nmap"));
    }

    #[test]
    fn test_ping_host() {
        let result = ping_host_impl("google.com");
        assert!(result.success);
        assert!(result.output.contains("PING"));
    }

    #[test]
    fn test_http_get_invalid_url() {
        let result = http_get_impl("invalid-url");
        assert!(!result.success);
    }

    #[test]
    fn test_http_get_valid_url() {
        let result = http_get_impl("https://example.com");
        assert!(result.success);
    }
}
