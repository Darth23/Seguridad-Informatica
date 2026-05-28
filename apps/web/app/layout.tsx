import type { Metadata } from "next";
import "./globals.css";
import { OnboardingTour } from "../components/Onboarding/OnboardingTour";
import { ToastContainer } from "../components/Achievements/ToastContainer";
import { PWAInstallPrompt } from "../components/PWA/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "CyberEdu - Zero-Trust Academy",
  description: "Plataforma educativa de ciberseguridad",
  manifest: "/manifest.json",
  themeColor: "#58a6ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <OnboardingTour />
        <ToastContainer />
        <PWAInstallPrompt />
        <div id="sr-announcer" className="sr-only" aria-live="assertive" aria-atomic="true" />
      </body>
    </html>
  );
}
