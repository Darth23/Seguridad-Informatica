export const LESSON_0_3 = `
<h1 style="color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:0.25rem;padding-bottom:1rem;border-bottom:1px solid #1e293b">Modulo 0.3: Escaneo Activo Avanzado y Flags TCP</h1>
<p style="color:#94a3b8;font-family:monospace;font-size:0.75rem;margin-bottom:1.5rem">Core / Networking / Stealth-Scanning</p>

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">El Escaneo Sigiloso (SYN Scan / Half-Open)</h2>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">En un escaneo normal (Full Connect), el cliente completa el TCP handshake completo: <strong style="color:#fff">SYN &rarr; SYN-ACK &rarr; ACK</strong>. Esto deja un registro en el servidor porque la conexion se establece completamente.</p>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">En un <strong style="color:#34d399">SYN Scan (Half-Open)</strong>, el atacante envia un <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">SYN</code>, recibe un <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">SYN-ACK</code> del puerto abierto, pero en lugar de responder con <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">ACK</code>, envia un <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#f59e0b;font-size:0.875rem">RST</code> (Reset) para cortar la conexion antes de que quede registrada en la aplicacion objetivo.</p>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">Tabla de Flags TCP</h3>
<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Flag</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Significado</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Uso en Escaneo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#f59e0b;font-family:monospace;font-weight:bold">SYN</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Synchronize</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Inicia la solicitud de conexion</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#3b82f6;font-family:monospace;font-weight:bold">ACK</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Acknowledge</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Confirma la recepcion de un paquete</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#ef4444;font-family:monospace;font-weight:bold">RST</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Reset</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Rompe la conexion abruptamente (usado para no dejar registro)</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#8b5cf6;font-family:monospace;font-weight:bold">FIN</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Finish</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Termina la conexion de manera ordenada</td></tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Nuevos Parametros de Nmap</h2>

<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Comando</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Descripcion</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">nmap -sS [IP]</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Ejecuta un SYN Scan (Stealth). Requiere privilegios root.</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">nmap -Pn [IP]</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Salta la verificacion de Ping (asume que el host esta vivo si bloquea ICMP).</td></tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Reto Practico: Evasion de Firewall Simulado</h2>
<div style="background:rgba(6,78,59,0.2);border:1px solid rgba(5,150,105,0.6);padding:1rem;border-radius:8px;margin:1rem 0">
  <p style="color:#6ee7b7;line-height:1.7;margin:0 0 0.5rem 0"><strong>Objetivo:</strong> El sistema de seguridad perimetral de la IP asignada esta bloqueando las trazas ICMP (Ping eco requests), haciendo parecer que el host esta apagado. Ademas, un IDS registra cualquier intento de conexion completa. Encuentra el puerto oculto evadiendo el bloqueo.</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0;font-size:0.875rem">Debes combinar los parametros correctos de Nmap para forzar el escaneo sin ping y en modo sigiloso. La flag de validacion sera: <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">flag [puerto_encontrado]</code></p>
</div>
<p style="color:#cbd5e1;line-height:1.7;margin-top:1rem">Usa la terminal de la derecha para completar el reto.</p>
`;
