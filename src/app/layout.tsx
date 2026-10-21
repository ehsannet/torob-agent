import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ترب‌یار | دستیار خرید حضوری",
  description:
    "دستیار هوشمند خرید حضوری؛ محصول را مقایسه کن، فروشندهٔ نزدیک را پیدا کن و قبل از رفتن، قیمت و موجودی را بپرس.",
  applicationName: "ترب‌یار",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ef4056",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
