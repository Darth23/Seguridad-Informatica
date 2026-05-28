//! Reverse Shell State Machine for Module 0.5
//! Tracks listener state, reverse shell connections, and session transitions

use wasm_bindgen::prelude::*;
use crate::{CommandResponse, challenge};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

// ── Shell session state ──
static IS_LISTENING: AtomicBool = AtomicBool::new(false);
static LISTENER_PORT: AtomicU32 = AtomicU32::new(0);
static IN_REVERSE_SHELL: AtomicBool = AtomicBool::new(false);

/// Start a netcat listener on the given port
pub fn start_listener(port: u32) -> String {
    IS_LISTENING.store(true, Ordering::Relaxed);
    LISTENER_PORT.store(port, Ordering::Relaxed);

    let msg = format!(
        "[+] Listening on 0.0.0.0:{}...\n\
         [*] Terminal is now waiting for incoming connection.\n\
         [*] Use exploit_service <IP> {} from another context to connect.",
        port, port
    );
    web_sys::console::log_1(&format!("[SHELL] Listener started on port {}", port).into());
    msg
}

/// Attempt to exploit a service and establish a reverse shell
pub fn attempt_exploit(target_ip: &str, port: u32) -> String {
    let listening = IS_LISTENING.load(Ordering::Relaxed);
    let listener_port = LISTENER_PORT.load(Ordering::Relaxed);
    let m04_ip = challenge::get_m04_target_ip();

    if !listening {
        return "[!] No hay listener activo. Primero ejecuta: nc -lvnp <puerto>".to_string();
    }

    if port != listener_port {
        return format!(
            "[!] El puerto {} no coincide con tu listener (puerto {}).",
            port, listener_port
        );
    }

    if target_ip != m04_ip {
        return format!(
            "[!] IP incorrecta. El target del Modulo 0.4 es {}.",
            m04_ip
        );
    }

    // Success — transition to reverse shell
    IN_REVERSE_SHELL.store(true, Ordering::Relaxed);
    IS_LISTENING.store(false, Ordering::Relaxed);

    let msg = format!(
        "[*] Sending exploit payload to {}...\n\
         [*] Payload: python3 reverse_shell.py\n\
         [+] Connection received from {}!\n\
         \x1b[1;32m🎯 REVERSE SHELL ESTABLISHED\x1b[0m\n\
         [*] Session: victim@target:~$ (escribe 'exit' para salir)",
        target_ip, target_ip
    );
    web_sys::console::log_1(&format!("[SHELL] Reverse shell established to {}", target_ip).into());
    msg
}

/// Read the flag file (only accessible inside a reverse shell)
pub fn read_flag_file() -> String {
    if !IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        return "cat: flag.txt: No such file or directory".to_string();
    }

    // Generate a session-specific flag based on the M04 profile
    let profile = challenge::get_m04_profile();
    let flag_value = format!("FLAG{{exploit_{}_{}}}", profile.flag.replace('.', "_"), LISTENER_PORT.load(Ordering::Relaxed));

    format!(
        "\x1b[1;32m{}\x1b[0m\n\
         [*] Has completado el Modulo 0.5: Explotacion Inicial!",
        flag_value
    )
}

/// Exit the reverse shell
pub fn exit_shell() -> String {
    if !IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        return "No hay sesion activa.".to_string();
    }

    IN_REVERSE_SHELL.store(false, Ordering::Relaxed);
    IS_LISTENING.store(false, Ordering::Relaxed);
    LISTENER_PORT.store(0, Ordering::Relaxed);

    "[*] Connection closed.\n[*] Sesion de reverse shell finalizada.".to_string()
}

/// Check if currently in a reverse shell
pub fn in_reverse_shell() -> bool {
    IN_REVERSE_SHELL.load(Ordering::Relaxed)
}

/// Get the current prompt prefix
pub fn get_prompt() -> &'static str {
    if IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        "victim@target:~$ "
    } else {
        "user@cyberedu:~$ "
    }
}

/// Get shell status as JSON for the frontend
pub fn get_shell_status() -> String {
    serde_json::json!({
        "is_listening": IS_LISTENING.load(Ordering::Relaxed),
        "listener_port": LISTENER_PORT.load(Ordering::Relaxed),
        "in_reverse_shell": IN_REVERSE_SHELL.load(Ordering::Relaxed),
        "prompt": get_prompt(),
    }).to_string()
}

/// Reset shell state (for module transitions)
pub fn reset_shell() {
    IS_LISTENING.store(false, Ordering::Relaxed);
    LISTENER_PORT.store(0, Ordering::Relaxed);
    IN_REVERSE_SHELL.store(false, Ordering::Relaxed);
}

// ── Impl functions for lib.rs command routing ──

fn serialize_response(response: &CommandResponse) -> String {
    serde_json::to_string(response).unwrap_or_else(|e| {
        serde_json::to_string(&CommandResponse::error(format!("Serialization error: {}", e)))
            .unwrap()
    })
}

/// Handle `exploit_service <IP> <Port>` command
pub fn exploit_service_impl(args: &str) -> CommandResponse {
    let tokens: Vec<&str> = args.split_whitespace().collect();
    if tokens.len() < 2 {
        return CommandResponse::error("Usage: exploit_service <IP> <port>".to_string());
    }
    let ip = tokens[0];
    let port: u32 = match tokens[1].parse() {
        Ok(p) => p,
        Err(_) => return CommandResponse::error(format!("Invalid port: {}", tokens[1])),
    };
    let output = attempt_exploit(ip, port);
    CommandResponse::success(output)
}

/// Handle `shell_status` command
pub fn get_shell_status_impl() -> CommandResponse {
    CommandResponse::success(get_shell_status())
}

/// Handle `shell_reset` command
pub fn reset_shell_impl() -> CommandResponse {
    reset_shell();
    CommandResponse::success("Shell state reset.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shell_lifecycle() {
        reset_shell();
        assert!(!in_reverse_shell());

        let msg = start_listener(4444);
        assert!(msg.contains("4444"));

        let msg = attempt_exploit("wrong_ip", 4444);
        assert!(msg.contains("IP incorrecta"));

        let msg = attempt_exploit("10.0.4.100", 9999);
        assert!(msg.contains("no coincide"));

        // Can't test full exploit without matching M04 IP, but state machine works
        exit_shell();
        assert!(!in_reverse_shell());
    }
}
