import english from "./en.json" with { type: "json" };
import overrides from "./overrides.json" with { type: "json" };

const dictionary = { ...english, ...overrides };
const normalise = text => text.replace(/\s+/g, " ").trim();
const folded = new Map(Object.entries(dictionary).map(([vi, en]) => [vi.toLocaleLowerCase("vi"), en]));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = Object.entries(dictionary).filter(([key, en]) => /\{\d+\}/.test(key) && key !== en && key.replace(/\{\d+\}/g, "").trim().length >= 2).sort(([a], [b]) => b.length - a.length).map(([vi, en]) => {
  const slots = [];
  const parts = vi.split(/(\{\d+\})/g).map(part => {
    if (/^\{\d+\}$/.test(part)) { slots.push(part.slice(1, -1)); return "(.+?)"; }
    return escape(part);
  });
  return { regex: new RegExp(`^${parts.join("")}$`, "u"), en, slots };
});
const cache = new Map();

export function translateText(value, language = "vi", depth = 0) {
  if (language !== "en" || typeof value !== "string" || !value.trim() || depth > 6) return value;
  if (cache.has(value)) return cache.get(value);
  const text = normalise(value);
  let result = dictionary[text];
  if (result == null && dictionary[text + "."]) result = dictionary[text + "."].replace(/\.$/, "");
  if (result == null) {
    const match = folded.get(text.toLocaleLowerCase("vi"));
    if (match != null) result = text === text.toLocaleUpperCase("vi") ? match.toUpperCase() : match;
  }
  if (result == null && /,\s*(Phường|Xã|Quận|Huyện|Tỉnh|Thành phố|Đường|Phố)\s/iu.test(text)) result = translateAddress(text, language);
  if (result == null) for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match) continue;
    const slots = Object.fromEntries(pattern.slots.map((slot, i) => [slot, translateText(match[i + 1], language, depth + 1)]));
    result = pattern.en.replace(/\{(\d+)\}/g, (_, slot) => slots[slot]);
    break;
  }
  if (result == null) {
    // Joined province names, metric labels and sentences keep their separators.
    for (const separator of [" · ", " → ", ". ", "; ", ", "]) {
      const parts = text.split(separator);
      if (parts.length < 2) continue;
      const translated = parts.map(part => translateText(part, language, depth + 1));
      if (translated.some((part, i) => part !== parts[i])) { result = translated.join(separator); break; }
    }
  }
  result ??= text;
  const output = (value.match(/^\s*/)?.[0] || "") + result + (value.match(/\s*$/)?.[0] || "");
  if (cache.size > 5000) cache.clear();
  cache.set(value, output);
  return output;
}

export function translateAddress(value, language = "vi") {
  if (language !== "en" || typeof value !== "string") return value;
  return value.split(",").map(part => {
    const text = part.trim();
    const exact = translateText(text, language);
    if (exact !== text) return exact;
    const numberedStreet = text.match(/^(\d[\w/-]*\s+)(Đường|Phố)\s+(.+)$/iu);
    if (numberedStreet) return `${numberedStreet[1]}${numberedStreet[3].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")} Street`;
    for (const [vi, en] of [["Thành phố", "City"], ["Tỉnh", "Province"], ["Phường", "Ward"], ["Quận", "District"], ["Huyện", "District"], ["Thị trấn", "Town"], ["Thị xã", "Town"], ["Xã", "Commune"], ["Đường", "Street"], ["Phố", "Street"], ["Khách sạn", "Hotel"]]) {
      if (text.toLocaleLowerCase("vi").startsWith(vi.toLocaleLowerCase("vi") + " ")) {
        const name = text.slice(vi.length + 1);
        const translated = translateText(name, language);
        const properName = translated === name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D") : translated;
        return properName.endsWith(` ${en}`) ? properName : `${properName} ${en}`;
      }
    }
    return text;
  }).join(", ");
}
