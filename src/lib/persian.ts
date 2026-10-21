const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const ASCII_DIGITS = "0123456789";

const LETTER_MAP: Record<string, string> = {
  ي: "ی",
  ى: "ی",
  ك: "ک",
  ة: "ه",
  أ: "ا",
  إ: "ا",
  آ: "ا",
  ٱ: "ا",
};

const LETTERS_TO_NORMALIZE = /[يىكأةإآٱ]/g;
const DIACRITICS = /[\u064B-\u065F\u0670]/g;
const TATWEEL = /\u0640/g;
const ZERO_WIDTH = /[\u200B\u200C\u200D\u00A0]/g;

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(PERSIAN_DIGITS.indexOf(digit)),
    )
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) =>
    PERSIAN_DIGITS.charAt(ASCII_DIGITS.indexOf(digit)),
  );
}

const persianNumberFormatter = new Intl.NumberFormat("fa-IR");

export function formatPersianNumber(value: number): string {
  return persianNumberFormatter.format(value);
}

export function normalizePersian(input: string): string {
  return input
    .normalize("NFKC")
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(ZERO_WIDTH, " ")
    .replace(LETTERS_TO_NORMALIZE, (letter) => LETTER_MAP[letter] ?? letter)
    .replace(/[۰-۹]/g, (digit) => ASCII_DIGITS.charAt(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => ASCII_DIGITS.charAt(ARABIC_DIGITS.indexOf(digit)))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizePersian(input: string): string[] {
  const normalized = normalizePersian(input);
  return normalized ? normalized.split(" ") : [];
}
