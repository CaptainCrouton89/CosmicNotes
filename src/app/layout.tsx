import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWAMeta } from "@/components/pwa-meta";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cosmic Notes",
  description: "A simple note-taking application",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <PWAMeta />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <SidebarProvider>
            <div className="flex min-h-screen flex-1 ">
              <AppSidebar />
              <div className="flex flex-col flex-1 h-screen">
                <header className="border-b pl-3">
                  <div className="container flex h-14 items-center">
                    <SidebarTrigger />
                    <div className="font-semibold ml-2">Cosmic Notes</div>
                  </div>
                </header>
                <main className="flex-1 overflow-auto min-h-0">
                  <div className="container py-6 px-4 lg:px-10 h-full flex flex-col">
                    {children}
                  </div>
                </main>
              </div>
            </div>
            <PWAInstallPrompt />
          </SidebarProvider>
        </Providers>
        <Script src="/sw-register.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
