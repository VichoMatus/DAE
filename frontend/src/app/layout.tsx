import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAE - Sistema de Trazabilidad e Inmutabilidad de Activos",
  description: "Plataforma de Control de Custodia y Gestión Financiera de Activos Tecnológicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
