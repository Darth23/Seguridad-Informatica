export const LESSON_0_1 = `
<h1 style="color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #1e293b">Modulo 0.1: Navegacion Eficiente en la Terminal</h1>

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Conceptos Clave</h2>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">El sistema de archivos Linux</h3>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">El sistema de archivos Linux se organiza en una estructura de arbol jerarquica. Cada ruta comienza desde el directorio raiz <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/</code>.</p>
<ul style="color:#cbd5e1;line-height:1.8;margin-bottom:1rem;padding-left:1.5rem">
  <li><strong style="color:#fff">Ruta absoluta:</strong> Comienza desde <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/</code> &rarr; <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/var/log/auth.log</code></li>
  <li><strong style="color:#fff">Ruta relativa:</strong> Comienza desde tu posicion actual &rarr; <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">../../etc/passwd</code></li>
  <li><strong style="color:#fff">Directorio home:</strong> Tu directorio personal <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">~/</code> o <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">/home/usuario/</code></li>
</ul>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">Navegacion basica</h3>
<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Comando</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Descripcion</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Ejemplo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">pwd</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Muestra el directorio actual</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">pwd &rarr; /home/user</td></tr>
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
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Accion</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">Tab</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Autocompleta comandos y rutas</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">Ctrl+C</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Cancela el comando en ejecucion</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">Ctrl+L</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Limpia la pantalla</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">Arrow Up/Down</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Navega por el historial de comandos</td></tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Tip Pro</h2>
<div style="background:rgba(30,58,138,0.25);border:1px solid #1e40af;padding:1rem;border-radius:8px;margin:1rem 0;color:#cbd5e1;line-height:1.7">
  Usa la tecla <strong style="color:#fff">Tabulador (Tab)</strong> para autocompletar nombres de archivos y comandos. Escribe las primeras letras y presiona Tab &mdash; el sistema completara la ruta si hay una unica coincidencia.
</div>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Reto Practico</h2>
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
