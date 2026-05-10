'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { useNoteToolStore } from "@/stores/notetool-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function ThemeSync() {
  const settings = useNoteToolStore((s) => s.settings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isDark = settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme, mounted]);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NoteTool — SurgicalBrain Medical Synthesis Engine</title>
        <meta name="description" content="The Universal Medical Synthesis Engine. Dissect. Map. Act. Connect." />
        <meta name="keywords" content="NoteTool, SurgicalBrain, Medical Education, Active Recall, Clinical Algorithms" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeSync />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
