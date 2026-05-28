'use client';

import React, { useEffect, useState } from 'react';

interface DamageIndicatorProps {
  amount: number;
  position?: { x: number; y: number };
  variant?: 'damage' | 'heal' | 'critical';
  duration?: number;
  onComplete?: () => void;
}

export function DamageIndicator({
  amount,
  position = { x: 50, y: 50 },
  variant = 'damage',
  duration = 1000,
  onComplete,
}: DamageIndicatorProps): JSX.Element | null {
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Detectar prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!visible) return null;

  const getVariantStyles = (): string => {
    switch (variant) {
      case 'damage':
        return 'text-red-500';
      case 'heal':
        return 'text-green-500';
      case 'critical':
        return 'text-yellow-400 text-2xl font-bold';
      default:
        return 'text-white';
    }
  };

  const getAnimationClass = (): string => {
    if (reducedMotion) {
      return ''; // Sin animación si reduced-motion está activo
    }
    
    switch (variant) {
      case 'critical':
        return 'animate-bounce';
      default:
        return 'animate-pulse';
    }
  };

  return (
    <div
      className={`fixed pointer-events-none z-50 ${getVariantStyles()} ${getAnimationClass()}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        textShadow: '0 0 10px rgba(0,0,0,0.8)',
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">
        {variant === 'damage' && 'Daño recibido: '}
        {variant === 'heal' && 'Curación: '}
        {variant === 'critical' && '¡Golpe crítico! '}
        {amount}
      </span>
      <span aria-hidden="true" className="font-mono font-bold drop-shadow-lg">
        {variant === 'damage' && '-'}
        {variant === 'heal' && '+'}
        {variant === 'critical' && '💥 '}
        {Math.abs(amount)}
      </span>
    </div>
  );
}

// Hook para gestionar indicadores de daño múltiples
interface UseDamageIndicatorsReturn {
  addDamage: (amount: number, position?: { x: number; y: number }) => void;
  addHeal: (amount: number, position?: { x: number; y: number }) => void;
  addCritical: (amount: number, position?: { x: number; y: number }) => void;
  indicators: Array<{
    id: string;
    amount: number;
    position: { x: number; y: number };
    variant: 'damage' | 'heal' | 'critical';
  }>;
  clearAll: () => void;
}

export function useDamageIndicators(): UseDamageIndicatorsReturn {
  const [indicators, setIndicators] = useState<Array<{
    id: string;
    amount: number;
    position: { x: number; y: number };
    variant: 'damage' | 'heal' | 'critical';
  }>>([]);

  const addIndicator = (
    amount: number,
    position: { x: number; y: number } = { x: 50, y: 50 },
    variant: 'damage' | 'heal' | 'critical' = 'damage'
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIndicators((prev) => [...prev, { id, amount, position, variant }]);

    // Auto-remove después de 1 segundo
    setTimeout(() => {
      setIndicators((prev) => prev.filter((ind) => ind.id !== id));
    }, 1000);
  };

  const addDamage = (amount: number, position?: { x: number; y: number }) => {
    addIndicator(Math.abs(amount), position, 'damage');
  };

  const addHeal = (amount: number, position?: { x: number; y: number }) => {
    addIndicator(Math.abs(amount), position, 'heal');
  };

  const addCritical = (amount: number, position?: { x: number; y: number }) => {
    addIndicator(Math.abs(amount), position, 'critical');
  };

  const clearAll = () => {
    setIndicators([]);
  };

  return {
    addDamage,
    addHeal,
    addCritical,
    indicators,
    clearAll,
  };
}

// Componente contenedor para renderizar todos los indicadores
export function DamageIndicatorContainer(): JSX.Element {
  const { indicators } = useDamageIndicators();

  return (
    <>
      {indicators.map((indicator) => (
        <DamageIndicator
          key={indicator.id}
          amount={indicator.amount}
          position={indicator.position}
          variant={indicator.variant}
        />
      ))}
    </>
  );
}

export default DamageIndicator;
