'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { useAnalytics, useRecentActivity } from '../../lib/analytics/useAnalytics';

interface DashboardProps {
  days?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function Dashboard({ days = 30 }: DashboardProps): JSX.Element {
  const { userStats, isLoading: statsLoading } = useAnalytics();
  const { activity, isLoading: activityLoading } = useRecentActivity(days);
  const [selectedView, setSelectedView] = React.useState<'overview' | 'activity' | 'skills'>('overview');

  // Preparar datos para el heatmap de actividad diaria
  const activityData = useMemo(() => {
    return activity.map((day) => ({
      date: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      lessons: day.lessonsCompleted,
      flags: day.flagsCaptured,
      timeSpent: Math.round(day.timeSpent / 60), // Convertir a minutos
    }));
  }, [activity]);

  // Preparar datos para distribución de tiempo por lección
  const lessonDistributionData = useMemo(() => {
    if (!userStats?.skillBreakdown) return [];
    
    return Object.entries(userStats.skillBreakdown).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
  }, [userStats?.skillBreakdown]);

  // Preparar datos para radar de habilidades
  const skillRadarData = useMemo(() => {
    if (!userStats?.skillBreakdown) return [];
    
    const skills = Object.entries(userStats.skillBreakdown).slice(0, 6);
    const maxValue = Math.max(...skills.map(([, v]) => v), 1);
    
    return skills.map(([name, value]) => ({
      skill: name,
      value: Math.round((value / maxValue) * 100),
      fullMark: 100,
    }));
  }, [userStats?.skillBreakdown]);

  // Calcular métricas de resumen
  const summaryStats = useMemo(() => {
    const totalLessons = activity.reduce((sum, day) => sum + day.lessonsCompleted, 0);
    const totalFlags = activity.reduce((sum, day) => sum + day.flagsCaptured, 0);
    const totalTime = activity.reduce((sum, day) => sum + day.timeSpent, 0);

    return {
      totalLessons,
      totalFlags,
      totalTime: Math.round(totalTime / 60), // horas
      avgStreak: 0,
    };
  }, [activity]);

  if (statsLoading || activityLoading) {
    return (
      <div 
        className="p-8 bg-gray-900 rounded-lg border border-gray-700"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-6 bg-gray-900 rounded-lg border border-gray-700 shadow-xl"
      role="region"
      aria-label="Dashboard de Analytics"
    >
      {/* Header con navegación */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">📊 Dashboard de Progreso</h2>
        
        <div className="flex gap-2" role="tablist" aria-label="Vistas del dashboard">
          {[
            { id: 'overview', label: 'Resumen', icon: '📈' },
            { id: 'activity', label: 'Actividad', icon: '📅' },
            { id: 'skills', label: 'Habilidades', icon: '🎯' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as typeof selectedView)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              role="tab"
              aria-selected={selectedView === view.id}
              aria-controls={`${view.id}-panel`}
            >
              {view.icon} {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Lecciones Completadas"
          value={summaryStats.totalLessons.toString()}
          icon="📚"
          color="blue"
        />
        <StatCard
          label="Flags Capturadas"
          value={summaryStats.totalFlags.toString()}
          icon="🚩"
          color="green"
        />
        <StatCard
          label="Tiempo Total"
          value={`${summaryStats.totalTime}h`}
          icon="⏱️"
          color="purple"
        />
        <StatCard
          label="Racha Promedio"
          value={summaryStats.avgStreak.toString()}
          icon="🔥"
          color="orange"
        />
      </div>

      {/* Panel de vista seleccionada */}
      <div
        id={`${selectedView}-panel`}
        role="tabpanel"
        aria-labelledby={selectedView}
      >
        {selectedView === 'overview' && (
          <OverviewPanel
            activityData={activityData}
            skillRadarData={skillRadarData}
            userStats={userStats}
          />
        )}

        {selectedView === 'activity' && (
          <ActivityPanel activityData={activityData} />
        )}

        {selectedView === 'skills' && (
          <SkillsPanel
            skillRadarData={skillRadarData}
            lessonDistributionData={lessonDistributionData}
          />
        )}
      </div>

      {/* Export/Import */}
      <ExportImportSection />
    </div>
  );
}

// Componente de tarjeta de estadística
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ label, value, icon, color }: StatCardProps): JSX.Element {
  const colorClasses = {
    blue: 'bg-blue-900/30 border-blue-700 text-blue-400',
    green: 'bg-green-900/30 border-green-700 text-green-400',
    purple: 'bg-purple-900/30 border-purple-700 text-purple-400',
    orange: 'bg-orange-900/30 border-orange-700 text-orange-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

// Panel de Overview
interface OverviewPanelProps {
  activityData: Array<{ date: string; lessons: number; flags: number; timeSpent: number }>;
  skillRadarData: Array<{ skill: string; value: number; fullMark: number }>;
  userStats: {
    totalPlayTime: number;
    totalLessonsCompleted: number;
    totalFlagsCaptured: number;
    currentStreak: number;
    longestStreak: number;
    skillBreakdown: Record<string, number>;
  } | null;
}

function OverviewPanel({ activityData, skillRadarData: _skillRadarData, userStats }: OverviewPanelProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Gráfico de actividad semanal */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Actividad Semanal</h3>
        <div className="h-64" role="img" aria-label="Gráfico de barras mostrando lecciones y flags por día">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="lessons" fill="#3b82f6" name="Lecciones" radius={[4, 4, 0, 0]} />
              <Bar dataKey="flags" fill="#10b981" name="Flags" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <GlobalStat label="Tiempo Total" value={`${Math.round((userStats?.totalPlayTime || 0) / 3600)}h`} />
        <GlobalStat label="Lecciones Totales" value={(userStats?.totalLessonsCompleted || 0).toString()} />
        <GlobalStat label="Flags Totales" value={(userStats?.totalFlagsCaptured || 0).toString()} />
        <GlobalStat label="Racha Actual" value={`${userStats?.currentStreak || 0} días`} />
        <GlobalStat label="Mejor Racha" value={`${userStats?.longestStreak || 0} días`} />
        <GlobalStat label="Habilidades" value={Object.keys(userStats?.skillBreakdown || {}).length.toString()} />
      </div>
    </div>
  );
}

function GlobalStat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="bg-gray-800/30 rounded-lg p-3 text-center">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

// Panel de Actividad
interface ActivityPanelProps {
  activityData: Array<{ date: string; lessons: number; flags: number; timeSpent: number }>;
}

function ActivityPanel({ activityData }: ActivityPanelProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Gráfico de líneas de tiempo */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Tendencia de Actividad</h3>
        <div className="h-64" role="img" aria-label="Gráfico de líneas mostrando tendencia de tiempo invertido">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="timeSpent"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
                name="Tiempo (min)"
              />
              <Line
                type="monotone"
                dataKey="lessons"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                name="Lecciones"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de actividad reciente */}
      <div className="bg-gray-800/50 rounded-lg p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400">Fecha</th>
              <th className="text-center py-2 text-gray-400">Lecciones</th>
              <th className="text-center py-2 text-gray-400">Flags</th>
              <th className="text-center py-2 text-gray-400">Tiempo</th>
              <th className="text-center py-2 text-gray-400">Racha</th>
            </tr>
          </thead>
          <tbody>
            {activityData.slice(-10).reverse().map((row) => (
              <tr key={row.date} className="border-b border-gray-800">
                <td className="py-2 text-white">{row.date}</td>
                <td className="py-2 text-center text-blue-400">{row.lessons}</td>
                <td className="py-2 text-center text-green-400">{row.flags}</td>
                <td className="py-2 text-center text-purple-400">{row.timeSpent}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Panel de Habilidades
interface SkillsPanelProps {
  skillRadarData: Array<{ skill: string; value: number; fullMark: number }>;
  lessonDistributionData: Array<{ name: string; value: number }>;
}

function SkillsPanel({ skillRadarData, lessonDistributionData }: SkillsPanelProps): JSX.Element {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Radar de habilidades */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Distribución de Habilidades</h3>
        <div className="h-64" role="img" aria-label="Gráfico de radar mostrando distribución de habilidades">
          {skillRadarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillRadarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="skill" stroke="#9ca3af" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6b7280" />
                <Radar
                  name="Habilidad"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Sin datos de habilidades disponibles
            </div>
          )}
        </div>
      </div>

      {/* Distribución de tiempo */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Tiempo por Área</h3>
        <div className="h-64" role="img" aria-label="Gráfico circular mostrando distribución de tiempo">
          {lessonDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lessonDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {lessonDistributionData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Sin datos de distribución disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sección de Export/Import
function ExportImportSection(): JSX.Element {
  const { exportData, importData } = useAnalytics();
  const [isExporting, setIsExporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyber-edu-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        await importData(json);
        alert('Datos importados correctamente');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Error al importar datos');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Gestión de Datos</h3>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-busy={isExporting}
        >
          {isExporting ? 'Exportando...' : '📥 Exportar Datos'}
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          📤 Importar Datos
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
          aria-label="Seleccionar archivo JSON para importar"
        />
      </div>
    </div>
  );
}

export default Dashboard;
