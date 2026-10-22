export type TehranDistrict = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const TEHRAN_DISTRICTS: readonly TehranDistrict[] = [
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
