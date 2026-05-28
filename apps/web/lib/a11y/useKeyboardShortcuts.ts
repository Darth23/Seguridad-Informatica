/**
 * useKeyboardShortcuts Hook
 * Gestiona atajos de teclado accesibles con soporte para screen readers
 */

import { useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: () => void;
  description: string;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  ignoreInputFields?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  ignoreInputFields = true,
}: UseKeyboardShortcutsOptions): void {
  const { announce, reducedMotion } = useAccessibility();
  const shortcutsRef = useRef(shortcuts);

  // Actualizar ref cuando cambian los shortcuts
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar en campos de input si está configurado
      if (ignoreInputFields) {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const isEditable = target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
        
        if (isEditable) return;
      }

      // Normalizar tecla
      const pressedKey = event.key.toLowerCase();
      const pressedModifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[] = [];
      
      if (event.ctrlKey || event.metaKey) pressedModifiers.push('ctrl');
      if (event.altKey) pressedModifiers.push('alt');
      if (event.shiftKey) pressedModifiers.push('shift');

      // Buscar shortcut coincidente
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        const keyMatches = shortcut.key.toLowerCase() === pressedKey;
        const modifierMatches = !shortcut.modifiers || 
          shortcut.modifiers.length === pressedModifiers.length &&
          shortcut.modifiers.every((m) => pressedModifiers.includes(m));

        return keyMatches && modifierMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        
        // Ejecutar acción
        matchingShortcut.action();
        
        // Anunciar acción a screen readers
        if (!reducedMotion) {
          announce(`Atajo activado: ${matchingShortcut.description}`, 'polite');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, ignoreInputFields, announce, reducedMotion]);
}

/**
 * Hook preconfigurado con atajos comunes de la aplicación
 */
export function useDefaultKeyboardShortcuts(overrides?: {
  onToggleSidebar?: () => void;
  onFocusTerminal?: () => void;
  onFocusContent?: () => void;
  onOpenPalette?: () => void;
  onToggleHighContrast?: () => void;
  onClearTerminal?: () => void;
}): KeyboardShortcut[] {
  const {
    onToggleSidebar = () => {},
    onFocusTerminal = () => {},
    onFocusContent = () => {},
    onOpenPalette = () => {},
    onToggleHighContrast = () => {},
    onClearTerminal = () => {},
  } = overrides || {};

  return [
    {
      key: 'b',
      modifiers: ['ctrl'],
      action: onToggleSidebar,
      description: 'Alternar sidebar',
      category: 'Navegación',
    },
    {
      key: '1',
      modifiers: ['ctrl'],
      action: onFocusContent,
      description: 'Foco en contenido',
      category: 'Navegación',
    },
    {
      key: '2',
      modifiers: ['ctrl'],
      action: onFocusTerminal,
      description: 'Foco en terminal',
      category: 'Navegación',
    },
    {
      key: 'k',
      modifiers: ['ctrl'],
      action: onOpenPalette,
      description: 'Abrir paleta de comandos',
      category: 'General',
    },
    {
      key: 'h',
      modifiers: ['ctrl', 'shift'],
      action: onToggleHighContrast,
      description: 'Alternar alto contraste',
      category: 'Accesibilidad',
    },
    {
      key: 'l',
      modifiers: ['ctrl'],
      action: onClearTerminal,
      description: 'Limpiar terminal',
      category: 'Terminal',
    },
    {
      key: '?',
      modifiers: [],
      action: onOpenPalette,
      description: 'Mostrar ayuda de atajos',
      category: 'General',
    },
  ];
}

export default useKeyboardShortcuts;
