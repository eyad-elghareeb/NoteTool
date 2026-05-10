import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeSync } from "@/components/notetool/ThemeSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoteTool — SurgicalBrain Medical Synthesis Engine",
  description: "The Universal Medical Synthesis Engine. Dissect. Map. Act. Connect.",
  keywords: ["NoteTool", "SurgicalBrain", "Medical Education", "Active Recall", "Clinical Algorithms"],
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
        <ThemeSync />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
