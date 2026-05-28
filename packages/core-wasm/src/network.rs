//! Network module for WASM
//! Provides network-related functionality: scanning, ping, HTTP requests

use wasm_bindgen::prelude::*;
use crate::{CommandResponse, challenge};
use std::collections::HashMap;

/// Virtual network topology for simulation
pub struct VirtualNetwork {
    hosts: HashMap<String, Vec<PortInfo>>,
}

struct PortInfo {
    port: u16,
    service: String,
    state: String,
}

impl VirtualNetwork {
    fn new() -> Self {
        let mut hosts = HashMap::new();

        // Pre-configured network topology
        hosts.insert("localhost".to_string(), vec![
            PortInfo { port: 22, service: "ssh".to_string(), state: "open".to_string() },
            PortInfo { port: 80, service: "http".to_string(), state: "open".to_string() },
            PortInfo { port: 443, service: "https".to_string(), state: "open".to_string() },
            PortInfo { port: 3306, service: "mysql".to_string(), state: "closed".to_string() },
            PortInfo { port: 8080, service: "http-proxy".to_string(), state: "filtered".to_string() },
        ]);
        hosts.insert("192.168.1.1".to_string(), vec![
            PortInfo { port: 22, service: "ssh".to_string(), state: "open".to_string() },
            PortInfo { port: 80, service: "http".to_string(), state: "open".to_string() },
            PortInfo { port: 443, service: "https".to_string(), state: "open".to_string() },
            PortInfo { port: 8443, service: "https-alt".to_string(), state: "open".to_string() },
        ]);
        hosts.insert("192.168.1.10".to_string(), vec![
            PortInfo { port: 22, service: "ssh".to_string(), state: "open".to_string() },
            PortInfo { port: 3306, service: "mysql".to_string(), state: "open".to_string() },
            PortInfo { port: 5432, service: "postgresql".to_string(), state: "open".to_string() },
            PortInfo { port: 8080, service: "http-proxy".to_string(), state: "open".to_string() },
        ]);
        hosts.insert("10.0.0.1".to_string(), vec![
            PortInfo { port: 80, service: "http".to_string(), state: "open".to_string() },
            PortInfo { port: 443, service: "https".to_string(), state: "open".to_string() },
            PortInfo { port: 3000, service: "dev-server".to_string(), state: "open".to_string() },
        ]);

        // Dynamic challenge target — added by add_dynamic_target() after init
        // (static hosts don't include the randomized target)

        VirtualNetwork { hosts }
    }

    /// Add the dynamically generated challenge target to the network
    pub fn add_dynamic_target(&mut self, ip: String, backdoor_port: u32) {
        self.hosts.insert(ip, vec![
            PortInfo { port: 22, service: "ssh".to_string(), state: "open".to_string() },
            PortInfo { port: 80, service: "http".to_string(), state: "open".to_string() },
            PortInfo { port: backdoor_port as u16, service: "unknown-backdoor".to_string(), state: "open".to_string() },
        ]);
    }

    fn get_host_ports(&self, host: &str) -> Vec<&PortInfo> {
        self.hosts.get(host).map(|v| v.iter().collect()).unwrap_or_default()
    }

    fn get_all_hosts(&self) -> Vec<&str> {
        self.hosts.keys().map(|s| s.as_str()).collect()
    }
}

// Global virtual network instance
static mut VIRTUAL_NETWORK: Option<VirtualNetwork> = None;

fn get_network() -> &'static mut VirtualNetwork {
    unsafe {
        if VIRTUAL_NETWORK.is_none() {
            let mut net = VirtualNetwork::new();
            // Inject the dynamic challenge target if initialized
            if challenge::is_initialized() {
                let ip = challenge::get_target_ip();
                let port = challenge::get_backdoor_port();
                net.add_dynamic_target(ip, port);
            }
            VIRTUAL_NETWORK = Some(net);
        }
        VIRTUAL_NETWORK.as_mut().unwrap()
    }
}

/// Reset the network to pick up new challenge values
pub fn reset_network() {
    unsafe {
        VIRTUAL_NETWORK = None;
    }
}

/// Scan a host (simulated nmap)
#[wasm_bindgen]
pub fn scan_host(args: &str) -> String {
    let response = scan_host_impl(args);
    serialize_response(&response)
}

