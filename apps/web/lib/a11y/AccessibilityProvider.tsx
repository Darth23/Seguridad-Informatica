'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReaderAnnouncements: string[];
  toggleHighContrast: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps): JSX.Element {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');
  const [screenReaderAnnouncements, setAnnouncements] = useState<string[]>([]);

  // Detectar prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detectar prefers-contrast
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedContrast = localStorage.getItem('a11y-high-contrast');
    const savedFontSize = localStorage.getItem('a11y-font-size') as 'small' | 'medium' | 'large' | null;

    if (savedContrast !== null) {
      setHighContrast(savedContrast === 'true');
    }

    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
  }, []);

  // Aplicar clase de alto contraste
  useEffect(() => {
    const root = document.documentElement;
    
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    localStorage.setItem('a11y-high-contrast', String(highContrast));
  }, [highContrast]);

  // Aplicar tamaño de fuente
  useEffect(() => {
    const root = document.documentElement;
    
    root.setAttribute('data-font-size', fontSize);

    switch (fontSize) {
      case 'small':
        root.style.setProperty('--text-base', '14px');
        break;
      case 'medium':
        root.style.setProperty('--text-base', '16px');
        break;
      case 'large':
        root.style.setProperty('--text-base', '18px');
        break;
    }

    localStorage.setItem('a11y-font-size', fontSize);
  }, [fontSize]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, []);

  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setAnnouncements((prev) => [...prev.slice(-4), { id, message, priority } as any]);
    
    // Auto-limpieza después de 5 segundos
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a: any) => a.id !== id));
    }, 5000);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  const value: AccessibilityContextType = {
    reducedMotion,
    highContrast,
    fontSize,
    screenReaderAnnouncements: screenReaderAnnouncements.map((a: any) => a.message),
    toggleHighContrast,
    setFontSize,
    announce,
    clearAnnouncements,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {/* Live regions para screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {screenReaderAnnouncements.map((a: any, i) => (
          <span key={i}>{a}</span>
        ))}
      </div>

      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {screenReaderAnnouncements
          .filter((a: any) => a.priority === 'assertive')
          .map((a: any, i) => (
            <span key={i}>{a.message}</span>
          ))}
      </div>

      {/* Skip links */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Saltar al contenido principal
      </a>

      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook para usar el contexto de accesibilidad
 */
export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }

  return context;
}

/**
 * Hook para verificar reduced motion
 */
export function useReducedMotion(): boolean {
  const { reducedMotion } = useAccessibility();
  return reducedMotion;
}

/**
 * Componente para anuncios accesibles
 */
interface AnnounceProps {
  message: string;
  priority?: 'polite' | 'assertive';
  children?: React.ReactNode;
}

export function Announce({ message, priority = 'polite', children }: AnnounceProps): JSX.Element {
  const { announce } = useAccessibility();

  useEffect(() => {
    announce(message, priority);
  }, [message, priority, announce]);

  return <>{children}</>;
}

export default AccessibilityProvider;
