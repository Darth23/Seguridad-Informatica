//! Boss Simulator module for WASM
//! Provides a state machine for boss fight gameplay

use wasm_bindgen::prelude::*;
use crate::CommandResponse;

/// Boss phase definitions
#[derive(Debug, Clone, PartialEq)]
pub enum BossPhase {
    Idle,
    Active,
    Enraged,
    Defeated,
}

impl BossPhase {
    fn as_str(&self) -> &str {
        match self {
            BossPhase::Idle => "idle",
            BossPhase::Active => "active",
            BossPhase::Enraged => "enraged",
            BossPhase::Defeated => "defeated",
        }
    }
}

/// Boss state
struct BossState {
    health: i32,
    max_health: i32,
    phase: BossPhase,
    defenses: Vec<String>,
    vulnerabilities: Vec<String>,
    damage_dealt: i32,
    time_elapsed: u32,
}

impl BossState {
    fn new() -> Self {
        BossState {
            health: 1000,
            max_health: 1000,
            phase: BossPhase::Idle,
            defenses: vec!["firewall".to_string(), "ids".to_string()],
            vulnerabilities: Vec::new(),
            damage_dealt: 0,
            time_elapsed: 0,
        }
    }
}

static mut BOSS_STATE: Option<BossState> = None;

fn get_boss() -> &'static mut BossState {
    unsafe {
        if BOSS_STATE.is_none() {
            BOSS_STATE = Some(BossState::new());
        }
        BOSS_STATE.as_mut().unwrap()
    }
}

/// Get current boss state as JSON
#[wasm_bindgen]
pub fn boss_get_state() -> String {
    let response = boss_get_state_impl();
    serialize_response(&response)
}

pub fn boss_get_state_impl() -> CommandResponse {
    let boss = get_boss();
    let state = serde_json::json!({
        "health": boss.health,
        "maxHealth": boss.max_health,
        "phase": boss.phase.as_str(),
        "defenses": boss.defenses,
        "vulnerabilities": boss.vulnerabilities,
        "damageDealt": boss.damage_dealt,
        "timeElapsed": boss.time_elapsed,
        "healthPercent": (boss.health as f64 / boss.max_health as f64 * 100.0) as i32,
    });
    CommandResponse::success(state.to_string())
}

/// Start the boss fight
#[wasm_bindgen]
pub fn boss_start() -> String {
    let response = boss_start_impl();
    serialize_response(&response)
}

pub fn boss_start_impl() -> CommandResponse {
    let boss = get_boss();
    if boss.phase != BossPhase::Idle && boss.phase != BossPhase::Defeated {
        return CommandResponse::error("Boss fight already in progress".to_string());
    }
    boss.phase = BossPhase::Active;
    boss.health = boss.max_health;
    boss.defenses = vec!["firewall".to_string(), "ids".to_string()];
    boss.vulnerabilities.clear();
    boss.damage_dealt = 0;
    boss.time_elapsed = 0;
    CommandResponse::success("Boss fight started! Health: 1000/1000".to_string())
}

/// Deal damage to the boss
#[wasm_bindgen]
pub fn boss_deal_damage(args: &str) -> String {
    let response = boss_deal_damage_impl(args);
    serialize_response(&response)
}

pub fn boss_deal_damage_impl(args: &str) -> CommandResponse {
    let parts: Vec<&str> = args.splitn(2, ':').collect();
    let amount: i32 = parts[0].parse().unwrap_or(0);
    let attack_type = parts.get(1).unwrap_or(&"direct");

    let boss = get_boss();
    if boss.phase != BossPhase::Active && boss.phase != BossPhase::Enraged {
        return CommandResponse::error("No active boss fight".to_string());
    }

    let mut actual_damage = amount;

    if boss.defenses.contains(&"shield".to_string()) && *attack_type == "direct" {
        actual_damage = actual_damage / 2;
    }

    if boss.vulnerabilities.contains(&attack_type.to_string()) {
        actual_damage = (actual_damage as f64 * 1.5) as i32;
    }

    boss.health = (boss.health - actual_damage).max(0);
    boss.damage_dealt += actual_damage;

    if boss.health <= boss.max_health / 3 && boss.phase == BossPhase::Active {
        boss.phase = BossPhase::Enraged;
        boss.defenses.clear();
    }

    if boss.health <= 0 {
        boss.phase = BossPhase::Defeated;
    }

    CommandResponse::success(format!(
        "Damage dealt: {} (type: {})\nBoss health: {}/{} ({})\nPhase: {}",
        actual_damage, attack_type,
        boss.health, boss.max_health,
        (boss.health as f64 / boss.max_health as f64 * 100.0) as i32,
        boss.phase.as_str()
    ))
}

/// Expose a vulnerability
#[wasm_bindgen]
pub fn boss_expose_vulnerability(vuln: &str) -> String {
    let response = boss_expose_vulnerability_impl(vuln);
    serialize_response(&response)
}

pub fn boss_expose_vulnerability_impl(vuln: &str) -> CommandResponse {
    if vuln.is_empty() {
        return CommandResponse::error("Usage: boss_vuln <vulnerability_name>".to_string());
    }

    let boss = get_boss();
    if boss.phase != BossPhase::Active && boss.phase != BossPhase::Enraged {
        return CommandResponse::error("No active boss fight".to_string());
    }

    if !boss.vulnerabilities.contains(&vuln.to_string()) {
        boss.vulnerabilities.push(vuln.to_string());
    }

    CommandResponse::success(format!(
        "Vulnerability '{}' exposed! Attacks of this type deal 1.5x damage.",
        vuln
    ))
}

/// Add a defense to the boss
#[wasm_bindgen]
pub fn boss_add_defense(defense: &str) -> String {
    let response = boss_add_defense_impl(defense);
    serialize_response(&response)
}

pub fn boss_add_defense_impl(defense: &str) -> CommandResponse {
    if defense.is_empty() {
        return CommandResponse::error("Usage: boss_defend <defense_name>".to_string());
    }

    let boss = get_boss();
    if !boss.defenses.contains(&defense.to_string()) {
        boss.defenses.push(defense.to_string());
    }

    CommandResponse::success(format!(
        "Defense '{}' activated! Active defenses: {:?}",
        defense, boss.defenses
    ))
}

/// Reset the boss fight
#[wasm_bindgen]
pub fn boss_reset() -> String {
    let response = boss_reset_impl();
    serialize_response(&response)
}

pub fn boss_reset_impl() -> CommandResponse {
    let boss = get_boss();
    *boss = BossState::new();
    CommandResponse::success("Boss fight reset. Ready for a new battle.".to_string())
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
    fn test_boss_start() {
        let result = boss_start();
        assert!(result.contains("started"));
    }

    #[test]
    fn test_boss_damage() {
        boss_start();
        let result = boss_deal_damage("100:direct");
        assert!(result.contains("Damage dealt: 100"));
    }

    #[test]
    fn test_boss_vulnerability() {
        boss_start();
        let result = boss_expose_vulnerability("sql_injection");
        assert!(result.contains("exposed"));
    }

    #[test]
    fn test_boss_defeat() {
        boss_start();
        let result = boss_deal_damage("1000:direct");
        assert!(result.contains("Defeated"));
    }
}
