// Pure filtering logic, deliberately separate from grid density (a layout
// concern — see GridDensityContext). Turkish-insensitive: folds ş/ı/ç/ğ/ö/ü
// to their ASCII equivalents after a Turkish-aware lowercase, so "sehir"
// matches "Şehir" and "Insanlar" matches "İnsanlar".
const TURKISH_ASCII_MAP: Record<string, string> = {
  ş: 's',
  ı: 'i',
  ç: 'c',
  ğ: 'g',
  ö: 'o',
  ü: 'u',
};

export function normalizeForSearch(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/[şığöüç]/g, (ch) => TURKISH_ASCII_MAP[ch] ?? ch);
}

export function matchesSearch(name: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return normalizeForSearch(name).includes(normalizeForSearch(trimmed));
}
