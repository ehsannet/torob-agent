export const SEED = 20261022;
export const PRODUCTS_PER_CATEGORY = 250;
export const SHOP_COUNT = 300;
export const EXPECTED_OFFERS = 4_000;
export const DAY_MS = 86_400_000;

export type District = { name: string; latitude: number; longitude: number };

export const DISTRICTS: readonly District[] = [
  { name: "ونک", latitude: 35.7573, longitude: 51.4102 },
  { name: "سعادت‌آباد", latitude: 35.78, longitude: 51.375 },
  { name: "ولیعصر", latitude: 35.785, longitude: 51.41 },
  { name: "تجریش", latitude: 35.8, longitude: 51.434 },
  { name: "نیاوران", latitude: 35.815, longitude: 51.47 },
  { name: "پاسداران", latitude: 35.79, longitude: 51.475 },
  { name: "رسالت", latitude: 35.755, longitude: 51.49 },
  { name: "تهرانپارس", latitude: 35.735, longitude: 51.525 },
  { name: "میرداماد", latitude: 35.76, longitude: 51.425 },
  { name: "شهرک غرب", latitude: 35.76, longitude: 51.365 },
  { name: "اکباتان", latitude: 35.705, longitude: 51.31 },
  { name: "صادقیه", latitude: 35.715, longitude: 51.335 },
  { name: "شریعتی", latitude: 35.75, longitude: 51.45 },
  { name: "بازار", latitude: 35.675, longitude: 51.42 },
  { name: "مولوی", latitude: 35.665, longitude: 51.425 },
  { name: "یوسف‌آباد", latitude: 35.735, longitude: 51.405 },
  { name: "جردن", latitude: 35.77, longitude: 51.42 },
  { name: "اقدسیه", latitude: 35.795, longitude: 51.48 },
  { name: "سیدخندان", latitude: 35.745, longitude: 51.455 },
  { name: "پونک", latitude: 35.72, longitude: 51.32 },
];

export const STREETS = [
  "خیابان ولیعصر",
  "خیابان شریعتی",
  "خیابان میرداماد",
  "بلوار کشاورز",
  "خیابان آزادی",
  "خیابان انقلاب",
  "خیابان مطهری",
  "خیابان بهشتی",
  "خیابان پاسداران",
  "بلوار گلستان",
  "خیابان سرو",
  "خیابان نیلوفر",
  "بلوار دانش",
  "خیابان امید",
  "خیابان بهار",
  "بلوار آرامش",
  "خیابان کارگر",
  "خیابان جمهوری",
  "بلوار معلم",
] as const;

export const MALLS = [
  "پاساژ کریستال",
  "مجتمع ونک",
  "گالری مهر",
  "پاساژ آرمان",
  "مرکز خرید اپال",
  "پاساژ پالادیوم",
  "ساختمان آسان",
  "مجتمع سعادت",
  "پاساژ نور",
  "گالری تهران",
  "مجتمع آفتاب",
  "پاساژ ستاره",
  "مرکز خرید الماس",
  "پاساژ پارس",
  "مجتمع کیان",
] as const;

export const NAME_PREFIXES = [
  "آرمان",
  "کریستال",
  "پالادیوم",
  "مهر",
  "نوین",
  "آفتاب",
  "ستاره",
  "الماس",
  "پارس",
  "کیان",
  "رایان",
  "سپهر",
  "آریا",
  "ماهان",
  "البرز",
  "زاگرس",
] as const;

export const NAME_SUFFIXES = [
  "دیجیتال",
  "موبایل",
  "تکنولوژی",
  "گالری",
  "استور",
  "سنتر",
] as const;

export const BUSINESS_TYPES = [
  "فروشگاه حضوری",
  "گالری",
  "هایپرمارکت",
  "مرکز خرید",
] as const;

export const LANDMARKS = [
  "ایستگاه مترو ونک",
  "پارک ملت",
  "بیمارستان میلاد",
  "میدان آرژانتین",
  "بازار تجریش",
  "پارک ساعی",
  "میدان صادقیه",
  "ایستگاه مترو صادقیه",
  "پارک لاله",
  "میدان ونک",
] as const;

export const WARRANTIES = [
  "شرکت سازنده",
  "گارانتی شرکتی",
  "گارانتی فروشگاه",
] as const;

export const SCHEDULES = [
  { open: "09:00", close: "21:00" },
  { open: "09:30", close: "21:30" },
  { open: "10:00", close: "22:00" },
  { open: "10:00", close: "20:30" },
  { open: "11:00", close: "23:00" },
] as const;

export const FLOORS = ["همکف", "اول", "دوم", "سوم"] as const;
