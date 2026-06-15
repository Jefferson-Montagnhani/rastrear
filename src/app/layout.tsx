import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rastrear — PCM Manutenção",
  description: "Relatórios diários dos caminhões-oficina (projeto Rastrear).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {/* Barra de marca (identidade Raízen) */}
        <header className="bg-brand text-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <span className="text-lg font-bold tracking-tight">Rastrear</span>
            <span className="hidden text-xs text-emerald-100/80 sm:inline">
              PCM · Manutenção Automotiva · Raízen
            </span>
          </div>
          <div className="h-1 bg-lime" />
        </header>
        {children}
      </body>
    </html>
  );
}
