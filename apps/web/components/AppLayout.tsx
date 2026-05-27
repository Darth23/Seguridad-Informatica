'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useUIStore } from '@/lib/stores/uiStore';
import { TerminalErrorBoundary } from './TerminalErrorBoundary';
import type { LessonNode } from '@cyber-edu/types';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  terminalContent: React.ReactNode;
  roadmapData: LessonNode[];
}

export function AppLayout({
  children,
  sidebarContent,
  terminalContent,
  roadmapData,
}: AppLayoutProps) {
  const { panelSizes, setPanelSizes, focusedPanel, setFocusedPanel } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts for panel focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+1: Sidebar, Ctrl+2: Content, Ctrl+3: Terminal
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setFocusedPanel('sidebar');
          document.getElementById('sidebar-panel')?.focus();
        } else if (e.key === '2') {
          e.preventDefault();
          setFocusedPanel('content');
          document.getElementById('content-panel')?.focus();
        } else if (e.key === '3') {
          e.preventDefault();
          setFocusedPanel('terminal');
          document.getElementById('terminal-panel')?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFocusedPanel]);

  const handleLayoutChange = useCallback(
    (sizes: number[]) => {
      setPanelSizes(sizes);
    },
    [setPanelSizes]
  );

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-[#0d1117] text-gray-100 overflow-hidden"
      role="application"
      aria-label="CyberEdu Learning Environment"
    >
      {/* Skip Links */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50">
        <a
          href="#sidebar-panel"
          className="px-4 py-2 bg-yellow-500 text-black font-bold rounded mr-2"
        >
          Saltar al Sidebar
        </a>
        <a
          href="#content-panel"
          className="px-4 py-2 bg-yellow-500 text-black font-bold rounded mr-2"
        >
          Saltar al Contenido
        </a>
        <a
          href="#terminal-panel"
          className="px-4 py-2 bg-yellow-500 text-black font-bold rounded"
        >
          Saltar a la Terminal
        </a>
      </div>

      <PanelGroup
        direction="horizontal"
        className="h-full w-full"
        onLayout={handleLayoutChange}
      >
        {/* Left Panel - Sidebar */}
        <Panel
          id="sidebar-panel"
          defaultSize={panelSizes[0]}
          minSize={15}
          maxSize={35}
          tabIndex={0}
          aria-label="Panel de navegación y progreso"
          onFocus={() => setFocusedPanel('sidebar')}
          className={`outline-none ${
            focusedPanel === 'sidebar' ? 'ring-2 ring-yellow-400' : ''
          }`}
        >
          <div className="h-full overflow-y-auto bg-[#161b22] border-r border-gray-700">
            {sidebarContent}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors cursor-col-resize focus:outline-none focus:ring-2 focus:ring-yellow-400" />

        {/* Center Panel - Content */}
        <Panel
          id="content-panel"
          defaultSize={panelSizes[1]}
          minSize={30}
          maxSize={70}
          tabIndex={0}
          aria-label="Panel de contenido principal"
          onFocus={() => setFocusedPanel('content')}
          className={`outline-none ${
            focusedPanel === 'content' ? 'ring-2 ring-yellow-400' : ''
          }`}
        >
          <div className="h-full overflow-y-auto bg-[#0d1117]">
            {children}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors cursor-col-resize focus:outline-none focus:ring-2 focus:ring-yellow-400" />

        {/* Right Panel - Terminal */}
        <Panel
          id="terminal-panel"
          defaultSize={panelSizes[2]}
          minSize={20}
          maxSize={50}
          tabIndex={0}
          aria-label="Panel de terminal interactiva"
          onFocus={() => setFocusedPanel('terminal')}
          className={`outline-none ${
            focusedPanel === 'terminal' ? 'ring-2 ring-yellow-400' : ''
          }`}
        >
          <TerminalErrorBoundary>
            <div className="h-full bg-[#161b22] border-l border-gray-700">
              {terminalContent}
            </div>
          </TerminalErrorBoundary>
        </Panel>
      </PanelGroup>
    </div>
  );
}
