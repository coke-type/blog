import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
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
  title: "~/blog",
  description: "个人博客，记录日常",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-200 flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800/40 py-6 text-center text-xs text-zinc-600">
          Built with Next.js + MDX &middot; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
