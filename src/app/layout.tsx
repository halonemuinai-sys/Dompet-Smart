import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppStateProvider } from "@/hooks/useAppState";
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
  title: "Smart Wallet - Personal Finance",
  description: "Aplikasi keuangan pribadi modern yang melacak pengeluaran, anggaran, portofolio, dan langganan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50/50">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
