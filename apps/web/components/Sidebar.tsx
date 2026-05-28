'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import type { LessonNode } from '@cyber-edu/types';

interface SidebarProps {
  roadmapData: LessonNode[];
  onNodeSelect?: (node: LessonNode) => void;
}

interface TreeNodeProps {
  node: LessonNode;
  level: number;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (node: LessonNode) => void;
  completedLessons: string[];
  searchQuery: string;
}

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes(' ')) {
    return lowerQuery.split(' ').every((word) => lowerText.includes(word));
  }
  let qi = 0;
  for (let i = 0; i < lowerText.length && qi < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

function nodeMatchesSearch(node: LessonNode, query: string): boolean {
  if (!query) return true;
  if (fuzzyMatch(node.title, query) || fuzzyMatch(node.description, query)) return true;
  if (node.children) return node.children.some((c) => nodeMatchesSearch(c, query));
  return false;
}

function TreeNode({ node, level, isExpanded, onToggle, onSelect, completedLessons, searchQuery }: TreeNodeProps) {
  const isCompleted = completedLessons.includes(node.id);
  const isLocked = node.status === 'locked';
  const hasChildren = node.children && node.children.length > 0;
  const matchesSearch = nodeMatchesSearch(node, searchQuery);

  const shouldExpand = useMemo(() => {
    if (!searchQuery) return isExpanded;
    return nodeMatchesSearch(node, searchQuery);
  }, [searchQuery, node, isExpanded]);

  if (!matchesSearch && searchQuery && !hasChildren) return null;

  return (
    <div className="select-none">
      <div
        role="treeitem"
        tabIndex={0}
        onClick={() => { if (hasChildren) onToggle(node.id); else if (!isLocked) onSelect(node); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (hasChildren) onToggle(node.id); else if (!isLocked) onSelect(node);
          }
        }}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-inset"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {hasChildren ? (
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${shouldExpand ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : <span className="w-4" />}

        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isCompleted ? 'bg-green-500' : node.status === 'available' ? 'bg-blue-500' : 'bg-slate-600'}`} />

        <span className="flex-1 text-sm font-medium text-slate-200 truncate">{node.title}</span>

        {node.type === 'boss' && <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded border border-red-700">BOSS</span>}
        {node.type === 'challenge' && <span className="text-xs px-2 py-0.5 bg-orange-900/50 text-orange-300 rounded border border-orange-700">CTF</span>}
      </div>

      {hasChildren && shouldExpand && (
        <div role="group">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} isExpanded={useUIStore.getState().expandedNodes.includes(child.id)} onToggle={onToggle} onSelect={onSelect} completedLessons={completedLessons} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementsPreview() {
  const { achievements } = useUIStore();
  const names: Record<string, string> = { 'first-blood': 'Primera Sangre', 'crypto-master': 'Maestro Cripto', 'speed-demon': 'Demonio Veloz', 'no-hints': 'Sin Ayudas', 'perfect-score': 'Puntaje Perfecto' };
  if (achievements.length === 0) return <p className="text-xs text-slate-500 italic">Completa desafíos para desbloquear logros</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {achievements.slice(0, 5).map((id) => (
        <span key={id} className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded border border-yellow-700/50" title={names[id] || id}>
          {names[id] || id}
        </span>
      ))}
      {achievements.length > 5 && <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">+{achievements.length - 5} más</span>}
    </div>
  );
}

export function Sidebar({ roadmapData, onNodeSelect }: SidebarProps) {
  const { expandedNodes, toggleNode, searchQuery, setSearchQuery, completedLessons } = useUIStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.ctrlKey && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const totalLessons = useMemo(() => {
    const count = (nodes: LessonNode[]): number => nodes.reduce((a, n) => a + (n.type === 'lesson' ? 1 : 0) + (n.children ? count(n.children) : 0), 0);
    return count(roadmapData);
  }, [roadmapData]);

  const pct = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

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

        {/* ── SEARCH INPUT ── */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Icon: fixed 20x20 via HTML attrs + Tailwind, absolutely positioned */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              minWidth: '20px',
              minHeight: '20px',
              maxWidth: '20px',
              maxHeight: '20px',
              color: '#94a3b8',
              pointerEvents: 'none',
              display: 'block',
              flexShrink: 0,
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar leccion... (Ctrl+K)"
            aria-label="Buscar lecciones"
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '14px',
              lineHeight: '20px',
            }}
            className="bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      {/* Tree */}
      <div ref={treeRef} role="tree" aria-label="Arbol de lecciones" className="flex-1 overflow-y-auto min-h-0 py-2">
        {roadmapData.map((node) => (
          <TreeNode key={node.id} node={node} level={0} isExpanded={expandedNodes.includes(node.id)} onToggle={toggleNode} onSelect={(n) => { if (n.status !== 'locked' && onNodeSelect) onNodeSelect(n); }} completedLessons={completedLessons} searchQuery={searchQuery} />
        ))}
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
