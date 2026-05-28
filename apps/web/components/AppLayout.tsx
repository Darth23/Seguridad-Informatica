'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { MarkdownReader } from './MarkdownReader';
import { useUIStore } from '@/lib/stores/uiStore';
import { useEffect } from 'react';

const XtermWorkspace = dynamic(
  () => import('./XtermWorkspace').then((m) => m.XtermWorkspace),
  { ssr: false }
);

const LESSON_0_1 = `# Módulo 0.1: Navegación Eficiente en la Terminal

## 🛠️ Conceptos Clave

### El sistema de archivos Linux

El sistema de archivos Linux se organiza en una estructura de árbol jerárquica. Cada ruta comienza desde el directorio raíz **\`/\`**.

- **Ruta absoluta:** Comienza desde \`/\` → \`/var/log/auth.log\`
- **Ruta relativa:** Comienza desde tu posición actual → \`../../etc/passwd\`
- **Directorio home:** Tu directorio personal \`~/\` o \`/home/usuario/\`

### Navegación básica

<table class="w-full text-left border-collapse my-4 text-sm">
  <thead>
    <tr>
      <th class="border-b border-slate-700 pb-2 text-emerald-400 font-mono">Comando</th>
      <th class="border-b border-slate-700 pb-2 text-emerald-400 font-mono">Descripción</th>
      <th class="border-b border-slate-700 pb-2 text-emerald-400 font-mono">Ejemplo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">pwd</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Muestra el directorio actual</td><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">pwd → /home/user</td></tr>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">ls -la</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Lista archivos con detalles y ocultos</td><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">ls -la /var/log</td></tr>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">cd</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Cambia de directorio</td><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">cd /etc</td></tr>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">cat</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Muestra el contenido de un archivo</td><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">cat /etc/hostname</td></tr>
  </tbody>
</table>

### Atajos de terminal

<table class="w-full text-left border-collapse my-4 text-sm">
  <thead>
    <tr>
      <th class="border-b border-slate-700 pb-2 text-emerald-400 font-mono">Atajo</th>
      <th class="border-b border-slate-700 pb-2 text-emerald-400 font-mono">Acción</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">Tab</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Autocompleta comandos y rutas</td></tr>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">Ctrl+C</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Cancela el comando en ejecución</td></tr>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">Ctrl+L</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Limpia la pantalla</td></tr>
    <tr><td class="py-2 border-b border-slate-800/50 text-slate-300 font-mono">↑/↓</td><td class="py-2 border-b border-slate-800/50 text-slate-300">Navega por el historial de comandos</td></tr>
  </tbody>
</table>

---

## 🚨 Tip Pro

> Usa la tecla **Tabulador (Tab)** para autocompletar nombres de archivos y comandos. Escribe las primeras letras y presiona Tab — el sistema completará la ruta si hay una coincidencia única.

---

## 🎯 Reto Práctico

**Objetivo:** Navega a \`/var/log/\` y analiza los archivos de log del sistema.

1. Usa \`cd /var/log\` para navegar al directorio de logs
2. Ejecuta \`ls -la\` para ver todos los archivos disponibles
3. Usa \`cat\` para leer \`auth.log\` y buscar intentos de acceso fallidos
4. Busca la FLAG oculta usando \`grep\` en los logs

> **FLAG{log_analysis_expert}** se encuentra oculta en uno de los archivos de log.

Usa la terminal de la derecha para completar el reto. Escribe \`help\` para ver los comandos disponibles.
`;

export default function AppLayout() {
  const roadmapData: any = [];
  const { toggleHighContrast, setFocusedPanel } = useUIStore();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        toggleHighContrast();
      }
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setFocusedPanel('sidebar');
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setFocusedPanel('content');
      }
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        setFocusedPanel('terminal');
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [toggleHighContrast, setFocusedPanel]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'row', width: '100vw', height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: '#0a0f1d' }}
      className="flex flex-row w-screen h-screen max-h-screen overflow-hidden bg-[#0a0f1d] text-slate-100 select-none"
    >
      {/* PANEL 1: LEFT SIDEBAR */}
      <aside
        style={{ width: 320, minWidth: 320, maxWidth: 320, height: '100vh', flexShrink: 0, overflow: 'auto', background: '#0e1626' }}
        className="w-80 min-w-[320px] max-w-[320px] h-full bg-[#0e1626] border-r border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto"
        data-tour="sidebar"
      >
        <Sidebar roadmapData={roadmapData} />
      </aside>

      {/* PANEL 2: CENTER CONTENT */}
      <main
        style={{ flex: '1 1 0%', minWidth: 0, height: '100vh', overflow: 'auto', background: '#0a0f1d' }}
        className="flex-1 h-full bg-[#0a0f1d] p-8 overflow-y-auto border-r border-slate-800 flex flex-col"
        data-tour="content"
        id="content-panel"
      >
        <div className="prose prose-invert max-w-none">
          <MarkdownReader content={LESSON_0_1} />
        </div>
      </main>

      {/* PANEL 3: RIGHT TERMINAL */}
      <section
        style={{ width: 450, minWidth: 400, maxWidth: 500, height: '100vh', flexShrink: 0, overflow: 'hidden', background: '#050814' }}
        className="w-[450px] min-w-[400px] max-w-[500px] h-full bg-[#050814] p-4 flex flex-col gap-4 overflow-hidden"
        data-tour="terminal"
      >
        <div className="border-b border-slate-800 pb-2 flex-shrink-0">
          <span className="text-xs font-mono text-emerald-400 font-bold">CyberEdu Terminal [WASM]</span>
        </div>
        <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }} className="flex-1 w-full min-h-0 overflow-hidden">
          <XtermWorkspace />
        </div>
      </section>
    </div>
  );
}
