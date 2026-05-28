/**
 * useBossTimer Hook
 * Hook personalizado para gestionar el timer del boss fight
 * Respeta prefers-reduced-motion y proporciona announcements accesibles
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { bossSimulator, type BossState } from './bossSimulator';

interface UseBossTimerOptions {
  autoStart?: boolean;
  onPhaseChange?: (phase: BossState['phase']) => void;
  onEnrage?: () => void;
}

interface UseBossTimerReturn {
  timeElapsed: number;
  isRunning: boolean;
  phase: BossState['phase'];
  start: () => void;
  pause: () => void;
  reset: () => void;
  formattedTime: string;
  announcement: string;
}

export function useBossTimer(options: UseBossTimerOptions = {}): UseBossTimerReturn {
  const { autoStart = false, onPhaseChange, onEnrage } = options;
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<BossState['phase']>('idle');
  const [announcement, setAnnouncement] = useState('');
  
  const intervalRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  // Detectar prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Suscribirse a eventos del boss simulator
  useEffect(() => {
    const state = bossSimulator.getState();
    if (state) {
      setTimeElapsed(state.timeElapsed);
      setPhase(state.phase);
    }

    const unsubscribeDamage = bossSimulator.onEvent('damage', (event) => {
      if (reducedMotionRef.current) {
        setAnnouncement(`Daño aplicado. Vida restante: ${(event.data.remaining as number) || 0}`);
      } else {
        setAnnouncement(`¡Golpe! ${event.data.amount} de daño`);
      }
    });

    const unsubscribePhase = bossSimulator.onEvent('phase_change', (event) => {
      const newPhase = event.data.to as BossState['phase'];
      setPhase(newPhase);
      
      if (newPhase === 'enraged') {
        setAnnouncement('¡ALERTA! El boss está enfurecido');
        onEnrage?.();
      } else if (newPhase === 'defeated') {
        setAnnouncement('¡Victoria! Boss derrotado');
      } else if (newPhase === 'active') {
        setAnnouncement('El boss ha entrado en combate');
      }
      
      onPhaseChange?.(newPhase);
    });

    return () => {
      unsubscribeDamage();
      unsubscribePhase();
    };
  }, [onPhaseChange, onEnrage]);

  // Timer principal
  useEffect(() => {
    if (isRunning && phase !== 'defeated' && phase !== 'idle') {
      const startTime = Date.now() - timeElapsed * 1000;

      intervalRef.current = window.setInterval(() => {
        const newState = bossSimulator.getState();
        if (newState) {
          const newTime = Math.floor((Date.now() - startTime) / 1000);
          setTimeElapsed(newTime);

          // Anuncio cada 30 segundos (solo si reduced-motion está desactivado)
          if (!reducedMotionRef.current && newTime > 0 && newTime % 30 === 0) {
            setAnnouncement(`Tiempo transcurrido: ${formatTime(newTime)}`);
          }
        }
      }, reducedMotionRef.current ? 1000 : 100); // Actualizar más lento con reduced-motion
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, phase, timeElapsed]);

  // Auto-start
  useEffect(() => {
    if (autoStart && phase === 'idle') {
      start();
    }
  }, [autoStart, phase]);

  const start = useCallback(() => {
    if (phase === 'idle' || phase === 'defeated') {
      bossSimulator.reset();
    }
    bossSimulator.startSimulation();
    setIsRunning(true);
    setAnnouncement('Combate iniciado');
  }, [phase]);

  const pause = useCallback(() => {
    bossSimulator.stopSimulation();
    setIsRunning(false);
    setAnnouncement('Combate pausado');
  }, []);

  const reset = useCallback(() => {
    bossSimulator.reset();
    setTimeElapsed(0);
    setIsRunning(false);
    setPhase('idle');
    setAnnouncement('Combate reiniciado');
  }, []);

  const formattedTime = formatTime(timeElapsed);

  return {
    timeElapsed,
    isRunning,
    phase,
    start,
    pause,
    reset,
    formattedTime,
    announcement,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default useBossTimer;
