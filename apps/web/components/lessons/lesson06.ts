export const LESSON_0_6 = `
<h1 style="color:#fff;font-size:1.5rem;font-weight:700;margin-bottom:0.25rem;padding-bottom:1rem;border-bottom:1px solid #1e293b">Modulo 0.6: Enumeracion Interna y Elevacion de Privilegios</h1>
<p style="color:#94a3b8;font-family:monospace;font-size:0.75rem;margin-bottom:1.5rem">Core / Post-Exploitation / PrivEsc</p>

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">¿Que es la Elevacion de Privilegios?</h2>
<p style="color:#cbd5e1;line-height:1.7;margin-bottom:0.75rem">Cuando un exploit tiene exito, los atacantes normalmente aterrizan en una cuenta de usuario con <strong style="color:#f59e0b">privilegios bajos</strong>. La <strong style="color:#ef4444">Elevacion de Privilegios (PrivEsc)</strong> es el proceso de identificar y aprovechar malconfiguraciones, fallos del kernel o permisos inseguros dentro del sistema comprometido para saltar de un usuario normal a <strong style="color:#fff">root</strong> (Linux) o <strong style="color:#fff">SYSTEM</strong> (Windows).</p>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Comandos de Enumeracion Local</h2>

<table style="width:100%;text-left;border-collapse:collapse;margin:1rem 0;font-size:0.875rem">
  <thead>
    <tr>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Comando</th>
      <th style="border-bottom:1px solid #334155;padding-bottom:0.5rem;color:#34d399;font-family:monospace;text-align:left">Objetivo en Post-Explotacion</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">whoami</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Muestra el usuario actual en la sesion (para verificar permisos).</td>
    </tr>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">uname -a</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Imprime la version del Kernel de Linux (busca vulnerabilidades locales conocidas).</td>
    </tr>
    <tr>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#7ee787;font-family:monospace;font-weight:bold">sudo -l</td>
      <td style="padding:0.5rem 0;border-bottom:1px solid rgba(30,41,59,0.5);color:#cbd5e1">Lista los comandos que el usuario actual puede ejecutar con privilegios de root mediante sudo sin conocer la contrasena.</td>
    </tr>
  </tbody>
</table>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">El Peligro de los Permisos Sudo Mal Configurados</h2>
<div style="background:rgba(120,53,15,0.2);border:1px solid rgba(180,83,9,0.6);padding:1rem;border-radius:8px;margin:1rem 0;color:#cbd5e1;line-height:1.7">
  Los administradores a veces permiten por error que usuarios de bajo privilegio ejecuten utilidades del sistema (como <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#f59e0b;font-size:0.875rem">find</code>, <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#f59e0b;font-size:0.875rem">less</code>, o <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#f59e0b;font-size:0.875rem">awk</code>) como <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#ef4444;font-size:0.875rem">sudo</code>. Los atacantes abusan estos binarios para escapar de su entorno restringido y generar un shell root (una tecnica documentada en <strong style="color:#fff">GTFOBins</strong>).
</div>

<hr style="border:none;border-top:1px solid #1e293b;margin:1.5rem 0" />

<h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem">Reto Practico: Rompiendo las Restricciones de Sudo</h2>
<div style="background:rgba(6,78,59,0.2);border:1px solid rgba(5,150,105,0.6);padding:1rem;border-radius:8px;margin:1rem 0">
  <p style="color:#6ee7b7;line-height:1.7;margin:0 0 0.75rem 0"><strong>Objetivo:</strong> Te encuentras dentro de la maquina objetivo a traves de la reverse shell del modulo anterior. Tu usuario actual no tiene permisos globales, pero el administrador del sistema cometio un error grave en la configuracion del archivo sudoers.</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem">1. Asegurate de estar dentro de la shell comprometida y ejecuta <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">whoami</code> para verificar tu identidad.</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem">2. Ejecuta <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">sudo -l</code> para descubrir que comando binario del sistema tienes permitido ejecutar como root.</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0 0 0.5rem 0;font-size:0.875rem">3. Utiliza ese binario para romper la restriccion (Ejemplo: si tienes permitido usar <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">find</code>, investiga como ejecutar comandos a traves de el).</p>
  <p style="color:#94a3b8;line-height:1.7;margin:0;font-size:0.875rem">4. Al convertirte en root, tu prompt cambiara a <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#ef4444;font-size:0.875rem">root@target:#</code>. Ejecuta <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7ee787;font-size:0.875rem">cat /root/proof.txt</code> para obtener la flag de administrador.</p>
</div>
<p style="color:#cbd5e1;line-height:1.7;margin-top:1rem">Usa la terminal de la derecha para completar el reto.</p>
`;
