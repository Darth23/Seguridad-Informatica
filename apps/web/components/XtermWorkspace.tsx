'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useUIStore, useTerminalStore } from '@/lib/stores/uiStore';
import { XtermA11yWrapper } from './XtermA11yWrapper';
import { processCommand } from '@/lib/wasm';
import type { CommandResponse } from '@/lib/wasm/types';

interface XtermWorkspaceProps {
  onCommandExecute?: (command: string) => Promise<string>;
  initialCommands?: string[];
}

function handleDefaultCommand(command: string): string {
  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
      return [
        '\x1b[1mComandos disponibles:\x1b[0m',
        '  \x1b[32mhelp\x1b[0m              Muestra esta ayuda',
        '  \x1b[32mclear\x1b[0m             Limpia la terminal',
        '  \x1b[32mls\x1b[0m                Lista archivos (WASM)',
        '  \x1b[32mpwd\x1b[0m                Muestra directorio actual',
        '  \x1b[32mcd\x1b[0m [dir]           Cambia de directorio',
        '  \x1b[32mcat\x1b[0m [archivo]      Muestra contenido (WASM)',
        '  \x1b[32mnmap\x1b[0m [host]        Escaneo de red (WASM)',
        '  \x1b[32mscan_network\x1b[0m      Escanea red virtual completa',
        '  \x1b[32mflag\x1b[0m [valor]       Envia una flag CTF (WASM)',
        '  \x1b[32mhash\x1b[0m [data]        Hash de datos (WASM)',
        '  \x1b[32manalyze_log\x1b[0m [log]  Analiza logs (WASM)',
        '  \x1b[32mboss_start\x1b[0m        Inicia boss fight',
        '  \x1b[32mboss_damage\x1b[0m [n]   Ataca al boss',
      ].join('\r\n');
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
}

export function XtermWorkspace({ initialCommands = [] }: XtermWorkspaceProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const initializedRef = useRef(false);
  const inputBuffer = useRef('');
  const cursorPos = useRef(0);

  const stableInitialCommands = useMemo(() => initialCommands, []);
  const { addTerminalLine } = useUIStore();
  const { isReady, setIsReady, addCommand } = useTerminalStore();

  const writePrompt = useCallback((term: Terminal) => {
    term.write('\r\n\x1b[32muser@cyberedu\x1b[0m:\x1b[34m~\x1b[0m$ ');
  }, []);

  const executeCommand = useCallback(async (term: Terminal, command: string) => {
    addCommand(command);
    const parts = command.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    let output = '';
    try {
      const response: CommandResponse = await processCommand(cmd, args);
      if (response.success) {
        output = response.output;
      } else if (response.error) {
        output = response.error.includes('Unknown command')
          ? handleDefaultCommand(command)
          : `\x1b[31m${response.error}\x1b[0m`;
      }
    } catch {
      output = handleDefaultCommand(command);
    }

    if (output) term.writeln(output);
    addTerminalLine(`${command}: ${output || '(empty)'}`);
    writePrompt(term);
  }, [addCommand, addTerminalLine, writePrompt]);

  useEffect(() => {
    if (!terminalRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const t = new Terminal({
      convertEol: true,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#050814',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#050814',
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
        black: '#050814', red: '#ff7b72', green: '#7ee787', yellow: '#d29922',
        blue: '#58a6ff', magenta: '#bc8cff', cyan: '#79c0ff', white: '#b1bac4',
        brightBlack: '#6e7681', brightRed: '#ff7b72', brightGreen: '#7ee787',
        brightYellow: '#d29922', brightBlue: '#58a6ff', brightMagenta: '#bc8cff',
        brightCyan: '#79c0ff', brightWhite: '#ffffff',
      },
      scrollback: 10000,
      tabStopWidth: 2,
      drawBoldTextInBrightColors: true,
      minimumContrastRatio: 7,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    t.loadAddon(fitAddon);
    t.open(terminalRef.current);
    xtermRef.current = t;

    let initDone = false;
    const doInit = () => {
      if (initDone) return;
      initDone = true;

      try { fitAddon.fit(); } catch { /* ignore */ }

      t.writeln('\x1b[1;34m╔══════════════════════════════════════════════════════╗\x1b[0m');
      t.writeln('\x1b[1;34m║\x1b[0m  \x1b[1;33mCyberEdu Terminal\x1b[0m                                    \x1b[1;34m║\x1b[0m');
      t.writeln('\x1b[1;34m║\x1b[0m  Entorno seguro de aprendizaje                  \x1b[1;34m║\x1b[0m');
      t.writeln('\x1b[1;34m╚══════════════════════════════════════════════════════╝\x1b[0m');
      t.writeln('');
      t.writeln('Escribe \x1b[1;32mhelp\x1b[0m para ver los comandos disponibles.');
      t.writeln('\x1b[1;35m[WASM]\x1b[0m Core engine loaded and ready.');
      t.writeln('');

      stableInitialCommands.forEach((cmd) => {
        t.writeln(`\x1b[32muser@cyberedu\x1b[0m:\x1b[34m~\x1b[0m$ ${cmd}`);
      });

      writePrompt(t);
      setIsReady(true);

      // All keyboard input via xterm.js onData — no HTML input needed
      t.onData((data) => {
        const code = data.charCodeAt(0);

        if (data === '\r') {
          const cmd = inputBuffer.current.trim();
          t.write('\r\n');
          if (cmd) executeCommand(t, cmd);
          else writePrompt(t);
          inputBuffer.current = '';
          cursorPos.current = 0;
        } else if (data === '\x7f') {
          if (cursorPos.current > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, cursorPos.current - 1) + inputBuffer.current.slice(cursorPos.current);
            cursorPos.current--;
            t.write('\b \b');
          }
        } else if (data === '\x03') {
          t.write('^C\r\n');
          inputBuffer.current = '';
          cursorPos.current = 0;
          writePrompt(t);
        } else if (data === '\x0c') {
          t.clear();
          writePrompt(t);
        } else if (code >= 32) {
          inputBuffer.current = inputBuffer.current.slice(0, cursorPos.current) + data + inputBuffer.current.slice(cursorPos.current);
          cursorPos.current++;
          t.write(data);
        }
      });

      t.focus();
    };

    const unsubscribe = t.onRender(() => {
      unsubscribe.dispose();
      setTimeout(doInit, 100);
    });
    const fallbackTimer = setTimeout(doInit, 500);

    const handleResize = () => {
      if (terminalRef.current && terminalRef.current.clientHeight > 0) fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe.dispose();
      window.removeEventListener('resize', handleResize);
      t.dispose();
      xtermRef.current = null;
      initializedRef.current = false;
      setIsReady(false);
    };
  }, []);

  return (
    <XtermA11yWrapper isReady={isReady}>
      <div className="h-full flex flex-col bg-[#050814]">
        <div
          ref={terminalRef}
          className="flex-1 min-h-0 overflow-hidden"
          role="application"
          aria-label="Terminal interactiva"
          onClick={() => xtermRef.current?.focus()}
        />
        <div className="px-4 py-1 bg-[#0d1117] border-t border-slate-800 text-xs text-slate-500 flex justify-between flex-shrink-0">
          <span>Ctrl+L: Limpiar | Ctrl+C: Cancelar</span>
          <span>{isReady ? '● Activo' : '○ Cargando...'}</span>
        </div>
      </div>
    </XtermA11yWrapper>
  );
}

export default XtermWorkspace;
