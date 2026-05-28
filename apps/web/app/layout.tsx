import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberEdu - Zero-Trust Academy",
  description: "Plataforma educativa de ciberseguridad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
