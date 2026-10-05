import { storefrontConfig } from "@/lib/storefront-config";
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
  title: `${storefrontConfig.companyName} | Electronics, Mobiles & Gadgets`,
  description:
    "Shop electronics, smartphones, headphones, laptops, gaming accessories and home appliances at TECH AI. Compare prices, read customer reviews and track your orders.",
  keywords: [storefrontConfig.companyName, "electronics store", "smartphones", "headphones", "laptops", "gaming accessories", "home appliances", "gadgets India"],
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
