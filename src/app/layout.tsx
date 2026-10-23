import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "ترب‌یار | دستیار خرید حضوری",
  description:
    "دستیار هوشمند خرید حضوری؛ محصول را مقایسه کن، فروشندهٔ نزدیک را پیدا کن و قبل از رفتن، قیمت و موجودی را بپرس.",
  applicationName: "ترب‌یار",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ترب‌یار",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c81e27",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="preload"
          href="/fonts/Vazirmatn-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
