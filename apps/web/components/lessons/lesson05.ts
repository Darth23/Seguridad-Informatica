export const LESSON_0_5 = `
<h1 style="color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:0.25rem;padding-bottom:1rem;border-bottom:1px solid #1e293b">Modulo 0.5: Explotacion Inicial y Reverse Shells</h1>
<p style="color:#94a3b8;font-family:monospace;font-size:0.75rem;margin-bottom:1.5rem">Core / Exploitation / Gaining-Access</p>

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">¿Que es un Exploit y un Payload?</h2>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">Un <strong style="color:#ef4444">Exploit</strong> es el vehiculo/codigo utilizado para aprovechar una vulnerabilidad (como las encontradas via Banner Grabbing en el Modulo 0.4). El <strong style="color:#f59e0b">Payload</strong> es el codigo malicioso real que se entrega mediante el exploit para ejecutar acciones en el objetivo — como otorgar un shell remoto.</p>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Bind Shell vs Reverse Shell</h2>

<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Tipo</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Descripcion</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Ventaja / Desventaja</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#f59e0b;font-family:monospace;font-weight:bold">Bind Shell</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">El objetivo abre un puerto y espera a que el atacante se conecte.</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Generalmente bloqueado por firewalls de entrada.</td>
    </tr>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#34d399;font-family:monospace;font-weight:bold">Reverse Shell</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">El objetivo se conecta DE VUELTA a la maquina del atacante.</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Es el estandar de la industria — las conexiones de salida suelen pasar el firewall.</td>
    </tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Comandos Esenciales (Netcat Listener)</h2>

<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Comando</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Significado Tecnico</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">nc -lvnp [Puerto]</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Configura un "Listener" (oyente) local TCP en un puerto especifico para esperar la conexion entrante de la victima.</td>
    </tr>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">exploit_service [IP] [Port]</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Lanza el exploit contra el servicio vulnerable en la IP objetivo, conectando de vuelta a tu listener.</td>
    </tr>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">cat flag.txt</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Lee el archivo flag (solo funciona dentro de la reverse shell).</td>
    </tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Reto Practico: Lanzando tu Primera Reverse Shell</h2>
<div style="background:rgba(6,78,59,0.2);border:1px solid rgba(5,150,105,0.6);padding:1rem;border-radius:8px;margin:1rem 0">
  <p style="color:#6ee7b7;line-height:1.7;margin:0 0 0.75rem 0"><strong>Objetivo:</strong> Hemos identificado que el servidor procedimental del laboratorio previo ejecuta un servicio vulnerable. Tu propia maquina local tiene una IP asignada en la red. Tu mision es poner tu terminal a escuchar, explotar el servicio y capturar el archivo flag que solo el usuario comprometido puede leer.</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem">1. Primero, prepara tu terminal para recibir conexiones abriendo un listener en un puerto aleatorio:</p>
  <p style="color:#cbd5e1;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem"><code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">nc -lvnp [tu_puerto]</code></p>
  <p style="color:#94a3b8;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem">2. En este entorno simulado, una vez activo el listener, ejecuta el exploit:</p>
  <p style="color:#cbd5e1;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem"><code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">exploit_service 10.0.4.X [tu_puerto]</code></p>
  <p style="color:#94a3b8;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem">3. Si la conexion se establece con exito, tu prompt cambiara a <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#ef4444;font-size:0.875rem">victim@target:~$</code>. Usa <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">cat flag.txt</code> para obtener tu recompensa.</p>
</div>
<p style="color:#cbd5e1;line-height:1.7;margin-top:1rem">Usa la terminal de la derecha para completar el reto.</p>
`;
