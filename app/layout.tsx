import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "JaneClone - Plataforma de turnos online",
  description: "Gestioná tu agenda, clientes y pagos desde un solo lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-gray-50 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
