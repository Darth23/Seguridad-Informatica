'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { bossSimulator, type BossState } from '../../lib/bossFight/bossSimulator';
import { useBossTimer } from '../../lib/bossFight/useBossTimer';

interface BossHUDProps {
  onAttack?: (damage: number) => void;
  onExploit?: (vulnerability: string) => void;
}

export function BossHUD({ onAttack, onExploit }: BossHUDProps): JSX.Element {
  const [bossState, setBossState] = useState<BossState | null>(null);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [showDamageIndicator, setShowDamageIndicator] = useState(false);
  
  const {
    timeElapsed,
    isRunning,
    phase,
    start,
    pause,
    reset,
    formattedTime,
    announcement,
  } = useBossTimer({
    autoStart: false,
    onPhaseChange: (newPhase) => {
      // Actualizar estado cuando cambia la fase
      const state = bossSimulator.getState();
      if (state) setBossState({ ...state });
    },
  });

  // Suscribirse a eventos de daño para animaciones
  useEffect(() => {
    const unsubscribe = bossSimulator.onEvent('damage', (event) => {
      const amount = event.data.amount as number;
      setLastDamage(amount);
      setShowDamageIndicator(true);
      
      setTimeout(() => {
        setShowDamageIndicator(false);
      }, 1000);

      onAttack?.(amount);
    });

    // Obtener estado inicial
    const state = bossSimulator.getState();
    if (state) setBossState(state);

    return () => unsubscribe();
  }, [onAttack]);

  // Actualizar estado periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const state = bossSimulator.getState();
      if (state) setBossState(state);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleAttack = useCallback((attackType: string) => {
    if (!bossState || bossState.phase === 'defeated' || bossState.phase === 'idle') return;

    const baseDamage = Math.floor(Math.random() * 50) + 20;
    const actualDamage = bossSimulator.dealDamage(baseDamage, attackType);
    
    setLastDamage(actualDamage);
    setShowDamageIndicator(true);
    
    setTimeout(() => {
      setShowDamageIndicator(false);
    }, 1000);
  }, [bossState]);

  const handleExploit = useCallback((vulnerability: string) => {
    if (!bossState || bossState.phase === 'defeated') return;
    
    bossSimulator.exposeVulnerability(vulnerability);
    onExploit?.(vulnerability);
    
    const state = bossSimulator.getState();
    if (state) setBossState(state);
  }, [bossState, onExploit]);

  const getHealthPercentage = (): number => {
    if (!bossState) return 100;
    return Math.round((bossState.health / bossState.maxHealth) * 100);
  };

  const getPhaseColor = (): string => {
    switch (phase) {
      case 'idle': return 'bg-gray-600';
      case 'active': return 'bg-red-600';
      case 'enraged': return 'bg-orange-500 animate-pulse';
      case 'defeated': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getHealthColor = (): string => {
    const percentage = getHealthPercentage();
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!bossState) {
    return (
      <div 
        className="p-4 bg-gray-900 rounded-lg border border-gray-700"
        role="status"
        aria-live="polite"
      >
        <p className="text-gray-400">Cargando Boss HUD...</p>
      </div>
    );
  }

  return (
    <div 
      className="relative p-6 bg-gray-900 rounded-lg border border-gray-700 shadow-xl"
      role="region"
      aria-label="Boss Fight Interface"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Announcement para screen readers */}
      {announcement && (
        <div 
          className="sr-only" 
          role="status" 
          aria-live="assertive"
          aria-atomic="true"
        >
          {announcement}
        </div>
      )}

      {/* Header con nombre y timer */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getPhaseColor()}`} aria-hidden="true" />
            CyberGuard v9.2
          </h2>
          <p className="text-sm text-gray-400 capitalize">Estado: {phase}</p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-mono text-white" aria-label={`Tiempo transcurrido: ${formattedTime}`}>
            {formattedTime}
          </div>
          <p className="text-xs text-gray-500">TIEMPO</p>
        </div>
      </div>

      {/* Barra de vida */}
      <div className="mb-6" role="progressbar" aria-valuenow={getHealthPercentage()} aria-valuemin={0} aria-valuemax={100} aria-label={`Vida del boss: ${getHealthPercentage()}%`}>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-400">INTEGRIDAD DEL SISTEMA</span>
          <span className="text-sm font-mono text-white">{getHealthPercentage()}%</span>
        </div>
        <div className="h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className={`h-full transition-all duration-300 ease-out ${getHealthColor()} ${showDamageIndicator ? 'animate-pulse' : ''}`}
            style={{ width: `${getHealthPercentage()}%` }}
            role="presentation"
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 font-mono">
          {bossState.health} / {bossState.maxHealth} HP
        </div>
      </div>

      {/* Defensas activas */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">DEFENSAS ACTIVAS</h3>
        <div className="flex flex-wrap gap-2">
          {bossState.defenses.length > 0 ? (
            bossState.defenses.map((defense) => (
              <span
                key={defense}
                className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs border border-blue-700 capitalize"
              >
                {defense}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500 italic">Sin defensas - ¡Aprovecha!</span>
          )}
        </div>
      </div>

      {/* Vulnerabilidades */}
      {bossState.vulnerabilities.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">VULNERABILIDADES EXPLOTADAS</h3>
          <div className="flex flex-wrap gap-2">
            {bossState.vulnerabilities.map((vuln) => (
              <span
                key={vuln}
                className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-xs border border-red-700 capitalize"
              >
                {vuln}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap gap-3">
        {phase === 'idle' || phase === 'defeated' ? (
          <button
            onClick={start}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={phase === 'idle' ? 'Iniciar combate' : 'Reiniciar combate'}
          >
            {phase === 'idle' ? 'INICIAR COMBATE' : 'REINICIAR'}
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAttack('direct')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Ataque directo"
            >
              ⚔️ ATAQUE DIRECTO
            </button>
            
            <button
              onClick={() => handleAttack('sql_injection')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Inyección SQL"
            >
              💉 SQL INJECTION
            </button>
            
            <button
              onClick={() => handleAttack('xss')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Ataque XSS"
            >
              🎭 XSS
            </button>

            <button
              onClick={pause}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Pausar combate"
            >
              ⏸️ PAUSAR
            </button>
          </>
        )}

        {isRunning && (
          <button
            onClick={reset}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Rendirse y reiniciar"
          >
            🏳️ RENDIRSE
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-mono text-red-400">{bossState.damageDealt}</div>
          <div className="text-xs text-gray-500">DAÑO TOTAL</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-mono text-blue-400">{bossState.defenses.length}</div>
          <div className="text-xs text-gray-500">DEFENSAS</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-mono text-purple-400">{bossState.vulnerabilities.length}</div>
          <div className="text-xs text-gray-500">VULNS</div>
        </div>
      </div>

      {/* Damage Indicator Overlay */}
      {showDamageIndicator && lastDamage && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-4xl font-bold text-red-500 animate-bounce drop-shadow-lg">
            -{lastDamage}
          </div>
        </div>
      )}
    </div>
  );
}

export default BossHUD;
