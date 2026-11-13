import test from "node:test";
import assert from "node:assert/strict";
import { translateText, translateAddress } from "../src/i18n/translate.js";
import { getLanguage, getLocale, setLanguage } from "../src/i18n/store.js";
import { places } from "../src/tourism/catalog/places.js";
import { provinces, matchesProvince } from "../src/tourism/catalog/provinces.js";
import { localToday } from "../src/portal/tripAssessment.js";

test("both languages preserve canonical input and translate interpolated guidance", () => {
  const text = "Đã chọn: Hồ Hoàn Kiếm";
  assert.equal(translateText(text,"vi"),text);
  assert.equal(translateText(text,"en"),"Selected: Hoan Kiem Lake");
  assert.equal(translateText("Thời tiết tại Hà Nội","en"),"Weather in Hanoi");
  assert.equal(translateText("2 tin trong mẫu, chưa đủ dấu hiệu chấm mức lưu ý","en"),"2 articles in the sample; insufficient signs to assign an attention level");
  assert.equal(translateText(0,"en"),0);
  assert.equal(translateText(null,"en"),null);
  assert.equal(translateText("Tuyên Quang · Hà Giang","en"),"Tuyen Quang · Ha Giang");
  assert.equal(translateText("1.0/10 · Thấp","en"),"1.0/10 · Low");
  assert.equal(translateText("Gồm: Bắc Ninh · Bắc Giang","en"),"Includes: Bac Ninh · Bac Giang");
  assert.equal(translateText("Tiêu đề nêu sự cố có thể bất lợi cho hoạt động du lịch. Bài đã hơn 48 giờ nên giảm mức ưu tiên; chưa rõ ảnh hưởng còn tiếp diễn.","en"),"The headline describes an incident that may affect travel activities. This article is over 48 hours old, so its priority is reduced; ongoing impacts are unclear.");
});

test("every catalog description and split activity has an English translation", () => {
  assert.equal(places.length,90);
  for (const place of places) {
    assert.notEqual(translateText(place.description,"en"),place.description,place.id);
    for (const activity of place.activities) assert.notEqual(translateText(activity,"en"),activity,`${place.id}: ${activity}`);
    if(place.kind === "food") assert.equal(translateText(place.name,"en"),place.name);
  }
  for (const province of provinces) assert.notEqual(translateText(province.intro,"en"),province.intro,province.id);
  assert.equal(translateText("Vịnh Hạ Long","en"),"Ha Long Bay");
  assert.equal(translateText("Đờn ca tài tử","en"),"Đờn ca tài tử");
});

test("English place display and search keep Vietnamese identity and calendar dates", () => {
  assert.equal(translateAddress("Hồ Hoàn Kiếm, Phường Hoàn Kiếm, Thành phố Hà Nội, Việt Nam","en"),"Hoan Kiem Lake, Hoan Kiem Ward, Hanoi City, Vietnam");
  assert.equal(translateAddress("66 Đường Phổ Quang, Thành phố Hồ Chí Minh","en"),"66 Pho Quang Street, Ho Chi Minh City");
  const hcm=provinces.find(p=>p.id === "ho-chi-minh");
  assert.ok(matchesProvince(hcm,"Ho Chi Minh City"));
  assert.equal(hcm.name,"TP. Hồ Chí Minh");
  const today=localToday();
  try {setLanguage("en");assert.equal(getLanguage(),"en");assert.equal(getLocale(),"en-GB");assert.equal(localToday(),today);}
  finally {setLanguage("vi");}
  assert.equal(getLocale(),"vi-VN");
});
