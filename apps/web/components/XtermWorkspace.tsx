'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useUIStore, useTerminalStore } from '@/lib/stores/uiStore';
import { XtermA11yWrapper } from './XtermA11yWrapper';

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
        
        // Execute command
        if (onCommandExecute) {
          onCommandExecute(command).then((output) => {
            term.writeln(output);
            addTerminalLine(`${command}: ${output}`);
          }).catch((err) => {
            term.writeln(`\x1b[31mError: ${err.message}\x1b[0m`);
            addTerminalLine(`${command}: ERROR - ${err.message}`);
          });
        } else {
          // Default command handler
          const output = handleDefaultCommand(command);
          term.writeln(output);
          addTerminalLine(`${command}: ${output}`);
        }
        
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
  }, [currentInput, onCommandExecute, addCommand, navigateHistory, addTerminalLine, clearTerminal]);

  // Default command handler
  const handleDefaultCommand = (command: string): string => {
    const cmd = command.split(' ')[0].toLowerCase();
    const args = command.split(' ').slice(1);

    switch (cmd) {
      case 'help':
        return `
\x1b[1mComandos disponibles:\x1b[0m
  \x1b[32mhelp\x1b[0m              Muestra esta ayuda
  \x1b[32mclear\x1b[0m             Limpia la terminal
  \x1b[32mls\x1b[0m                Lista archivos
  \x1b[32mpwd\x1b[0m                Muestra directorio actual
  \x1b[32mwhoami\x1b[0m             Muestra usuario actual
  \x1b[32mdate\x1b[0m               Muestra fecha y hora
  \x1b[32mecho\x1b[0m [texto]       Imprime texto
  \x1b[32mcat\x1b[0m [archivo]      Muestra contenido de archivo
  \x1b[32mnmap\x1b[0m [host]        Escaneo de red simulado
  \x1b[32mflag\x1b[0m [valor]       Envía una flag CTF
`;

      case 'clear':
        return '';

      case 'ls':
        return `\x1b[1;34mdocumentos/\x1b[0m  \x1b[1;34mdescargas/\x1b[0m  \x1b[32mnotas.txt\x1b[0m  \x1b[35mconfig.json\x1b[0m  \x1b[31msecret.flag\x1b[0m`;

      case 'pwd':
        return '/home/user';

      case 'whoami':
        return 'user';

      case 'date':
        return new Date().toString();

      case 'echo':
        return args.join(' ');

      case 'cat':
        if (args[0] === 'notas.txt') {
          return 'Notas de estudio para el curso de ciberseguridad.';
        } else if (args[0] === 'config.json') {
          return '{\n  "theme": "dark",\n  "language": "es"\n}';
        } else if (args[0] === 'secret.flag') {
          return '\x1b[31m⚠️ Acceso denegado. Necesitas permisos de root.\x1b[0m';
        }
        return `\x1b[31mcat: ${args[0] || ''}: No such file or directory\x1b[0m`;

      case 'nmap':
        return `
\x1b[1mStarting Nmap simulation...\x1b[0m
Nmap scan report for ${args[0] || 'localhost'}
Host is up (0.0012s latency).
Not shown: 997 closed ports
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
443/tcp open https

\x1b[32mNmap done: 1 IP address (1 host up) scanned in 0.15 seconds\x1b[0m
`;

      case 'flag':
        if (args[0]) {
          return `\x1b[33mEnviando flag para validación: ${args[0]}\x1b[0m\n\x1b[31m[SIMULACIÓN] Flag no válida. Intenta nuevamente.\x1b[0m`;
        }
        return '\x1b[31mUso: flag <valor>\x1b[0m';

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
