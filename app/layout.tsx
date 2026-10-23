import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthListener } from "@/components/auth/auth-listener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "3D Druck Tagebuch",
  description:
    "Dein persönlicher Begleiter für alle 3D-Druck Projekte – Dokumentiere, verwalte und optimiere deine Drucke.",
  icons: {
    icon: "/logo.png",
  },
  authors: [{ name: "Davide Chiffi" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors theme="dark" />
        <AuthListener />
        <Analytics />
      </body>
    </html>
  );
}
