'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';

interface Toast {
  id: string;
  message: string;
  type: 'achievement' | 'success' | 'error' | 'info';
  icon?: string;
}

const ACHIEVEMENT_DEFINITIONS: Record<string, { name: string; description: string; icon: string }> = {
  'first-blood': { name: 'First Blood', description: 'Completaste tu primera lección', icon: '🩸' },
  'crypto-master': { name: 'Crypto Master', description: 'Completaste el módulo de criptografía', icon: '🔐' },
  'speed-demon': { name: 'Speed Demon', description: 'Completaste una lección en menos de 2 minutos', icon: '⚡' },
  'no-hints': { name: 'No Hints', description: 'Resolviste un challenge sin usar pistas', icon: '🧠' },
  'perfect-score': { name: 'Perfect Score', description: 'Obtuviste 100% en un challenge', icon: '💯' },
  'network-ninja': { name: 'Network Ninja', description: 'Completaste el módulo de redes', icon: '🥷' },
  'log-hunter': { name: 'Log Hunter', description: 'Analizaste 10 logs exitosamente', icon: '🔍' },
  'flag-collector': { name: 'Flag Collector', description: 'Capturaste 5 flags CTF', icon: '🚩' },
  'boss-slayer': { name: 'Boss Slayer', description: 'Derrotaste al boss final', icon: '⚔️' },
  'streak-master': { name: 'Streak Master', description: 'Mantuviste una racha de 7 días', icon: '🔥' },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const achievements = useUIStore((s) => s.achievements);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent<{ message: string; type?: Toast['type']; icon?: string }>) => {
      addToast({
        message: e.detail.message,
        type: e.detail.type || 'info',
        icon: e.detail.icon,
      });
    };
    window.addEventListener('cyberedu:toast', handler as EventListener);
    return () => window.removeEventListener('cyberedu:toast', handler as EventListener);
  }, [addToast]);

  useEffect(() => {
    if (achievements.length === 0) return;
    const latest = achievements[achievements.length - 1];
    const def = ACHIEVEMENT_DEFINITIONS[latest];
    if (def) {
      addToast({
        message: `${def.icon} Logro desbloqueado: ${def.name}`,
        type: 'achievement',
        icon: def.icon,
      });
      // Screen reader announcement
      const sr = document.getElementById('sr-announcer');
      if (sr) sr.textContent = `Logro desbloqueado: ${def.name}. ${def.description}`;
    }
  }, [achievements, addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`animate-[toast-enter_0.3s_ease-out] px-4 py-3 rounded-lg shadow-lg border text-sm font-medium max-w-sm ${
            toast.type === 'achievement'
              ? 'bg-yellow-900/90 border-yellow-600 text-yellow-200'
              : toast.type === 'success'
              ? 'bg-green-900/90 border-green-600 text-green-200'
              : toast.type === 'error'
              ? 'bg-red-900/90 border-red-600 text-red-200'
              : 'bg-gray-800/90 border-gray-600 text-gray-200'
          }`}
        >
          {toast.icon && <span className="mr-2" aria-hidden="true">{toast.icon}</span>}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function getAchievementDef(id: string) {
  return ACHIEVEMENT_DEFINITIONS[id];
}

export function getAllAchievements() {
  return Object.entries(ACHIEVEMENT_DEFINITIONS).map(([id, def]) => ({ id, ...def }));
}

export default ToastContainer;
