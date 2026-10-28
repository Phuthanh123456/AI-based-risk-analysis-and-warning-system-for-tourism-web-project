// Current administrative directory. Historical datasets keep their original names.
export const ADMIN_SOURCE = "https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-202-2025-qh15-ve-sap-xep-don-vi-hanh-chinh-cap-tinh-119250612174148722.htm";
export const HUE_SOURCE = "https://baochinhphu.vn/thanh-lap-thanh-pho-hue-truc-thuoc-trung-uong-102241205150328922.htm";
export const normalize = (text = "") => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

const rows = [
  ["ha-noi", "Hà Nội", "Bắc Bộ", ["Hà Nội"], "Phố cổ, những hồ nước và các lớp di sản tạo nên một thủ đô nhiều nhịp sống."],
  ["cao-bang", "Cao Bằng", "Bắc Bộ", ["Cao Bằng"], "Theo dòng Quây Sơn qua miền núi đá, thác nước và những địa danh lịch sử vùng biên."],
  ["lai-chau", "Lai Châu", "Bắc Bộ", ["Lai Châu"], "Khám phá bản làng vùng cao, những thung lũng và cảnh quan núi rừng Tây Bắc."],
  ["lang-son", "Lạng Sơn", "Bắc Bộ", ["Lạng Sơn"], "Miền biên ải với danh thắng núi đá, chùa hang và văn hóa Tày, Nùng."],
  ["dien-bien", "Điện Biên", "Bắc Bộ", ["Điện Biên"], "Tìm hiểu lịch sử tại lòng chảo Điện Biên và dành thời gian cho cảnh quan hồ, núi."],
  ["son-la", "Sơn La", "Bắc Bộ", ["Sơn La"], "Cao nguyên Mộc Châu và những dãy núi Tà Xùa mở ra nhiều hành trình ngoài trời."],
  ["tuyen-quang", "Tuyên Quang", "Bắc Bộ", ["Tuyên Quang", "Hà Giang"], "Từ vùng di tích Tân Trào đến cao nguyên đá Đồng Văn, mỗi chặng là một câu chuyện khác."],
  ["lao-cai", "Lào Cai", "Bắc Bộ", ["Lào Cai", "Yên Bái"], "Sa Pa và ruộng bậc thang Mù Cang Chải cùng góp vào bức tranh vùng núi phía Bắc."],
  ["thai-nguyen", "Thái Nguyên", "Bắc Bộ", ["Thái Nguyên", "Bắc Kạn"], "Kết nối miền chè trung du với hồ Ba Bể và những bản làng bên núi đá."],
  ["phu-tho", "Phú Thọ", "Bắc Bộ", ["Phú Thọ", "Vĩnh Phúc", "Hòa Bình"], "Một hành trình từ Đền Hùng đến Tam Đảo và thung lũng Mai Châu."],
  ["bac-ninh", "Bắc Ninh", "Bắc Bộ", ["Bắc Ninh", "Bắc Giang"], "Không gian Kinh Bắc với chùa cổ, tranh dân gian và những làn điệu quan họ."],
  ["hai-phong", "Hải Phòng", "Bắc Bộ", ["Hải Phòng", "Hải Dương"], "Đô thị cảng, quần đảo Cát Bà và vùng di sản Côn Sơn cùng trong một địa phương."],
  ["hung-yen", "Hưng Yên", "Bắc Bộ", ["Hưng Yên", "Thái Bình"], "Tìm dấu thương cảng Phố Hiến và khám phá kiến trúc gỗ của chùa Keo."],
  ["ninh-binh", "Ninh Bình", "Bắc Bộ", ["Ninh Bình", "Hà Nam", "Nam Định"], "Danh thắng Tràng An nối với những không gian tín ngưỡng của Hà Nam và Nam Định trước đây."],
  ["quang-ninh", "Quảng Ninh", "Bắc Bộ", ["Quảng Ninh"], "Từ vịnh Hạ Long đến non thiêng Yên Tử, kết hợp trải nghiệm biển và di sản."],
  ["thanh-hoa", "Thanh Hóa", "Trung Bộ & Tây Nguyên", ["Thanh Hóa"], "Thành đá cổ và cảnh quan Pù Luông gợi mở một xứ Thanh giàu tương phản."],
  ["nghe-an", "Nghệ An", "Trung Bộ & Tây Nguyên", ["Nghệ An"], "Từ làng Sen đến những cánh rừng Pù Mát, khám phá chiều sâu văn hóa xứ Nghệ."],
  ["ha-tinh", "Hà Tĩnh", "Trung Bộ & Tây Nguyên", ["Hà Tĩnh"], "Biển Thiên Cầm và địa danh Đồng Lộc là hai lát cắt thiên nhiên, lịch sử của Hà Tĩnh."],
  ["hue", "Huế", "Trung Bộ & Tây Nguyên", ["Thừa Thiên Huế"], "Kinh thành, chùa cổ, âm nhạc và ẩm thực góp nên một không gian cố đô đặc sắc."],
  ["quang-tri", "Quảng Trị", "Trung Bộ & Tây Nguyên", ["Quảng Trị", "Quảng Bình"], "Kết nối ký ức lịch sử bên sông Thạch Hãn với thế giới hang động Phong Nha."],
  ["da-nang", "Đà Nẵng", "Trung Bộ & Tây Nguyên", ["Đà Nẵng", "Quảng Nam"], "Đô thị bên biển, Hội An và Mỹ Sơn mở rộng hành trình văn hóa miền Trung."],
  ["quang-ngai", "Quảng Ngãi", "Trung Bộ & Tây Nguyên", ["Quảng Ngãi", "Kon Tum"], "Từ đảo Lý Sơn đến rừng thông Măng Đen, trải nghiệm một địa phương từ biển lên cao nguyên."],
  ["gia-lai", "Gia Lai", "Trung Bộ & Tây Nguyên", ["Gia Lai", "Bình Định"], "Biển Hồ cao nguyên và miền duyên hải Quy Nhơn mang lại hai sắc thái khám phá."],
  ["khanh-hoa", "Khánh Hòa", "Trung Bộ & Tây Nguyên", ["Khánh Hòa", "Ninh Thuận"], "Di sản Chăm, vịnh biển và cảnh quan khô hạn Núi Chúa tạo nên một dải trải nghiệm đa dạng."],
  ["lam-dong", "Lâm Đồng", "Trung Bộ & Tây Nguyên", ["Lâm Đồng", "Đắk Nông", "Bình Thuận"], "Từ phố núi Đà Lạt, hồ Tà Đùng đến miền biển Mũi Né trong cùng địa giới hiện hành."],
  ["dak-lak", "Đắk Lắk", "Trung Bộ & Tây Nguyên", ["Đắk Lắk", "Phú Yên"], "Hồ Lắk và Gành Đá Đĩa kết nối cảnh quan cao nguyên với duyên hải."],
  ["ho-chi-minh", "TP. Hồ Chí Minh", "Nam Bộ", ["TP Hồ Chí Minh", "Bình Dương", "Bà Rịa - Vũng Tàu"], "Nhịp sống Sài Gòn, làng nghề Bình Dương và biển đảo Vũng Tàu, Côn Đảo trong một hành trình rộng mở."],
  ["dong-nai", "Đồng Nai", "Nam Bộ", ["Đồng Nai", "Bình Phước"], "Những cánh rừng Cát Tiên và Bù Gia Mập là điểm nhấn cho hành trình gần gũi thiên nhiên."],
  ["tay-ninh", "Tây Ninh", "Nam Bộ", ["Tây Ninh", "Long An"], "Núi Bà Đen và vùng đất ngập nước Tân Lập gợi ý những chuyến đi từ đô thị về thiên nhiên."],
  ["can-tho", "Cần Thơ", "Nam Bộ", ["Cần Thơ", "Hậu Giang", "Sóc Trăng"], "Chợ nổi, đất ngập nước và kiến trúc Khmer cùng kể chuyện miền hạ lưu sông Mekong."],
  ["vinh-long", "Vĩnh Long", "Nam Bộ", ["Vĩnh Long", "Bến Tre", "Trà Vinh"], "Miệt vườn, xứ dừa và những ngôi chùa Khmer làm nên hành trình văn hóa sông nước."],
  ["dong-thap", "Đồng Tháp", "Nam Bộ", ["Đồng Tháp", "Tiền Giang"], "Khám phá đất ngập nước Tràm Chim và vùng Mỹ Tho với kiến trúc chùa Vĩnh Tràng."],
  ["ca-mau", "Cà Mau", "Nam Bộ", ["Cà Mau", "Bạc Liêu"], "Rừng tràm U Minh Hạ và câu chuyện nhà Công tử Bạc Liêu nối hai miền đất cực Nam."],
  ["an-giang", "An Giang", "Nam Bộ", ["An Giang", "Kiên Giang"], "Từ rừng tràm Trà Sư đến đảo Phú Quốc, trải nghiệm đất liền và biển Tây."],
];
export const provinces = rows.map(([id, name, region, former, intro]) => ({ id, name, region, former, intro, city: ["ha-noi", "hue", "hai-phong", "da-nang", "ho-chi-minh", "can-tho"].includes(id) }));
export const provinceById = Object.fromEntries(provinces.map((p) => [p.id, p]));
export function matchesProvince(province, query) {
  const compact = (name) => normalize(name).replace(/[^a-z0-9]/g, "");
  const key = compact(query);
  const aliases = province.id === "ho-chi-minh" ? ["HCM", "TPHCM", "Sài Gòn", "Saigon"] : province.id === "ha-noi" ? ["Hanoi"] : [];
  return [province.name, ...province.former, ...aliases].some((name) => compact(name).includes(key));
}

// One existing reference point per current province. These are not new borders
// or newly surveyed administrative centres. Retain the old-area key for risk API queries.
export function currentProvincePoints(points) {
  return provinces.flatMap((province) => {
    const point = province.former.map((name) => points.find((item) => normalize(item.province) === normalize(name))).find(Boolean);
    return point ? [{ ...point, province: province.name, dataProvince: point.province, currentId: province.id, former: province.former }] : [];
  });
}
