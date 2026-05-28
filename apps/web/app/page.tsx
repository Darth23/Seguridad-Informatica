import type { ComponentType, ReactNode } from "react";
import AppLayout from "@/components/AppLayout";

const AppLayoutWithChildren = AppLayout as ComponentType<{
  sidebarContent: ReactNode;
  terminalContent: ReactNode;
  roadmapData: any[];
  children: ReactNode;
}>;

export default function Home() {
  return (
    <AppLayoutWithChildren
      sidebarContent={<div>Sidebar placeholder</div>}
      terminalContent={<div>Terminal placeholder</div>}
      roadmapData={[]}
    >
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">CyberEdu Academy</h1>
        <p className="mt-4 text-gray-400">Plataforma de ciberseguridad en desarrollo...</p>
      </main>
    </AppLayoutWithChildren>
  );
}
