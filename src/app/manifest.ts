import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ترب‌یار | دستیار خرید حضوری",
    short_name: "ترب‌یار",
    description:
      "قبل از رفتن، فروشگاه درست را پیدا کن؛ قیمت، ساعت کاری، موجودی تأییدشده و مسیر.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1f5f9",
    theme_color: "#c81e27",
    lang: "fa",
    dir: "rtl",
    categories: ["shopping", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
