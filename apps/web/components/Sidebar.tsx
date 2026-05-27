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

// Fuzzy search helper
function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes(' ')) {
    return lowerQuery.split(' ').every((word) => lowerText.includes(word));
  }
  
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

// Check if node or any descendant matches search
function nodeMatchesSearch(node: LessonNode, query: string): boolean {
  if (!query) return true;
  
  const titleMatch = fuzzyMatch(node.title, query);
  const descMatch = fuzzyMatch(node.description, query);
  
  if (titleMatch || descMatch) return true;
  
  if (node.children) {
    return node.children.some((child) => nodeMatchesSearch(child, query));
  }
  
  return false;
}

function TreeNode({
  node,
  level,
  isExpanded,
  onToggle,
  onSelect,
  completedLessons,
  searchQuery,
}: TreeNodeProps) {
  const isCompleted = completedLessons.includes(node.id);
  const isLocked = node.status === 'locked';
  const hasChildren = node.children && node.children.length > 0;
  const matchesSearch = nodeMatchesSearch(node, searchQuery);
  
  // Auto-expand if child matches search
  const shouldExpand = useMemo(() => {
    if (!searchQuery) return isExpanded;
    if (nodeMatchesSearch(node, searchQuery)) return true;
    return isExpanded;
  }, [searchQuery, node, isExpanded]);

  if (!matchesSearch && searchQuery && !hasChildren) {
    return null;
  }

  return (
    <div className="select-none">
      <div
        role="treeitem"
        aria-expanded={hasChildren ? shouldExpand : undefined}
        aria-selected={false}
        tabIndex={0}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
          } else if (!isLocked) {
            onSelect(node);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (hasChildren) {
              onToggle(node.id);
            } else if (!isLocked) {
              onSelect(node);
            }
          }
        }}
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}
          ${shouldExpand ? 'bg-gray-800/50' : ''}
          focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-[#161b22]
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              shouldExpand ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="w-4" />
        )}

        {/* Status Icon */}
        <span
          className={`
            w-3 h-3 rounded-full flex-shrink-0
            ${isCompleted ? 'bg-green-500' : ''}
            ${node.status === 'available' && !isCompleted ? 'bg-blue-500' : ''}
            ${isLocked ? 'bg-gray-600' : ''}
          `}
          aria-label={
            isCompleted ? 'Completado' : node.status === 'available' ? 'Disponible' : 'Bloqueado'
          }
        />

        {/* Node Title */}
        <span className="flex-1 text-sm font-medium truncate">{node.title}</span>

        {/* Type Badge */}
        {node.type === 'boss' && (
          <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded border border-red-700">
            BOSS
          </span>
        )}
        {node.type === 'challenge' && (
          <span className="text-xs px-2 py-0.5 bg-orange-900/50 text-orange-300 rounded border border-orange-700">
            CTF
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && shouldExpand && (
        <div role="group">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isExpanded={useUIStore.getState().expandedNodes.includes(child.id)}
              onToggle={onToggle}
              onSelect={onSelect}
              completedLessons={completedLessons}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ roadmapData, onNodeSelect }: SidebarProps) {
  const {
    expandedNodes,
    toggleNode,
    searchQuery,
    setSearchQuery,
    completedLessons,
  } = useUIStore();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut for search focus (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate progress
  const totalLessons = useMemo(() => {
    const countNodes = (nodes: LessonNode[]): number => {
      return nodes.reduce((acc, node) => {
        const self = node.type === 'lesson' ? 1 : 0;
        const children = node.children ? countNodes(node.children) : 0;
        return acc + self + children;
      }, 0);
    };
    return countNodes(roadmapData);
  }, [roadmapData]);

  const progressPercentage = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.length / totalLessons) * 100);
  }, [completedLessons, totalLessons]);

  const handleNodeSelect = (node: LessonNode) => {
    if (node.status !== 'locked' && onNodeSelect) {
      onNodeSelect(node);
    }
  };

  return (
    <aside
      className="h-full flex flex-col"
      role="navigation"
      aria-label="Navegación de lecciones"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white mb-1">Roadmap</h2>
        
        {/* Progress Bar */}
        <div className="mb-3" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progreso Global</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {completedLessons.length} de {totalLessons} lecciones completadas
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lección... (Ctrl+K)"
            className="w-full px-3 py-2 pl-9 bg-gray-800 border border-gray-600 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            aria-label="Buscar lecciones"
          />
          <svg
            className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Tree */}
      <div
        ref={treeRef}
        role="tree"
        aria-label="Árbol de lecciones"
        className="flex-1 overflow-y-auto py-2"
      >
        {roadmapData.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            isExpanded={expandedNodes.includes(node.id)}
            onToggle={toggleNode}
            onSelect={handleNodeSelect}
            completedLessons={completedLessons}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* Footer - Achievements Preview */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/30">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Logros
        </h3>
        <AchievementsPreview />
      </div>
    </aside>
  );
}

function AchievementsPreview() {
  const { achievements } = useUIStore();
  
  const achievementNames: Record<string, string> = {
    'first-blood': 'Primera Sangre',
    'crypto-master': 'Maestro Cripto',
    'speed-demon': 'Demonio Veloz',
    'no-hints': 'Sin Ayudas',
    'perfect-score': 'Puntaje Perfecto',
  };

  if (achievements.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic">
        Completa desafíos para desbloquear logros
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.slice(0, 5).map((id) => (
        <span
          key={id}
          className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded border border-yellow-700/50"
          title={achievementNames[id] || id}
        >
          🏆 {achievementNames[id] || id}
        </span>
      ))}
      {achievements.length > 5 && (
        <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
          +{achievements.length - 5} más
        </span>
      )}
    </div>
  );
}
