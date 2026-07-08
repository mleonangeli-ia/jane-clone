import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JaneClone — Turnos online",
  description: "Agenda, clientes y pagos para profesionales de la salud.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JaneClone",
  },
  formatDetection: { telephone: false },
  icons: {
    icon:    "/icon-192.svg",
    apple:   "/icon-192.svg",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,       // prevent accidental zoom on form inputs
  userScalable: false,
  themeColor: "#2563eb",
  viewportFit: "cover",  // respect notch / dynamic island
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${inter.variable}`}>
      <head>
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JaneClone" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        {/* Splash screen color for iOS */}
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="h-full antialiased" style={{ backgroundColor: "var(--bg)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
