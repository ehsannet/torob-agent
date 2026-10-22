export type TehranDistrict = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const TEHRAN_DISTRICTS: readonly TehranDistrict[] = [
  { slug: "ferdowsi", name: "فردوسی", latitude: 35.693, longitude: 51.4202 },
  { slug: "sheikh-hadi", name: "شیخ هادی", latitude: 35.6946, longitude: 51.4088 },
  { slug: "baharestan", name: "بهارستان", latitude: 35.6918, longitude: 51.4257 },
  { slug: "aseman", name: "آسمان", latitude: 35.7775, longitude: 51.3537 },
  { slug: "bagh-feiz", name: "باغ فیض", latitude: 35.7395, longitude: 51.3156 },
  { slug: "iranshahr", name: "ایرانشهر", latitude: 35.7114, longitude: 51.4216 },
  { slug: "sanai", name: "سنائی", latitude: 35.7192, longitude: 51.4224 },
  { slug: "sohrevardi", name: "سهروردی", latitude: 35.7212, longitude: 51.43 },
  { slug: "jannat-abad-jonoubi", name: "جنت آباد جنوبی", latitude: 35.7382, longitude: 51.3096 },
  { slug: "amjadieh", name: "امجدیه", latitude: 35.7152, longitude: 51.4284 },
  { slug: "azarbaijan", name: "آذربایجان", latitude: 35.6945, longitude: 51.4039 },
  { slug: "ashtiani", name: "آشتیانی", latitude: 35.7148, longitude: 51.5029 },
  { slug: "kianshahr-shomali", name: "کیانشهر شمالی", latitude: 35.6419, longitude: 51.4456 },
  { slug: "bahar", name: "بهار", latitude: 35.7147, longitude: 51.4328 },
  { slug: "vanak", name: "ونک", latitude: 35.7573, longitude: 51.4102 },
  { slug: "saadat-abad", name: "سعادت‌آباد", latitude: 35.78, longitude: 51.375 },
  { slug: "valiasr", name: "ولیعصر", latitude: 35.785, longitude: 51.41 },
  { slug: "tajrish", name: "تجریش", latitude: 35.8, longitude: 51.434 },
  { slug: "niavaran", name: "نیاوران", latitude: 35.815, longitude: 51.47 },
  { slug: "pasdaran", name: "پاسداران", latitude: 35.79, longitude: 51.475 },
  { slug: "resalat", name: "رسالت", latitude: 35.755, longitude: 51.49 },
  { slug: "tehranpars", name: "تهرانپارس", latitude: 35.735, longitude: 51.525 },
  { slug: "mirdamad", name: "میرداماد", latitude: 35.76, longitude: 51.425 },
  { slug: "shahrak-gharb", name: "شهرک غرب", latitude: 35.76, longitude: 51.365 },
  { slug: "ekbatan", name: "اکباتان", latitude: 35.705, longitude: 51.31 },
  { slug: "sadeghieh", name: "صادقیه", latitude: 35.715, longitude: 51.335 },
  { slug: "shariati", name: "شریعتی", latitude: 35.75, longitude: 51.45 },
  { slug: "bazaar", name: "بازار", latitude: 35.675, longitude: 51.42 },
  { slug: "molavi", name: "مولوی", latitude: 35.665, longitude: 51.425 },
  { slug: "yousef-abad", name: "یوسف‌آباد", latitude: 35.735, longitude: 51.405 },
  { slug: "jordan", name: "جردن", latitude: 35.77, longitude: 51.42 },
  { slug: "aghdasieh", name: "اقدسیه", latitude: 35.795, longitude: 51.48 },
  { slug: "seyed-khandan", name: "سیدخندان", latitude: 35.745, longitude: 51.455 },
  { slug: "punak", name: "پونک", latitude: 35.72, longitude: 51.32 },
];

export function getDistrict(slug: string | null): TehranDistrict | null {
  if (!slug) return null;
  return TEHRAN_DISTRICTS.find((district) => district.slug === slug) ?? null;
}
