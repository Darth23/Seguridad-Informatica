export const LESSON_0_2 = `
<h1 style="color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #1e293b">Modulo 0.2: Redes y Anatomia de un Paquete</h1>

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">El modelo TCP/IP</h2>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">Todo trafico en Internet se transmite en <strong style="color:#fff">paquetes</strong>. Cada paquete contiene un encabezado con informacion de origen, destino y protocolo.</p>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">El TCP Handshake (Conexion de 3 vidas)</h3>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">Antes de transferir datos, TCP establece una conexion confiable mediante un handshake de 3 pasos:</p>

<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Paso</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Paquete</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Descripcion</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">1</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#f59e0b;font-family:monospace;font-weight:bold">SYN</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">El cliente envia una peticion de conexion al servidor</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">2</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#34d399;font-family:monospace;font-weight:bold">SYN-ACK</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">El servidor confirma y responde con su propia peticion</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace">3</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#3b82f6;font-family:monospace;font-weight:bold">ACK</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">El cliente confirma &mdash; la conexion queda establecida</td></tr>
  </tbody>
</table>

<h3 style="color:#e2e8f0;font-size:1.1rem;font-weight:600;margin-top:1.25rem;margin-bottom:0.5rem">Puertos Criticos</h3>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">Los puertos son los "puntos de entrada" de un servidor. Cada servicio escucha en un puerto especifico:</p>

<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Puerto</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Servicio</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Riesgo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace;font-weight:bold">22</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">SSH (Secure Shell)</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#f59e0b">Medio &mdash; acceso remoto</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace;font-weight:bold">80</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">HTTP (Web no cifrada)</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#ef4444">Alto &mdash; sin cifrado</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace;font-weight:bold">443</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">HTTPS (Web cifrada)</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#22c55e">Bajo &mdash; cifrado TLS</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace;font-weight:bold">3306</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">MySQL</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#ef4444">Alto &mdash; base de datos</td></tr>
    <tr><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1;font-family:monospace;font-weight:bold">8080</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">HTTP Proxy</td><td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#f59e0b">Medio &mdash; alternativo</td></tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Tip Pro</h2>
<div style="background:rgba(30,58,138,0.25);border:1px solid #1e40af;padding:1rem;border-radius:8px;margin:1rem 0;color:#cbd5e1;line-height:1.7">
  Usa <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">nmap</code> para descubrir puertos abiertos en una red. En esta plataforma, la red virtual tiene hosts preconfigurados para practicar.
</div>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Reto Practico</h2>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem"><strong style="color:#fff">Objetivo:</strong> Escanea la red virtual y encuentra el servicio oculto.</p>
<ol style="color:#cbd5e1;line-height:1.8;margin-bottom:1rem;padding-left:1.5rem">
  <li>Ejecuta <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">scan_network</code> para descubrir todos los hosts disponibles</li>
  <li>Usa <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">nmap 10.0.2.15</code> para escanear el host objetivo</li>
  <li>Identifica el puerto inusual que esta abierto</li>
  <li>Envia la FLAG con <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">flag</code> para completar el reto</li>
</ol>
<div style="background:rgba(6,78,59,0.2);border:1px solid #065f46;padding:1rem;border-radius:8px;margin:1.5rem 0">
  <p style="color:#6ee7b7;line-height:1.7;margin:0"><strong>FLAG&#123;network_scanning_master&#125;</strong> se encuentra en el servicio oculto del host 10.0.2.15.</p>
</div>
<p style="color:#cbd5e1;line-height:1.7;margin-top:1rem">Usa la terminal de la derecha para completar el reto.</p>
`;
