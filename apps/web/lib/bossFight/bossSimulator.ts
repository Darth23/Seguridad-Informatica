/**
 * BossSimulator WASM Bridge
 * Interface entre React y el módulo WASM de boss_simulator.rs
 * Gestiona la máquina de estados del boss (health, phases, defenses, vulnerabilities)
 */

import type { CommandResponse } from '../wasm/types';

export interface BossState {
  health: number;
  maxHealth: number;
  phase: 'idle' | 'active' | 'enraged' | 'defeated';
  defenses: string[];
  vulnerabilities: string[];
  activeAttacks: string[];
  timeElapsed: number;
  damageDealt: number;
  damageTaken: number;
}

export interface BossAction {
  type: 'attack' | 'defend' | 'exploit' | 'special';
  payload: Record<string, unknown>;
}

export interface BossEvent {
  type: 'damage' | 'heal' | 'phase_change' | 'defense_added' | 'vulnerability_exposed';
  timestamp: number;
  data: Record<string, unknown>;
}

class BossSimulatorBridge {
  private state: BossState | null = null;
  private eventListeners: Map<string, Set<(event: BossEvent) => void>> = new Map();
  private simulationInterval: number | null = null;

  async initialize(_wasmMod: CommandResponse): Promise<void> {
    this.state = {
      health: 1000,
      maxHealth: 1000,
      phase: 'idle',
      defenses: ['firewall', 'ids'],
      vulnerabilities: [],
      activeAttacks: [],
      timeElapsed: 0,
      damageDealt: 0,
      damageTaken: 0,
    };
    
    // Cargar estado persistente si existe
    const saved = localStorage.getItem('boss_fight_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      } catch (e) {
        console.warn('Failed to load boss state:', e);
      }
    }
  }

  startSimulation(): void {
    if (!this.state || this.state.phase !== 'idle') return;
    
    this.state.phase = 'active';
    this.emitEvent({
      type: 'phase_change',
      timestamp: Date.now(),
      data: { from: 'idle', to: 'active' },
    });

    // Timer de simulación
    const startTime = Date.now();
    this.simulationInterval = window.setInterval(() => {
      if (!this.state) return;
      
      this.state.timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // Auto-guardado cada 5 segundos
      if (this.state.timeElapsed % 5 === 0) {
        this.persistState();
      }

      // Check enragement after 3 minutes
      if (this.state.timeElapsed >= 180 && this.state.phase === 'active') {
        this.triggerEnrage();
      }
    }, 1000);
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  dealDamage(amount: number, attackType?: string): number {
    if (!this.state || this.state.phase === 'defeated') return 0;

    let actualDamage = amount;

    // Reducir daño por defensas activas
    if (this.state.defenses.includes('shield') && attackType === 'direct') {
      actualDamage = Math.floor(amount * 0.5);
    }

    // Aumentar daño si hay vulnerabilidad explotada
    if (attackType && this.state.vulnerabilities.includes(attackType)) {
      actualDamage = Math.floor(amount * 1.5);
    }

    this.state.health = Math.max(0, this.state.health - actualDamage);
    this.state.damageDealt += actualDamage;

    this.emitEvent({
      type: 'damage',
      timestamp: Date.now(),
      data: { amount: actualDamage, attackType, remaining: this.state.health },
    });

    // Check defeat
    if (this.state.health <= 0) {
      this.state.phase = 'defeated';
      this.stopSimulation();
      this.emitEvent({
        type: 'phase_change',
        timestamp: Date.now(),
        data: { from: this.state.phase, to: 'defeated' },
      });
      this.clearPersistentState();
    }

    return actualDamage;
  }

  addDefense(defense: string): void {
    if (!this.state || this.state.defenses.includes(defense)) return;
    
    this.state.defenses.push(defense);
    this.emitEvent({
      type: 'defense_added',
      timestamp: Date.now(),
      data: { defense },
    });
    this.persistState();
  }

  removeDefense(defense: string): void {
    if (!this.state) return;
    
    this.state.defenses = this.state.defenses.filter(d => d !== defense);
    this.persistState();
  }

  exposeVulnerability(vuln: string): void {
    if (!this.state || this.state.vulnerabilities.includes(vuln)) return;
    
    this.state.vulnerabilities.push(vuln);
    this.emitEvent({
      type: 'vulnerability_exposed',
      timestamp: Date.now(),
      data: { vulnerability: vuln },
    });
    this.persistState();
  }

  triggerEnrage(): void {
    if (!this.state) return;
    
    const previousPhase = this.state.phase;
    this.state.phase = 'enraged';
    this.state.defenses = []; // Clear defenses on enrage
    
    this.emitEvent({
      type: 'phase_change',
      timestamp: Date.now(),
      data: { from: previousPhase, to: 'enraged' },
    });
    this.persistState();
  }

  getState(): BossState | null {
    return this.state;
  }

  reset(): void {
    this.stopSimulation();
    this.state = {
      health: 1000,
      maxHealth: 1000,
      phase: 'idle',
      defenses: ['firewall', 'ids'],
      vulnerabilities: [],
      activeAttacks: [],
      timeElapsed: 0,
      damageDealt: 0,
      damageTaken: 0,
    };
    this.clearPersistentState();
    this.emitEvent({
      type: 'phase_change',
      timestamp: Date.now(),
      data: { from: 'defeated', to: 'idle' },
    });
  }

  onEvent(eventType: string, callback: (event: BossEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);

    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  private emitEvent(event: BossEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(cb => cb(event));
    }
    // Also emit to 'all' listeners
    const allListeners = this.eventListeners.get('all');
    if (allListeners) {
      allListeners.forEach(cb => cb(event));
    }
  }

  private persistState(): void {
    if (this.state) {
      localStorage.setItem('boss_fight_state', JSON.stringify(this.state));
    }
  }

  private clearPersistentState(): void {
    localStorage.removeItem('boss_fight_state');
  }
}

// Singleton instance
export const bossSimulator = new BossSimulatorBridge();

// Hook helper para usar en componentes React
export function createBossSimulatorHook() {
  return bossSimulator;
}
