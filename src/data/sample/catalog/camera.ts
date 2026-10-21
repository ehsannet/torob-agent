import type { CategoryCatalog } from "./types";

export const cameraCategory: CategoryCatalog = {
  key: "camera",
  labelFa: "دوربین",
  prefix: "دوربین",
  priceRange: [20_000_000, 300_000_000],
  brands: [
    {
      brand: "Canon",
      brandFa: "کانن",
      priceFactor: 1,
      models: [
        "EOS R6 Mark II",
        "EOS R8",
        "EOS R50",
        "EOS R7",
        "EOS R5",
        "EOS 90D",
        "EOS M50 Mark II",
      ],
    },
    {
      brand: "Sony",
      brandFa: "سونی",
      priceFactor: 1.15,
      models: [
        "Alpha 7 IV",
        "Alpha 7C II",
        "Alpha 6700",
        "Alpha ZV-E10",
        "Alpha 7R V",
        "Alpha 9 III",
        "ZV-1 II",
      ],
    },
    {
      brand: "Nikon",
      brandFa: "نیکون",
      priceFactor: 1.2,
      models: ["Z6 III", "Z8", "Z5", "Z50", "Zfc", "Z7 II", "Z30"],
    },
    {
      brand: "Fujifilm",
      brandFa: "فوجی‌فیلم",
      priceFactor: 1.05,
      models: ["X-T5", "X-S20", "X100VI", "X-H2", "X-T50", "X-E4", "X-Pro3"],
    },
  ],
  variants: [
    "بدنه",
    "کیت 18-55mm",
    "کیت 18-135mm",
    "کیت 24-70mm",
    "کیت 50mm",
    "کیت 70-200mm",
    "کیت 15-45mm",
    "کیت 16-80mm",
    "کیت 28-70mm",
  ],
  variantSpecKey: "کیت",
  specOptions: {
    "سنسور": ["Full Frame", "APS-C", "Medium Format"],
    "فیلم‌برداری": ["4K 60fps", "4K 30fps", "6K 30fps", "8K 30fps"],
    "مانت": ["Canon RF", "Sony E", "Nikon Z", "Fujifilm X"],
    "نمایشگر": ["LCD چرخان", "LCD ثابت", "OLED چرخان"],
  },
};
