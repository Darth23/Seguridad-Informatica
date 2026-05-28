//! Procedural Challenge Generator for Module 0.2
//! Generates randomized network targets using a seeded LCG (Linear Congruential Generator)

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

/// Challenge state for Module 0.2
/// Stores the dynamically generated target IP and backdoor port
static CHALLENGE_TARGET_IP_SUFFIX: AtomicU32 = AtomicU32::new(0);
static CHALLENGE_BACKDOOR_PORT: AtomicU32 = AtomicU32::new(0);
static CHALLENGE_INITIALIZED: AtomicBool = AtomicBool::new(false);

/// Linear Congruential Generator (LCG) — Park-Miller variant
/// Uses no external dependencies, pure Rust, works on wasm32-unknown-unknown
struct Lcg {
    state: u32,
}

impl Lcg {
    /// Create a new LCG with the given seed
    fn new(seed: u32) -> Self {
        // Ensure seed is non-zero (LCG requirement)
        let state = if seed == 0 { 1 } else { seed };
        Lcg { state }
    }

    /// Generate next pseudo-random u32
    fn next_u32(&mut self) -> u32 {
        // Park-Miller LCG: state = (state * 16807) % 2147483647
        self.state = self.state.wrapping_mul(16807) % 2_147_483_647;
        self.state
    }

    /// Generate a random number in [min, max] inclusive
    fn range(&mut self, min: u32, max: u32) -> u32 {
        let span = max - min + 1;
        min + (self.next_u32() % span)
    }
}

/// Initialize the procedural lab with a seed from JavaScript
/// Called once on mount: `init_procedural_lab(Date.now())`
pub fn init_procedural_lab_impl(seed: u32) {
    let mut rng = Lcg::new(seed);

    // Generate target IP suffix: 10.0.2.X where X is in [10, 250]
    let ip_suffix = rng.range(10, 250);

    // Generate backdoor port: random between 1025 and 9999
    let backdoor_port = rng.range(1025, 9999);

    CHALLENGE_TARGET_IP_SUFFIX.store(ip_suffix, Ordering::Relaxed);
    CHALLENGE_BACKDOOR_PORT.store(backdoor_port, Ordering::Relaxed);
    CHALLENGE_INITIALIZED.store(true, Ordering::Relaxed);

    log_procedural_state(ip_suffix, backdoor_port);
}

/// Get the current challenge target IP (e.g., "10.0.2.X")
pub fn get_target_ip() -> String {
    let suffix = CHALLENGE_TARGET_IP_SUFFIX.load(Ordering::Relaxed);
    format!("10.0.2.{}", suffix)
}

/// Get the current challenge backdoor port
pub fn get_backdoor_port() -> u32 {
    CHALLENGE_BACKDOOR_PORT.load(Ordering::Relaxed)
}

/// Check if the challenge has been initialized
pub fn is_initialized() -> bool {
    CHALLENGE_INITIALIZED.load(Ordering::Relaxed)
}

/// Log the generated state (for debugging — visible in browser console)
fn log_procedural_state(ip_suffix: u32, port: u32) {
    let msg = format!(
        "[CHALLENGE] Seeded procedural lab — Target: 10.0.2.{} | Backdoor port: {}",
        ip_suffix, port
    );
    web_sys::console::log_1(&msg.into());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lcg_deterministic() {
        let mut rng1 = Lcg::new(12345);
        let mut rng2 = Lcg::new(12345);
        for _ in 0..100 {
            assert_eq!(rng1.next_u32(), rng2.next_u32());
        }
    }

    #[test]
    fn test_lcg_range() {
        let mut rng = Lcg::new(42);
        for _ in 0..1000 {
            let val = rng.range(10, 250);
            assert!(val >= 10 && val <= 250);
        }
    }

    #[test]
    fn test_init_procedural_lab() {
        init_procedural_lab_impl(42);
        assert!(is_initialized());
        let ip = get_target_ip();
        assert!(ip.starts_with("10.0.2."));
        let port = get_backdoor_port();
        assert!(port >= 1025 && port <= 9999);
    }
}
