import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import ChatAssistant from "@/components/ChatAssistant"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Certifications Commanders Act",
  description: "Plateforme moderne de gestion des sessions de certification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/CommandersAct_Hor_onLight@3x.svg"
                  alt="Commanders Act"
                  width={180}
                  height={36}
                  className="h-8 w-auto"
                />
              </Link>
            </div>
          </div>
        </header>

        <main className="min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-100/50 dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600 dark:text-slate-400">
            © 2025 • Commanders Act - Plateforme de certification
          </div>
        </footer>

 {/* Assistant flottant toujours présent */}
        <ChatAssistant />

      </body>
    </html>
  );
}
