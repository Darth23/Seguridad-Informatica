'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/lib/stores/uiStore';
import { useEffect } from 'react';
import { LESSON_0_1, LESSON_0_2, LESSON_0_3, LESSON_0_4, LESSON_0_5 } from './lessons';

const XtermWorkspace = dynamic(
  () => import('./XtermWorkspace').then((m) => m.XtermWorkspace),
  { ssr: false }
);

const LESSONS: Record<string, string> = {
  '0.1': LESSON_0_1,
  '0.2': LESSON_0_2,
  '0.3': LESSON_0_3,
  '0.4': LESSON_0_4,
  '0.5': LESSON_0_5,
};

export default function AppLayout() {
  const { activeLesson, toggleHighContrast, setFocusedPanel } = useUIStore();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        toggleHighContrast();
      }
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setFocusedPanel('sidebar');
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setFocusedPanel('content');
      }
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        setFocusedPanel('terminal');
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [toggleHighContrast, setFocusedPanel]);

  const lessonHtml = LESSONS[activeLesson] || LESSON_0_1;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'row', width: '100vw', height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: '#0a0f1d' }}
      className="flex flex-row w-screen h-screen max-h-screen overflow-hidden bg-[#0a0f1d] text-slate-100 select-none"
    >
      {/* PANEL 1: LEFT SIDEBAR */}
      <aside
        style={{ width: 320, minWidth: 320, maxWidth: 320, height: '100vh', flexShrink: 0, overflow: 'auto', background: '#0e1626' }}
        className="w-80 min-w-[320px] max-w-[320px] h-full bg-[#0e1626] border-r border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto"
        data-tour="sidebar"
      >
        <Sidebar roadmapData={[]} />
      </aside>

      {/* PANEL 2: CENTER CONTENT */}
      <main
        style={{ flex: '1 1 0%', minWidth: 0, height: '100vh', overflow: 'auto', background: '#0a0f1d' }}
        className="flex-1 h-full bg-[#0a0f1d] p-8 overflow-y-auto border-r border-slate-800 flex flex-col"
        data-tour="content"
        id="content-panel"
      >
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lessonHtml }} />
      </main>

      {/* PANEL 3: RIGHT TERMINAL */}
      <section
        style={{ width: 450, minWidth: 400, maxWidth: 500, height: '100vh', flexShrink: 0, overflow: 'hidden', background: '#050814' }}
        className="w-[450px] min-w-[400px] max-w-[500px] h-full bg-[#050814] p-4 flex flex-col gap-4 overflow-hidden"
        data-tour="terminal"
      >
        <div className="border-b border-slate-800 pb-2 flex-shrink-0">
          <span className="text-xs font-mono text-emerald-400 font-bold">CyberEdu Terminal [WASM]</span>
        </div>
        <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }} className="flex-1 w-full min-h-0 overflow-hidden">
          <XtermWorkspace />
        </div>
      </section>
    </div>
  );
}
