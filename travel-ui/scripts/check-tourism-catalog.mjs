import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { provinces, provinceById, matchesProvince, currentProvincePoints } from "../src/tourism/catalog/provinces.js";
import { places } from "../src/tourism/catalog/places.js";

const media = JSON.parse(readFileSync(new URL("../src/tourism/catalog/media.json", import.meta.url), "utf8"));
const categories = new Set(["do-thi", "di-san", "am-thuc", "thien-nhien", "van-hoa"]);
assert.equal(provinces.length, 34);
assert.equal(provinces.filter((province) => province.city).length, 6);
assert.equal(new Set(provinces.map((province) => province.id)).size, 34);
const former = provinces.flatMap((province) => province.former);
assert.equal(former.length, 63);
assert.equal(new Set(former).size, 63, "Each historical province belongs to one current province");
assert.equal(new Set(places.map((place) => place.id)).size, places.length);
for (const province of provinces) {
  const own = places.filter((place) => place.provinceId === province.id);
  assert.ok(own.length >= 2, province.name + " needs at least two guides");
  assert.ok(own.some((place) => media[place.id]), province.name + " needs a licensed area photograph");
}
for (const place of places) {
  assert.ok(provinceById[place.provinceId]?.former.includes(place.former), place.id + " has the wrong historical region");
  assert.ok(categories.has(place.category), place.id + " has an unknown category");
  assert.ok(place.description.length > 100 && place.activities.length >= 2, place.id + " needs useful editorial content");
  assert.ok(place.source.startsWith("https://") && place.sourceLabel, place.id + " needs a source");
}
for (const [id, photo] of Object.entries(media)) {
  assert.ok(places.some((place) => place.id === id), id + " is an orphan image");
  assert.match(photo.license, /^(CC BY(?:-SA)?(?: |$)|CC0|Public domain)/);
  assert.ok(photo.artist && photo.source.startsWith("https://commons.wikimedia.org/wiki/File:"));
  const asset = new URL("../public" + photo.image, import.meta.url);
  assert.ok(existsSync(asset), photo.image + " is missing");
  assert.ok(statSync(asset).size < 100 * 1024 * 1024);
}
for (const [oldName, id] of [["Quang Nam", "da-nang"], ["Binh Duong", "ho-chi-minh"], ["Ha Giang", "tuyen-quang"], ["Thua Thien Hue", "hue"]]) {
  assert.ok(matchesProvince(provinceById[id], oldName), "Legacy search failed: " + oldName);
}
const grouped = currentProvincePoints([
  { province: "TP Hồ Chí Minh", lat: 10.7769, lon: 106.7009 },
  { province: "Bình Dương", lat: 11.3254, lon: 106.477 },
  { province: "Bà Rịa - Vũng Tàu", lat: 10.5417, lon: 107.242 },
  { province: "Bắc Trung Bộ", lat: 18, lon: 105.5 },
]);
assert.equal(grouped.length, 1, "Synthetic areas or duplicate current markers must not appear");
assert.equal(grouped[0].currentId, "ho-chi-minh");
assert.equal(grouped[0].dataProvince, "TP Hồ Chí Minh", "Retain original risk query coverage");
console.log(JSON.stringify({ provinces: provinces.length, cities: 6, historicalProvinces: former.length, guides: places.length, licensedPhotos: Object.keys(media).length, status: "passed" }));
