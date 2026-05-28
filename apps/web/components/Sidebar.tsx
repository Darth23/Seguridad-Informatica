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
  { id: '0.3', title: 'Modulo 0.3: Escaneo Sigiloso', icon: '🕵️', type: 'lesson' as const },
  { id: '0.4', title: 'Modulo 0.4: Banner Grabbing', icon: '🔍', type: 'lesson' as const },
  { id: '0.5', title: 'Modulo 0.5: Reverse Shells', icon: '💥', type: 'lesson' as const },
  { id: '0.6', title: 'Modulo 0.6: PrivEsc', icon: '👑', type: 'lesson' as const },
];

function AchievementsPreview() {
  const { achievements } = useUIStore();
  const names: Record<string, string> = {
    'first-blood': 'Primera Sangre',
    'crypto-master': 'Maestro Cripto',
    'speed-demon': 'Demonio Veloz',
    'no-hints': 'Sin Ayudas',
    'perfect-score': 'Puntaje Perfecto',
  };
  if (achievements.length === 0) {
    return <p className="text-xs text-slate-500 italic">Completa desafios para desbloquear logros</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {achievements.slice(0, 5).map((id) => (
        <span
          key={id}
          className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded border border-yellow-700/50"
          title={names[id] || id}
        >
          {names[id] || id}
        </span>
      ))}
      {achievements.length > 5 && (
        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
          +{achievements.length - 5} mas
        </span>
      )}
    </div>
  );
}

export function Sidebar({ roadmapData: _roadmapData, onNodeSelect: _onNodeSelect }: SidebarProps) {
  const { searchQuery, setSearchQuery, completedLessons, activeLesson, setActiveLesson } = useUIStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const totalLessons = LESSONS.length;
  const pct = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

  const filtered = LESSONS.filter(
    (l) => !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white mb-3">Roadmap</h2>

        {/* Progress */}
        <div
          className="mb-4"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progreso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {completedLessons.length}/{totalLessons} lecciones
          </p>
        </div>

        {/* ── Search Box ── */}
        <div className="relative w-full px-3 mb-4">
          <span className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 text-sm">
            🔍
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar leccion... (Ctrl+K)"
            aria-label="Buscar lecciones"
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
          />
        </div>
      </div>

      {/* ── Module List ── */}
      <div className="flex-1 overflow-y-auto min-h-0 py-3">
        <div className="px-3 mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Modulos
          </span>
        </div>
        <div className="flex flex-col gap-2 w-full px-2">
          {filtered.map((lesson) => {
            const isActive = activeLesson === lesson.id;
            const isDone = completedLessons.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(lesson.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-950/20 border-emerald-500/80 text-emerald-400 font-medium'
                    : 'border-slate-800/60 bg-slate-900/30 text-slate-300 hover:bg-slate-800/50 hover:border-emerald-500/30'
                }`}
              >
                {/* Icon */}
                <span className="flex-shrink-0 text-lg" aria-hidden="true">
                  {lesson.icon}
                </span>
                {/* Text */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className={`text-sm leading-tight ${
                      isActive ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {lesson.title}
                  </span>
                </div>
                {/* Done check */}
                {isDone && (
                  <svg
                    className="w-4 h-4 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Footer: Achievements ── */}
      <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-900/50">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
          Logros
        </h3>
        <AchievementsPreview />
      </div>
    </div>
  );
}

export default Sidebar;
