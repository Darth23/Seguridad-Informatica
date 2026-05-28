'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/lib/stores/uiStore';
import { useEffect } from 'react';

const XtermWorkspace = dynamic(
  () => import('./XtermWorkspace').then((m) => m.XtermWorkspace),
  { ssr: false }
);

const LESSON_0_1 = `
<h1 style="color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #1e293b">Módulo 0.1: Navegación Eficiente en la Terminal</h1>

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">🛠️ Conceptos Clave</h2>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">El sistema de archivos Linux</h3>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">El sistema de archivos Linux se organiza en una estructura de árbol jerárquica. Cada ruta comienza desde el directorio raíz <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/</code>.</p>
<ul style="color:#cbd5e1;line-height:1.8;margin-bottom:1rem;padding-left:1.5rem">
  <li><strong style="color:#fff">Ruta absoluta:</strong> Comienza desde <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/</code> → <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/var/log/auth.log</code></li>
  <li><strong style="color:#fff">Ruta relativa:</strong> Comienza desde tu posición actual → <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">../../etc/passwd</code></li>
  <li><strong style="color:#fff">Directorio home:</strong> Tu directorio personal <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">~/</code> o <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/home/usuario/</code></li>
</ul>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">Navegación básica</h3>
<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Comando</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Descripción</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Ejemplo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">pwd</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Muestra el directorio actual</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">pwd → /home/user</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">ls -la</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Lista archivos con detalles y ocultos</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">ls -la /var/log</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">cd</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Cambia de directorio</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">cd /etc</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">cat</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Muestra el contenido de un archivo</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">cat /etc/hostname</td></tr>
  </tbody>
</table>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">Atajos de terminal</h3>
<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Atajo</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Acción</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">Tab</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Autocompleta comandos y rutas</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">Ctrl+C</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Cancela el comando en ejecución</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">Ctrl+L</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Limpia la pantalla</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">↑/↓</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Navega por el historial de comandos</td></tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">🚨 Tip Pro</h2>
<blockquote style="border-left:4px solid #3b82f6;background:rgba(30,58,138,0.25);padding:1rem 1rem;border-radius:0 8px 8px 0;margin:1rem 0;color:#cbd5e1;line-height:1.7">
  Usa la tecla <strong style="color:#fff">Tabulador (Tab)</strong> para autocompletar nombres de archivos y comandos. Escribe las primeras letras y presiona Tab — el sistema completará la ruta si hay una coincidencia única.
</blockquote>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">🎯 Reto Práctico</h2>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem"><strong style="color:#fff">Objetivo:</strong> Navega a <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/var/log/</code> y analiza los archivos de log del sistema.</p>
<ol style="color:#cbd5e1;line-height:1.8;margin-bottom:1rem;padding-left:1.5rem">
  <li>Usa <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">cd /var/log</code> para navegar al directorio de logs</li>
  <li>Ejecuta <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">ls -la</code> para ver todos los archivos disponibles</li>
  <li>Usa <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">cat</code> para leer <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">auth.log</code> y buscar intentos de acceso fallidos</li>
  <li>Busca la FLAG oculta usando <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">grep</code> en los logs</li>
</ol>
<div style="background:rgba(6,78,59,0.2);border:1px solid #065f46;padding:1rem;border-radius:8px;margin:1.5rem 0">
  <p style="color:#6ee7b7;line-height:1.7;margin:0"><strong>FLAG&#123;log_analysis_expert&#125;</strong> se encuentra oculta en uno de los archivos de log.</p>
</div>
<p style="color:#cbd5e1;line-height:1.7;margin-top:1rem">Usa la terminal de la derecha para completar el reto. Escribe <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">help</code> para ver los comandos disponibles.</p>
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
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: LESSON_0_1 }} />
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
