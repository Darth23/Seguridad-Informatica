//! Procedural Challenge Generator
//! Generates randomized network targets using a seeded LCG (Linear Congruential Generator)
//! Supports multiple modules with different subnets, ports, and service profiles

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

// ── Module 0.2 state (10.0.2.X, port 1025-9999) ──
static M02_IP_SUFFIX: AtomicU32 = AtomicU32::new(0);
static M02_BACKDOOR_PORT: AtomicU32 = AtomicU32::new(0);

// ── Module 0.3 state (10.0.3.X, port 2000-9000) ──
static M03_IP_SUFFIX: AtomicU32 = AtomicU32::new(0);
static M03_BACKDOOR_PORT: AtomicU32 = AtomicU32::new(0);

// ── Module 0.4 state (10.0.4.X, service profile) ──
static M04_IP_SUFFIX: AtomicU32 = AtomicU32::new(0);
static M04_PROFILE_INDEX: AtomicU32 = AtomicU32::new(0);

// ── Global ──
static INITIALIZED: AtomicBool = AtomicBool::new(false);

/// Service profile for Module 0.4 banner grabbing
pub struct ServiceProfile {
    pub port: u32,
    pub banner: &'static str,
    pub flag: &'static str,
    pub service_name: &'static str,
}

/// Three possible service profiles for Module 0.4
pub const M04_PROFILES: &[ServiceProfile] = &[
    ServiceProfile {
        port: 21,
        banner: "220 ProFTPD 1.3.5 Server [::1]",
        flag: "ProFTPD_1.3.5",
        service_name: "ftp",
    },
    ServiceProfile {
        port: 22,
        banner: "SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.8",
        flag: "OpenSSH_7.2p2",
        service_name: "ssh",
    },
    ServiceProfile {
        port: 80,
        banner: "Apache/2.4.18 (Ubuntu)",
        flag: "Apache_2.4.18",
        service_name: "http",
    },
];

/// Linear Congruential Generator (LCG) — Park-Miller variant
struct Lcg {
    state: u32,
}

impl Lcg {
    fn new(seed: u32) -> Self {
        let state = if seed == 0 { 1 } else { seed };
        Lcg { state }
    }

    fn next_u32(&mut self) -> u32 {
        self.state = self.state.wrapping_mul(16807) % 2_147_483_647;
        self.state
    }

    fn range(&mut self, min: u32, max: u32) -> u32 {
        let span = max - min + 1;
        min + (self.next_u32() % span)
    }
}

/// Initialize all procedural challenges with a seed from JavaScript
pub fn init_procedural_lab_impl(seed: u32) {
    let mut rng = Lcg::new(seed);

    // Module 0.2: 10.0.2.X, port 1025-9999
    let m02_ip = rng.range(10, 250);
    let m02_port = rng.range(1025, 9999);
    M02_IP_SUFFIX.store(m02_ip, Ordering::Relaxed);
    M02_BACKDOOR_PORT.store(m02_port, Ordering::Relaxed);

    // Module 0.3: 10.0.3.X, port 2000-9000
    let m03_ip = rng.range(10, 250);
    let m03_port = rng.range(2000, 9000);
    M03_IP_SUFFIX.store(m03_ip, Ordering::Relaxed);
    M03_BACKDOOR_PORT.store(m03_port, Ordering::Relaxed);

    // Module 0.4: 10.0.4.X, random service profile (0, 1, or 2)
    let m04_ip = rng.range(10, 250);
    let m04_profile = rng.range(0, (M04_PROFILES.len() as u32) - 1);
    M04_IP_SUFFIX.store(m04_ip, Ordering::Relaxed);
    M04_PROFILE_INDEX.store(m04_profile, Ordering::Relaxed);

    INITIALIZED.store(true, Ordering::Relaxed);

    let p = &M04_PROFILES[m04_profile as usize];
    log_state(m02_ip, m02_port, m03_ip, m03_port, m04_ip, p);
}

// ── Module 0.2 accessors ──

pub fn get_target_ip() -> String {
    format!("10.0.2.{}", M02_IP_SUFFIX.load(Ordering::Relaxed))
}

pub fn get_backdoor_port() -> u32 {
    M02_BACKDOOR_PORT.load(Ordering::Relaxed)
}

// ── Module 0.3 accessors ──

pub fn get_m03_target_ip() -> String {
    format!("10.0.3.{}", M03_IP_SUFFIX.load(Ordering::Relaxed))
}

pub fn get_m03_backdoor_port() -> u32 {
    M03_BACKDOOR_PORT.load(Ordering::Relaxed)
}

// ── Module 0.4 accessors ──

pub fn get_m04_target_ip() -> String {
    format!("10.0.4.{}", M04_IP_SUFFIX.load(Ordering::Relaxed))
}

pub fn get_m04_profile() -> &'static ServiceProfile {
    let idx = M04_PROFILE_INDEX.load(Ordering::Relaxed) as usize;
    &M04_PROFILES[idx]
}

pub fn get_m04_port() -> u32 {
    get_m04_profile().port
}

pub fn get_m04_banner() -> &'static str {
    get_m04_profile().banner
}

pub fn get_m04_flag() -> &'static str {
    get_m04_profile().flag
}

// ── Global ──

pub fn is_initialized() -> bool {
    INITIALIZED.load(Ordering::Relaxed)
}

fn log_state(m02_ip: u32, m02_port: u32, m03_ip: u32, m03_port: u32, m04_ip: u32, profile: &ServiceProfile) {
    let msg = format!(
        "[CHALLENGE] Seeded — M02: 10.0.2.{}:{} | M03: 10.0.3.{}:{} | M04: 10.0.4.{}:{} ({})",
        m02_ip, m02_port, m03_ip, m03_port, m04_ip, profile.port, profile.flag
    );
    web_sys::console::log_1(&msg.into());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lcg_deterministic() {
        let mut r1 = Lcg::new(12345);
        let mut r2 = Lcg::new(12345);
        for _ in 0..100 {
            assert_eq!(r1.next_u32(), r2.next_u32());
        }
    }

    #[test]
    fn test_init_all_challenges() {
        init_procedural_lab_impl(42);
        assert!(is_initialized());
        assert!(get_target_ip().starts_with("10.0.2."));
        assert!(get_m03_target_ip().starts_with("10.0.3."));
        assert!(get_m04_target_ip().starts_with("10.0.4."));
        let p = get_m04_profile();
        assert!(p.port == 21 || p.port == 22 || p.port == 80);
        assert!(!p.banner.is_empty());
        assert!(!p.flag.is_empty());
    }
}
