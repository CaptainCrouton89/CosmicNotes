import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cosmic Notes",
  description: "A simple note-taking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <SidebarProvider>
            <div className="flex min-h-screen flex-1 ">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="border-b">
                  <div className="container flex h-14 items-center">
                    <SidebarTrigger />
                    <div className="font-semibold ml-2">Cosmic Notes</div>
                  </div>
                </header>
                <main className="flex-1 overflow-auto">
                  <div className="container py-6 px-10">{children}</div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
