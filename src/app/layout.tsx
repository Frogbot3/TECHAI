import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "TECH AI | Modern Next-Gen E-Commerce",
  description:
    "Explore authentic AI spatial electronics, luxury watches, speed cleats, anti-stress companions, and next-gen gadgets with live tracking and fast delivery at TECH AI.",
  keywords: ["TECH AI", "E-Commerce", "AI Gadgets", "Omega Swatch", "Adidas F50", "Pig Stress Toy", "Smart Electronics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased min-h-screen bg-slate-50 text-slate-900`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
