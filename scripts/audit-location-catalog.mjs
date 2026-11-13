import { writeFileSync } from "node:fs";
import { places } from "../travel-ui/src/tourism/catalog/places.js";
import { provinces } from "../travel-ui/src/tourism/catalog/provinces.js";
import { translateText } from "../travel-ui/src/i18n/translate.js";

const regions = new Map(provinces.map(p => [p.id, p]));
const ids = new Set();
const constraints = [];
const aliases = {};
for (const province of provinces) aliases[translateText(province.name, "en")] = province.former[0];
for (const place of places) {
  const province = regions.get(place.provinceId);
  if (!province || ids.has(place.id) || !province.former.includes(place.former) || !/^https:\/\//.test(place.source)) {
    throw new Error(`Invalid catalog metadata: ${place.id}`);
  }
  ids.add(place.id);
  if (place.kind === "food") continue;
  aliases[translateText(place.name, "en")] = place.name;
  aliases[translateText(place.wiki, "en")] = place.wiki;
  constraints.push({ names: [...new Set([place.name, place.wiki])], regions: [province.name, ...province.former], source: place.source });
}
writeFileSync(new URL("../configs/search_place_regions.json", import.meta.url), JSON.stringify(constraints, null, 2) + "\n");
writeFileSync(new URL("../configs/search_place_aliases.json", import.meta.url), JSON.stringify(aliases, null, 2) + "\n");
console.log(JSON.stringify({ catalogEntries: places.length, currentProvinces: provinces.length, regionConstraints: constraints.length, checks: "unique ids, current/former province mapping, source link presence; not a field verification of POIs" }));
