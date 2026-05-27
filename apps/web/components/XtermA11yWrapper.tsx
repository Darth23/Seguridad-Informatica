'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';

interface XtermA11yWrapperProps {
  children: React.ReactNode;
  isReady: boolean;
}

/**
 * Wrapper component for xterm.js terminal accessibility
 * Provides:
 * - aria-live region for screen reader announcements
 * - Focus trap management
 * - Keyboard navigation support
 * - High contrast mode support
 */
export function XtermA11yWrapper({ children, isReady }: XtermA11yWrapperProps) {
  const { highContrast, addTerminalLine } = useUIStore();
  const [announcement, setAnnouncement] = useState('');
  const [isFocusTrapped, setIsFocusTrapped] = useState(false);

  // Announce terminal state changes to screen readers
  useEffect(() => {
    if (isReady) {
      setAnnouncement('Terminal lista. Escribe help para ver comandos disponibles.');
      addTerminalLine('[SYSTEM] Terminal inicializada');
    } else {
      setAnnouncement('Cargando terminal...');
    }
  }, [isReady, addTerminalLine]);

  // Handle focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key exits focus trap
      if (e.key === 'Escape' && isFocusTrapped) {
        setIsFocusTrapped(false);
        setAnnouncement('Saliste del modo de terminal. Presiona Tab para navegar.');
      }
      
      // Ctrl+Shift+T enters focus trap
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsFocusTrapped(true);
        setAnnouncement('Modo de terminal activado. Presiona Escape para salir.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusTrapped]);

  // High contrast mode class
  const wrapperClass = highContrast
    ? 'high-contrast-mode [&_*]:contrast-125'
    : '';

  return (
    <div
      className={`relative h-full ${wrapperClass}`}
      role="region"
      aria-label="Espacio de trabajo de terminal"
      aria-busy={!isReady}
    >
      {/* Live Region for Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Focus Trap Indicator */}
      {isFocusTrapped && (
        <div
          className="absolute top-0 left-0 right-0 bg-yellow-600 text-black text-xs font-bold px-2 py-1 z-50 flex items-center justify-between"
          role="alert"
          aria-live="assertive"
        >
          <span>🔒 Modo Terminal Activo</span>
          <span>Presiona ESC para salir</span>
        </div>
      )}

      {/* Main Content */}
      <div className={isFocusTrapped ? 'mt-6' : ''}>
        {children}
      </div>

      {/* Skip Link for Quick Navigation */}
      <a
        href="#content-panel"
        className="sr-only focus:not-sr-only focus:absolute focus:bottom-2 focus:right-2 focus:px-3 focus:py-2 focus:bg-yellow-500 focus:text-black focus:font-bold focus:rounded focus:z-50"
      >
        Saltar al contenido principal
      </a>
    </div>
  );
}

/**
 * Hook for announcing messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  const [message, setMessage] = useState('');

  const announce = useCallback((msg: string, priority: 'polite' | 'assertive' = 'polite') => {
    setMessage(msg);
    // Clear message after announcement
    setTimeout(() => setMessage(''), 1000);
  }, []);

  return { message, announce };
}

/**
 * Focus Trap Component for containing keyboard navigation
 */
interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  onDeactivate: () => void;
}

export function FocusTrap({ children, isActive, onDeactivate }: FocusTrapProps) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDeactivate();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onDeactivate]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="focus-trap-active"
    >
      {children}
    </div>
  );
}
