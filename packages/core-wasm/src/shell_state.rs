//! Shell State Machine for Module 0.5 & 0.6
//! Tracks listener state, reverse shell connections, and privilege escalation

use wasm_bindgen::prelude::*;
use crate::{CommandResponse, challenge};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

// ── Shell session state ──
static IS_LISTENING: AtomicBool = AtomicBool::new(false);
static LISTENER_PORT: AtomicU32 = AtomicU32::new(0);
static IN_REVERSE_SHELL: AtomicBool = AtomicBool::new(false);
static IS_ROOT: AtomicBool = AtomicBool::new(false);

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
    IS_ROOT.store(false, Ordering::Relaxed);

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

    let profile = challenge::get_m04_profile();
    let flag_value = format!("FLAG{{exploit_{}_{}}}", profile.flag.replace('.', "_"), LISTENER_PORT.load(Ordering::Relaxed));

    format!(
        "\x1b[1;32m{}\x1b[0m\n\
         [*] Has completado el Modulo 0.5: Explotacion Inicial!",
        flag_value
    )
}

/// Read root proof file (only accessible as root)
pub fn read_root_proof() -> String {
    if !IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        return "cat: /root/proof.txt: No such file or directory".to_string();
    }
    if !IS_ROOT.load(Ordering::Relaxed) {
        return "cat: /root/proof.txt: Permission denied: You are not root".to_string();
    }

    let profile = challenge::get_m04_profile();
    let proof_value = format!("FLAG{{privesc_{}_{}}}", profile.flag.replace('.', "_"), LISTENER_PORT.load(Ordering::Relaxed));

    format!(
        "\x1b[1;33m{}\x1b[0m\n\
         [*] Has completado el Modulo 0.6: Elevacion de Privilegios!",
        proof_value
    )
}

/// Handle whoami command
pub fn handle_whoami() -> String {
    if !IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        return "user".to_string();
    }
    if IS_ROOT.load(Ordering::Relaxed) {
        "root".to_string()
    } else {
        "victim".to_string()
    }
}

/// Handle sudo -l command
pub fn handle_sudo_l() -> String {
    if !IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        return "sudo: no hay sesion activa".to_string();
    }
    if IS_ROOT.load(Ordering::Relaxed) {
        return "User root may run everything on target:\n  (ALL) ALL".to_string();
    }

    "Matching Defaults entries for victim on target:\n\
     \x1b[2m  env_reset, mail_badpass\x1b[0m\n\
     \n\
     User victim may run the following commands on target:\n\
     \x1b[1;32m  (root) NOPASSWD: /usr/bin/find\x1b[0m"
        .to_string()
}

/// Handle sudo find exploitation — detect the privilege escalation command
pub fn check_sudo_find_exploit(command: &str) -> Option<String> {
    if !IN_REVERSE_SHELL.load(Ordering::Relaxed) || IS_ROOT.load(Ordering::Relaxed) {
        return None;
    }

    let lower = command.to_lowercase();
    let trimmed = lower.trim();

    // Detect various GTFOBins-style find escape patterns
    let is_exploit = trimmed.starts_with("sudo find")
        && (trimmed.contains("-exec /bin/sh") || trimmed.contains("-exec sh")
            || trimmed.contains("-exec /bin/bash") || trimmed.contains("-exec bash")
            || trimmed.contains("-exec /bin/zsh") || trimmed.contains("-exec zsh"));

    if is_exploit {
        IS_ROOT.store(true, Ordering::Relaxed);
        Some(format!(
            "\x1b[1;33m[*] Executing: {}\x1b[0m\n\
             [+] Spawning root shell...\n\
             \x1b[1;32m👑 ROOT SHELL OBTAINED!\x1b[0m\n\
             [*] Ahora tienes privilegios de administrador.\n\
             [*] Prueba: cat /root/proof.txt",
            command
        ))
    } else {
        None
    }
}

/// Exit the reverse shell
pub fn exit_shell() -> String {
    if !IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        return "No hay sesion activa.".to_string();
    }

    IN_REVERSE_SHELL.store(false, Ordering::Relaxed);
    IS_LISTENING.store(false, Ordering::Relaxed);
    IS_ROOT.store(false, Ordering::Relaxed);
    LISTENER_PORT.store(0, Ordering::Relaxed);

    "[*] Connection closed.\n[*] Sesion de reverse shell finalizada.".to_string()
}

/// Auto-enter reverse shell state for Module 0.6
pub fn enter_reverse_shell_for_m06() {
    IN_REVERSE_SHELL.store(true, Ordering::Relaxed);
    IS_ROOT.store(false, Ordering::Relaxed);
    IS_LISTENING.store(false, Ordering::Relaxed);
    web_sys::console::log_1(&"[SHELL] Auto-entered reverse shell for Module 0.6".into());
}

/// Check if currently in a reverse shell
pub fn in_reverse_shell() -> bool {
    IN_REVERSE_SHELL.load(Ordering::Relaxed)
}

/// Check if current user is root
pub fn is_root() -> bool {
    IS_ROOT.load(Ordering::Relaxed)
}

/// Get the current prompt prefix
pub fn get_prompt() -> String {
    if IN_REVERSE_SHELL.load(Ordering::Relaxed) {
        if IS_ROOT.load(Ordering::Relaxed) {
            "root@target:# ".to_string()
        } else {
            "victim@target:~$ ".to_string()
        }
    } else {
        "user@cyberedu:~$ ".to_string()
    }
}

/// Get shell status as JSON for the frontend
pub fn get_shell_status() -> String {
    serde_json::json!({
        "is_listening": IS_LISTENING.load(Ordering::Relaxed),
        "listener_port": LISTENER_PORT.load(Ordering::Relaxed),
        "in_reverse_shell": IN_REVERSE_SHELL.load(Ordering::Relaxed),
        "is_root": IS_ROOT.load(Ordering::Relaxed),
        "prompt": get_prompt(),
    }).to_string()
}

/// Reset shell state (for module transitions)
pub fn reset_shell() {
    IS_LISTENING.store(false, Ordering::Relaxed);
    LISTENER_PORT.store(0, Ordering::Relaxed);
    IN_REVERSE_SHELL.store(false, Ordering::Relaxed);
    IS_ROOT.store(false, Ordering::Relaxed);
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
        assert!(!is_root());
        assert_eq!(get_prompt(), "user@cyberedu:~$ ");

        let msg = start_listener(4444);
        assert!(msg.contains("4444"));

        exit_shell();
        assert!(!in_reverse_shell());
    }

    #[test]
    fn test_whoami_default() {
        reset_shell();
        assert_eq!(handle_whoami(), "user");
    }

    #[test]
    fn test_whoami_in_shell() {
        reset_shell();
        IN_REVERSE_SHELL.store(true, Ordering::Relaxed);
        assert_eq!(handle_whoami(), "victim");
        IS_ROOT.store(true, Ordering::Relaxed);
        assert_eq!(handle_whoami(), "root");
        reset_shell();
    }
}
