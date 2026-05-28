'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/lib/analytics/useAnalytics';
import { useUIStore } from '@/lib/stores/uiStore';

function computeChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function BackupRestore() {
  const { exportData, importData } = useAnalytics();
  const { completedLessons, achievements, highContrast } = useUIStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    try {
      const analyticsData = await exportData();
      const fullBackup = {
        version: 1,
        timestamp: new Date().toISOString(),
        analytics: JSON.parse(analyticsData),
        ui: { completedLessons, achievements, highContrast },
      };
      const json = JSON.stringify(fullBackup, null, 2);
      const checksum = computeChecksum(json);
      const backup = { ...fullBackup, checksum };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyberedu-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('success');
      setMessage('Backup exportado correctamente');
    } catch {
      setStatus('error');
      setMessage('Error al exportar backup');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const backup = JSON.parse(json);

        // Verify checksum
        const { checksum, ...dataWithoutChecksum } = backup;
        const expectedChecksum = computeChecksum(JSON.stringify(dataWithoutChecksum, null, 2));

        if (checksum && checksum !== expectedChecksum) {
          setStatus('error');
          setMessage('Checksum inválido — el archivo está corrupto o fue modificado');
          return;
        }

        // Restore analytics
        if (backup.analytics) {
          await importData(JSON.stringify(backup.analytics));
        }

        // Restore UI state
        if (backup.ui) {
          const store = useUIStore.getState();
          if (backup.ui.completedLessons) {
            useUIStore.setState({ completedLessons: backup.ui.completedLessons });
          }
          if (backup.ui.achievements) {
            useUIStore.setState({ achievements: backup.ui.achievements });
          }
        }

        setStatus('success');
        setMessage('Backup restaurado correctamente');
      } catch {
        setStatus('error');
        setMessage('Error al restaurar backup — archivo inválido');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Backup & Restore</h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          📥 Exportar Backup
        </button>
        <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          📤 Importar Backup
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
      {status !== 'idle' && (
        <p className={`mt-2 text-xs ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default BackupRestore;
