import type { Metadata } from "next";
import "./globals.css";
import { OnboardingTour } from "../components/Onboarding/OnboardingTour";
import { ToastContainer } from "../components/Achievements/ToastContainer";
import { PWAInstallPrompt } from "../components/PWA/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "CyberEdu - Zero-Trust Academy",
  description: "Plataforma educativa de ciberseguridad",
  manifest: "/manifest.json",
  themeColor: "#0a0f1d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#0a0f1d] text-slate-100" style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0f1d', display: 'flex', flexDirection: 'row' }}>
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'row', background: '#0a0f1d' }}>
          {children}
        </div>
        <OnboardingTour />
        <ToastContainer />
        <PWAInstallPrompt />
        <div id="sr-announcer" className="sr-only" aria-live="assertive" aria-atomic="true" />
      </body>
    </html>
  );
}
