"use client";

import dynamic from "next/dynamic";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Sidebar } from "./Sidebar";
import { MarkdownReader } from "./MarkdownReader";

const XtermWorkspace = dynamic(() => import("./XtermWorkspace").then(m => m.XtermWorkspace), { ssr: false });

export default function AppLayout() {
  const roadmapData: any = [];
  return (
    <div className="h-screen w-screen bg-[#0d1117] text-[#e6edf3] overflow-hidden font-mono">
      <PanelGroup direction="horizontal">
        
        {/* PANEL IZQUIERDO: Sidebar */}
        <Panel defaultSize={20} minSize={15} maxSize={30} data-tour="sidebar">
          <Sidebar roadmapData={roadmapData} />
        </Panel>

        <PanelResizeHandle className="w-2 bg-[#161b22] hover:bg-[#10b981] transition-colors cursor-col-resize" />

        {/* PANEL DERECHO: Contenido + Terminal */}
        <Panel defaultSize={80}>
          <PanelGroup direction="vertical">
            
            {/* CONTENIDO CENTRAL */}
            <Panel defaultSize={60} minSize={20} data-tour="content">
              <MarkdownReader content="" />
            </Panel>

            <PanelResizeHandle className="h-2 bg-[#161b22] hover:bg-[#10b981] transition-colors cursor-row-resize" />

            {/* TERMINAL INFERIOR */}
            <Panel defaultSize={40} minSize={20} data-tour="terminal">
              <XtermWorkspace />
            </Panel>

          </PanelGroup>
        </Panel>

      </PanelGroup>
    </div>
  );
}