pub fn scan_host_impl(host: &str) -> CommandResponse {
    if host.is_empty() {
        return CommandResponse::error("Host is required. Usage: nmap <host>".to_string());
    }

    // Validate challenge: if user scans the correct dynamic IP, show backdoor port
    let target_ip = challenge::get_target_ip();
    let backdoor_port = challenge::get_backdoor_port();

    let network = get_network();
    let ports = network.get_host_ports(host);

    let mut output = format!("Starting Nmap simulation for {}...\n\n", host);
    output.push_str(&format!("Nmap scan report for {}\n", host));
    output.push_str("Host is up (0.0012s latency).\n");

    if host == target_ip {
        // Correct target! Show all ports including the dynamic backdoor
        output.push_str("Not shown: 997 closed ports\n");
        output.push_str("PORT      STATE    SERVICE\n");
        output.push_str(&format!("{:<9} {:<8} {}\n", "22/tcp", "open", "ssh"));
        output.push_str(&format!("{:<9} {:<8} {}\n", "80/tcp", "open", "http"));
        output.push_str(&format!("{:<9} {:<8} {}\n", format!("{}/tcp", backdoor_port), "open", "unknown-backdoor"));
        output.push_str(&format!("\n\x1b[1;33m⚠ Puerto inusual detectado: {} — servicio desconocido\x1b[0m\n", backdoor_port));
        output.push_str(&format!("\nNmap done: 1 IP address (1 host up) scanned in 0.15 seconds"));
    } else if host.starts_with("10.0.2.") {
        // Wrong IP in the target subnet — hint
        output.push_str("All 1000 scanned ports on host are closed\n");
        output.push_str(&format!("\n\x1b[33mPista: Este host no tiene puertos abiertos.\x1b[0m"));
        output.push_str(&format!("\n\x1b[33mPrueba con scan_network para descubrir hosts activos en 10.0.2.0/24\x1b[0m"));
        output.push_str(&format!("\nNmap done: 1 IP address (1 host up) scanned in 0.15 seconds"));
    } else if ports.is_empty() {
        output.push_str("All 1000 scanned ports on host are closed\n");
    } else {
        let closed_count = 1000 - ports.len();
        output.push_str(&format!("Not shown: {} closed ports\n", closed_count));
        output.push_str("PORT      STATE    SERVICE\n");

        for p in &ports {
            output.push_str(&format!("{:<9} {:<8} {}\n",
                format!("{}/tcp", p.port),
                p.state,
                p.service
            ));
        }
    }

    output.push_str(&format!("\nNmap done: 1 IP address (1 host up) scanned in 0.15 seconds"));

    CommandResponse::success(output)
}

/// Scan the entire virtual network
#[wasm_bindgen]
pub fn scan_network(_args: &str) -> String {
    let response = scan_network_impl();
    serialize_response(&response)
}

pub fn scan_network_impl() -> CommandResponse {
    let network = get_network();
    let hosts = network.get_all_hosts();

    let mut output = String::from("=== Network Scan Report ===\n\n");
    output.push_str(&format!("Discovered {} hosts:\n\n", hosts.len()));

    let target_ip = challenge::get_target_ip();

    for host in &hosts {
        let ports = network.get_host_ports(host);
        let open_count = ports.iter().filter(|p| p.state == "open").count();

        if *host == target_ip {
            output.push_str(&format!("\x1b[1;33m{} — {} open ports [TARGET]\x1b[0m\n", host, open_count));
        } else {
            output.push_str(&format!("{} — {} open ports\n", host, open_count));
        }

        for p in &ports {
            if p.state == "open" {
                output.push_str(&format!("  {}/tcp  open  {}\n", p.port, p.service));
            }
        }
        output.push('\n');
    }

    if challenge::is_initialized() {
        output.push_str(&format!("\x1b[33mPista: Busca el host con el puerto inusual en el rango 10.0.2.x\x1b[0m\n"));
    }

    CommandResponse::success(output)
}

/// Ping a host (simulated)
#[wasm_bindgen]
pub fn ping_host(args: &str) -> String {
    let response = ping_host_impl(args);
    serialize_response(&response)
}

pub fn ping_host_impl(host: &str) -> CommandResponse {
    if host.is_empty() {
        return CommandResponse::error("Host is required. Usage: ping <host>".to_string());
    }

    let network = get_network();
    let is_known = !network.get_host_ports(host).is_empty() || host == "localhost";

    let (packets_sent, packets_received, time_ms) = if is_known {
        (3, 3, 2)
    } else {
        (3, 0, 2)
    };

    let loss_pct = ((packets_sent - packets_received) * 100) / packets_sent;

    let mut output = format!("PING {} (127.0.0.1) 56(84) bytes of data.\n", host);

    if is_known {
        output.push_str("64 bytes from localhost (127.0.0.1): icmp_seq=1 ttl=64 time=0.012 ms\n");
        output.push_str("64 bytes from localhost (127.0.0.1): icmp_seq=2 ttl=64 time=0.008 ms\n");
        output.push_str("64 bytes from localhost (127.0.0.1): icmp_seq=3 ttl=64 time=0.009 ms\n");
    } else {
        output.push_str("3 packets transmitted, 0 received, 100% packet loss\n");
    }

    output.push_str(&format!("\n--- {} ping statistics ---\n", host));
    output.push_str(&format!("{} packets transmitted, {} received, {}% packet loss, time {}ms\n",
        packets_sent, packets_received, loss_pct, time_ms));

    if is_known {
        output.push_str("rtt min/avg/max/mdev = 0.008/0.009/0.012/0.001 ms");
    }

    CommandResponse::success(output)
}

/// HTTP GET request (simulated)
#[wasm_bindgen]
pub fn http_get(args: &str) -> String {
    let response = http_get_impl(args);
    serialize_response(&response)
}

pub fn http_get_impl(url: &str) -> CommandResponse {
    if url.is_empty() {
        return CommandResponse::error("URL is required. Usage: http_get <url>".to_string());
    }

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
    fn test_scan_network() {
        let result = scan_network_impl();
        assert!(result.success);
        assert!(result.output.contains("Network Scan Report"));
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
