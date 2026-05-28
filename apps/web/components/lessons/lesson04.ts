export const LESSON_0_4 = `
<h1 style="color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:0.25rem;padding-bottom:1rem;border-bottom:1px solid #1e293b">Modulo 0.4: Banner Grabbing y Analisis de Versiones</h1>
<p style="color:#94a3b8;font-family:monospace;font-size:0.75rem;margin-bottom:1.5rem">Core / Reconnaissance / Service-Enumeration</p>

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">¿Que es el Banner Grabbing?</h2>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">Un <strong style="color:#fff">Banner</strong> es el mensaje de texto automatico que envian los servicios de red (como SSH, FTP o servidores Apache) cuando un cliente se conecta. Este banner frecuentemente expone el <strong style="color:#34d399">nombre exacto y la version</strong> del software que se esta ejecutando.</p>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">Los auditores de seguridad utilizan esta informacion para buscar <strong style="color:#f59e0b">CVEs</strong> (Common Vulnerabilities and Exposures) conocidas — vulnerabilidades publicadas que afectan versiones especificas de software.</p>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Herramientas de Enumeracion</h2>

<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Herramienta</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Parametro / Uso</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Objetivo Tecnico</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">nmap -sV [IP]</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Sonda de Versiones</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Envia paquetes de prueba avanzados para forzar al puerto a revelar su software y version.</td>
    </tr>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">nc [IP] [Puerto]</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Conexion Netcat</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Abre un socket TCP directo en crudo para capturar el banner de bienvenida manualmente sin ruidos extra.</td>
    </tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Base de Datos de Vulnerabilidades (CVE)</h2>
<div style="background:rgba(120,53,15,0.2);border:1px solid rgba(180,83,9,0.6);padding:1rem;border-radius:8px;margin:1rem 0;color:#cbd5e1;line-height:1.7">
  Si descubres que un servidor corre un servicio desactualizado como <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#f59e0b;font-size:0.875rem">OpenSSH 7.2</code>, puedes buscarlo en bases de datos publicas como <strong style="color:#fff">CVE Details</strong> o <strong style="color:#fff">NIST NVD</strong> para encontrar exploits listos que comprometan la maquina de inmediato.
</div>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Reto Practico: Extraccion de Version de Servicio</h2>
<div style="background:rgba(6,78,59,0.2);border:1px solid rgba(5,150,105,0.6);padding:1rem;border-radius:8px;margin:1rem 0">
  <p style="color:#6ee7b7;line-height:1.7;margin:0 0 0.5rem 0"><strong>Objetivo:</strong> Un servidor critico en el segmento local posee una IP procedimental y un puerto abierto. Debes interrogar al puerto para extraer su banner de bienvenida e identificar el software exacto que se esta ejecutando.</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0;font-size:0.875rem">1. Ejecuta <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">nmap -sV [IP]</code> o abre una conexion directa con <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">nc [IP] [Puerto]</code> usando los datos descubiertos en tu segmento de red local.</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0.5rem 0 0 0;font-size:0.875rem">2. Envia la flag en el formato exacto del banner de software encontrado: <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">flag [Nombre_Version]</code> (Ejemplo: <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">flag OpenSSH_7.2p2</code>)</p>
</div>
<p style="color:#cbd5e1;line-height:1.7;margin-top:1rem">Usa la terminal de la derecha para completar el reto.</p>
`;
