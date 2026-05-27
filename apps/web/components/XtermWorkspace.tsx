'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useUIStore, useTerminalStore } from '@/lib/stores/uiStore';
import { XtermA11yWrapper } from './XtermA11yWrapper';
import { processCommand } from '@/lib/wasm';
import type { CommandResponse } from '@/lib/wasm/types';

interface XtermWorkspaceProps {
  onCommandExecute?: (command: string) => Promise<string>;
  initialCommands?: string[];
}

export function XtermWorkspace({ onCommandExecute, initialCommands = [] }: XtermWorkspaceProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { addTerminalLine, terminalHistory, clearTerminal } = useUIStore();
  const { isReady, setIsReady, commandHistory, addCommand, navigateHistory, clearHistory } = useTerminalStore();
  
  const [currentInput, setCurrentInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      convertEol: true,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selection: 'rgba(88, 166, 255, 0.3)',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#7ee787',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#79c0ff',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ff7b72',
        brightGreen: '#7ee787',
        brightYellow: '#d29922',
        brightBlue: '#58a6ff',
        brightMagenta: '#bc8cff',
        brightCyan: '#79c0ff',
        brightWhite: '#ffffff',
      },
      scrollback: 10000,
      tabStopWidth: 2,
      drawBoldTextInBrightColors: true,
      minimumContrastRatio: 7,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;34m╔══════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;34m║\x1b[0m  \x1b[1;33mCyberEdu Terminal\x1b[0m                                    \x1b[1;34m║\x1b[0m');
    term.writeln('\x1b[1;34m║\x1b[0m  Entorno seguro de aprendizaje                  \x1b[1;34m║\x1b[0m');
    term.writeln('\x1b[1;34m╚══════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('Escribe \x1b[1;32mhelp\x1b[0m para ver los comandos disponibles.');
    term.writeln('');
    term.writeln('\x1b[1;35m[WA SM]\x1b[0m Core engine loaded and ready.');
    term.writeln('');

    // Execute initial commands
    initialCommands.forEach((cmd) => {
      term.writeln(`\x1b[32muser@cyberedu\x1b[0m:\x1b[34m~\x1b[0m$ ${cmd}`);
    });

    setIsReady(true);

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      setIsReady(false);
    };
  }, [setIsReady, initialCommands]);

  // Focus trap - keep focus on terminal when active
  useEffect(() => {
    if (!xtermRef.current || !isFocused) return;

    const term = xtermRef.current;
    
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    term.onFocus(handleFocus);
    term.onBlur(handleBlur);

    return () => {
      term.off('focus', handleFocus);
      term.off('blur', handleBlur);
    };
  }, [isFocused]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!xtermRef.current) return;

    const term = xtermRef.current;

    if (e.key === 'Enter') {
      e.preventDefault();
      
      const command = currentInput.trim();
      if (command) {
        // Echo command
        term.writeln(`\r\n\x1b[32muser@cyberedu\x1b[0m:\x1b[34m~\x1b[0m$ ${command}`);
        
        // Add to history
        addCommand(command);
        
        // Execute command via WASM
        executeWasmCommand(command).then((output) => {
          term.writeln(output);
          addTerminalLine(`${command}: ${output}`);
        }).catch((err) => {
          term.writeln(`\x1b[31mError: ${err.message}\x1b[0m`);
          addTerminalLine(`${command}: ERROR - ${err.message}`);
        });
        
        setCurrentInput('');
      } else {
        term.writeln(`\r\n\x1b[32muser@cyberedu\x1b[0m:\x1b[34m~\x1b[0m$ `);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevCommand = navigateHistory('up');
      if (prevCommand !== null) {
        setCurrentInput(prevCommand);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextCommand = navigateHistory('down');
      setCurrentInput(nextCommand || '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion could be added here
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      term.clear();
      clearTerminal();
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      term.writeln('^C');
      setCurrentInput('');
    }
  }, [currentInput, addCommand, navigateHistory, addTerminalLine, clearTerminal]);

  /**
   * Execute a command through the WASM bridge
   * This routes commands to the appropriate WASM module
   */
  const executeWasmCommand = async (command: string): Promise<string> => {
    const parts = command.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    // First, try to route through WASM
    try {
      const response: CommandResponse = await processCommand(cmd, args);
      
      if (response.success) {
        return response.output;
      } else if (response.error) {
        // Check if it's an unknown command error from WASM
        if (response.error.includes('Unknown command')) {
          // Fall back to default handler for basic commands
          return handleDefaultCommand(command);
        }
        return `\x1b[31m${response.error}\x1b[0m`;
      }
    } catch (error) {
      console.error('[WASM] Command execution error:', error);
      // Fall back to default handler on WASM error
      return handleDefaultCommand(command);
    }

    return handleDefaultCommand(command);
  };

  // Default command handler for basic shell commands not handled by WASM
  const handleDefaultCommand = (command: string): string => {
    const cmd = command.split(' ')[0].toLowerCase();
    const args = command.split(' ').slice(1);

    switch (cmd) {
      case 'help':
        return `
\x1b[1mComandos disponibles:\x1b[0m
  \x1b[32mhelp\x1b[0m              Muestra esta ayuda
  \x1b[32mclear\x1b[0m             Limpia la terminal
  \x1b[32mls\x1b[0m                Lista archivos (WASM)
  \x1b[32mpwd\x1b[0m                Muestra directorio actual
  \x1b[32mwhoami\x1b[0m             Muestra usuario actual
  \x1b[32mdate\x1b[0m               Muestra fecha y hora
  \x1b[32mecho\x1b[0m [texto]       Imprime texto
  \x1b[32mcat\x1b[0m [archivo]      Muestra contenido de archivo (WASM)
  \x1b[32mnmap\x1b[0m [host]        Escaneo de red simulado (WASM)
  \x1b[32mflag\x1b[0m [valor]       Envía una flag CTF (WASM)
  \x1b[32mhash\x1b[0m [data]        Hash de datos (WASM)
  \x1b[32manalyze_log\x1b[0m [log]  Analiza logs (WASM)
`;

      case 'clear':
        return '';

      case 'pwd':
        return '/home/user';

      case 'whoami':
        return 'user';

      case 'date':
        return new Date().toString();

      case 'echo':
        return args.join(' ');

      default:
        return `\x1b[31m${cmd}: command not found\x1b[0m`;
    }
  };

  return (
    <XtermA11yWrapper isReady={isReady}>
      <div className="h-full flex flex-col bg-[#0d1117]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-400 font-mono">bash — user@cyberedu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isFocused ? 'text-green-400' : 'text-gray-500'}`}>
              {isFocused ? '● Activo' : '○ Inactivo'}
            </span>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-hidden p-2"
          role="application"
          aria-label="Terminal interactiva"
          aria-live="polite"
          onClick={() => {
            xtermRef.current?.focus();
            inputRef.current?.focus();
          }}
        >
          {/* Shadow Input for Accessibility */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="sr-only"
            aria-label="Entrada de terminal"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        {/* Status Bar */}
        <div className="px-4 py-1 bg-[#161b22] border-t border-gray-700 text-xs text-gray-500 flex justify-between">
          <span>Ctrl+L: Limpiar | Ctrl+C: Cancelar | ↑/↓: Historial</span>
          <span>{terminalHistory.length} comandos en sesión</span>
        </div>
      </div>
    </XtermA11yWrapper>
  );
}
