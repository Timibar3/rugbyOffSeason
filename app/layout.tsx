import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { MockAuthProvider } from "@/context/MockAuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Rugby Performance | Gestión de Pretemporada",
  description: "Plataforma de gestión de entrenamiento y métricas para planteles de rugby",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <MockAuthProvider>{children}</MockAuthProvider>
      </body>
    </html>
  );
}
