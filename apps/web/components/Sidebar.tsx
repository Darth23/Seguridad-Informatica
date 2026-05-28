'use client';

import React, { useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';

interface SidebarProps {
  roadmapData?: unknown[];
  onNodeSelect?: (node: unknown) => void;
}

const LESSONS = [
  { id: '0.1', title: 'Modulo 0.1: Navegacion en la Terminal', icon: '💻', type: 'lesson' as const },
  { id: '0.2', title: 'Modulo 0.2: Redes y Paquetes', icon: '🌐', type: 'lesson' as const },
];

function AchievementsPreview() {
  const { achievements } = useUIStore();
  const names: Record<string, string> = { 'first-blood': 'Primera Sangre', 'crypto-master': 'Maestro Cripto', 'speed-demon': 'Demonio Veloz', 'no-hints': 'Sin Ayudas', 'perfect-score': 'Puntaje Perfecto' };
  if (achievements.length === 0) return <p className="text-xs text-slate-500 italic">Completa desafios para desbloquear logros</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {achievements.slice(0, 5).map((id) => (
        <span key={id} className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded border border-yellow-700/50" title={names[id] || id}>
          {names[id] || id}
        </span>
      ))}
      {achievements.length > 5 && <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">+{achievements.length - 5} mas</span>}
    </div>
  );
}

export function Sidebar({ roadmapData: _roadmapData, onNodeSelect: _onNodeSelect }: SidebarProps) {
  const { searchQuery, setSearchQuery, completedLessons, activeLesson, setActiveLesson } = useUIStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.ctrlKey && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const totalLessons = LESSONS.length;
  const pct = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

  const filtered = LESSONS.filter((l) =>
    !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white mb-2">Roadmap</h2>

        <div className="mb-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progreso</span><span>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-600 to-green-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{completedLessons.length}/{totalLessons} lecciones</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px', color: '#94a3b8', pointerEvents: 'none', display: 'block', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef} type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar leccion... (Ctrl+K)" aria-label="Buscar lecciones"
            style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '14px', lineHeight: '20px' }}
            className="bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        <div className="px-3 mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modulos</span>
        </div>
        {filtered.map((lesson) => {
          const isActive = activeLesson === lesson.id;
          const isDone = completedLessons.includes(lesson.id);
          return (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 border-l-2 border-emerald-400 text-emerald-400'
                  : 'hover:bg-slate-800/50 border-l-2 border-transparent text-slate-300'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{lesson.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {lesson.title}
                </div>
              </div>
              {isDone && (
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-900/50">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Logros</h3>
        <AchievementsPreview />
      </div>
    </div>
  );
}

export default Sidebar;
