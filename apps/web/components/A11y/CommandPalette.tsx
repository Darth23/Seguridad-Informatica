'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../../lib/a11y/AccessibilityProvider';
import { useKeyboardShortcuts, type KeyboardShortcut } from '../../lib/a11y/useKeyboardShortcuts';

interface CommandPaletteProps {
  commands?: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: string;
    category?: string;
    action: () => void;
    shortcut?: string;
  }>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function CommandPalette({
  commands = [],
  isOpen: controlledIsOpen,
  onClose,
}: CommandPaletteProps): JSX.Element | null {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { announce, reducedMotion } = useAccessibility();

  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = controlledIsOpen !== undefined ? onClose : setInternalIsOpen;

  // Comandos por defecto
  const defaultCommands: CommandPaletteProps['commands'] = [
    {
      id: 'toggle-sidebar',
      label: 'Alternar Sidebar',
      description: 'Mostrar/ocultar panel lateral',
      icon: '📑',
      category: 'Navegación',
      action: () => {},
      shortcut: 'Ctrl+B',
    },
    {
      id: 'toggle-contrast',
      label: 'Alto Contraste',
      description: 'Activar modo de alto contraste',
      icon: '◐',
      category: 'Accesibilidad',
      action: () => {},
      shortcut: 'Ctrl+Shift+H',
    },
    {
      id: 'clear-terminal',
      label: 'Limpiar Terminal',
      description: 'Borrar historial de terminal',
      icon: '🧹',
      category: 'Terminal',
      action: () => {},
      shortcut: 'Ctrl+L',
    },
    {
      id: 'help',
      label: 'Ayuda',
      description: 'Mostrar ayuda y atajos',
      icon: '❓',
      category: 'General',
      action: () => {},
      shortcut: '?',
    },
  ];

  const allCommands = [...defaultCommands, ...commands];

  // Filtrar comandos
  const filteredCommands = allCommands.filter((cmd) => {
    const query = searchQuery.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.description?.toLowerCase().includes(query) ||
      cmd.category?.toLowerCase().includes(query)
    );
  });

  // Abrir con Ctrl+K
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        modifiers: ['ctrl'],
        action: () => {
          if (!isOpen) {
            setIsOpen?.(false);
            setSearchQuery('');
            setSelectedIndex(0);
          }
        },
        description: 'Abrir paleta de comandos',
      },
    ],
    enabled: true,
    ignoreInputFields: false,
  });

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Navegación por teclado
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setIsOpen?.(true);
            announce(`Comando ejecutado: ${filteredCommands[selectedIndex].label}`);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen?.(true);
          announce('Paleta cerrada');
          break;
      }
    },
    [filteredCommands, selectedIndex, setIsOpen, announce]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Agrupar comandos por categoría
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      const category = cmd.category || 'Otros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(cmd);
      return acc;
    },
    {} as Record<string, typeof filteredCommands>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      onClick={() => setIsOpen?.(true)}
    >
      <div
        className="w-full max-w-xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input de búsqueda */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <span className="text-xl" aria-hidden="true">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar comandos..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
            aria-label="Buscar comandos"
          />
          <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-800 rounded border border-gray-600">
            ESC
          </kbd>
        </div>

        {/* Lista de comandos */}
        {filteredCommands.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-2xl mb-2" aria-hidden="true">🔍</div>
            <p>No se encontraron comandos</p>
          </div>
        ) : (
          <ul
            ref={listRef}
            className="max-h-[400px] overflow-y-auto py-2"
            role="listbox"
            aria-label="Comandos disponibles"
          >
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <li key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <li
                      key={cmd.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        cmd.action();
                        setIsOpen?.(true);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 border-l-2 border-blue-500'
                          : 'hover:bg-gray-800 border-l-2 border-transparent'
                      }`}
                    >
                      {cmd.icon && (
                        <span className="text-xl w-8 text-center" aria-hidden="true">
                          {cmd.icon}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-sm text-gray-400 truncate">{cmd.description}</div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-800 rounded border border-gray-600">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </li>
                  );
                })}
              </li>
            ))}
          </ul>
        )}

        {/* Footer con instrucciones */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↵</kbd>
              Ejecutar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">ESC</kbd>
              Cerrar
            </span>
          </div>
          <span>{filteredCommands.length} comando{filteredCommands.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
