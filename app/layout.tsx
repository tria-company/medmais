import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/layout/SidebarNav";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard MedMais",
  description: "Dashboard MedMais - Área de controle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${urbanist.variable} font-sans antialiased bg-slate-50 text-slate-900`}
        style={{
          fontFamily:
            "var(--font-urbanist), ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div className="flex min-h-screen">
          <aside className="group hidden w-16 flex-shrink-0 border-r border-slate-200 bg-white px-3 py-5 text-slate-700 shadow-[0_0_0_1px_rgba(15,23,42,0.02)] transition-[width] duration-200 md:flex md:flex-col md:hover:w-56">
            <div className="flex items-center justify-center px-1">
              <img
                src="/logo.png"
                alt="MedMais"
                className="h-10 w-auto object-contain"
              />
            </div>

            <SidebarNav />
          </aside>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
