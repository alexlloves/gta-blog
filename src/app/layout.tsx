import type { Metadata, Viewport } from "next";
import { Geist, Unbounded } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const display = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["600", "800"] });

export const metadata: Metadata = {
  title: {
    default: "GTA VI Community · Preguntas y respuestas sobre GTA 6",
    template: "%s · GTA VI Community",
  },
  description: "Pregunta y responde todo sobre Grand Theft Auto VI.",
};

export const viewport: Viewport = {
  themeColor: "#07050d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders>
          <Header />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 sm:px-6">{children}</main>
          <footer className="border-t border-line/60 py-6 text-center text-xs text-muted">
            GTA VI Community · Comunidad no oficial de fans. No afiliada a Rockstar Games.
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
