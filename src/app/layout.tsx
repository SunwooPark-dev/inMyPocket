import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Outfit, Space_Mono } from "next/font/google";

import "./globals.css";

const bodyFont = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap"
});

const headingFont = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap"
});

const monoFont = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "inMyPoket",
  description: "Senior-friendly grocery basket comparison MVP for North Atlanta pilot ZIP clusters."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable}`}>{children}</body>
    </html>
  );
}
