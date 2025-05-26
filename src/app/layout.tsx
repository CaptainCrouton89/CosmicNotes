import { Providers } from "@/components/providers";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWAMeta } from "@/components/pwa-meta";
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
          {children}
          <PWAInstallPrompt />
        </Providers>
        <Script src="/sw-register.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
