import media from "./media.json";
import { places } from "./places";
import { provinces, provinceById, normalize } from "./provinces";

export { places, provinces, provinceById, normalize };
export { matchesProvince, ADMIN_SOURCE, HUE_SOURCE } from "./provinces";
export const categories = [
  { id: "do-thi", name: "Nhịp sống đô thị & mua sắm", short: "Đô thị", description: "Từ những khu chợ đến phố xá, hồ nước và kiến trúc đô thị. Khám phá cách một vùng đất chuyển động qua đời sống hằng ngày.", cover: "ben-thanh" },
  { id: "di-san", name: "Dấu ấn di sản & lịch sử", short: "Di sản", description: "Đền tháp, kinh thành và những địa danh lịch sử. Đi chậm để hiểu các câu chuyện đã góp phần định hình mỗi vùng đất.", cover: "dinh-doc-lap" },
  { id: "am-thuc", name: "Ẩm thực & hương vị bản địa", short: "Ẩm thực", description: "Khám phá món ăn và sản vật qua nguyên liệu, cách chế biến và văn hóa thưởng thức. Các gợi ý là chủ đề tìm hiểu, không phải danh sách nhà hàng được xếp hạng.", cover: "com-tam" },
  { id: "thien-nhien", name: "Sông nước, biển đảo & thiên nhiên", short: "Thiên nhiên", description: "Từ núi rừng phía Bắc đến vịnh biển và những vùng đất ngập nước. Chọn trải nghiệm phù hợp với điều kiện thực tế và hoạt động đang được phép.", cover: "phu-quoc" },
  { id: "van-hoa", name: "Văn hóa, làng nghề & nghệ thuật", short: "Văn hóa", description: "Gặp những câu chuyện nằm trong nghề thủ công, âm nhạc, kiến trúc và đời sống cộng đồng. Tìm hiểu với sự tôn trọng dành cho chủ thể văn hóa.", cover: "dong-ho" },
];
export const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]));
export const placesForProvince = (id) => places.filter((place) => place.provinceId === id);
export const placePath = (place) => `/explore/${place.provinceId}/${place.id}`;
export function photoFor(place) {
  if (media[place.id]) return { contextual: false, ...media[place.id] };
  const nearby = placesForProvince(place.provinceId).find((candidate) => media[candidate.id]);
  if (nearby) return { ...media[nearby.id], contextual: true, fallback: true };
  return { image: "/images/landing/vietnam-skyline.webp", subject: "Minh họa Việt Nam", contextual: true, illustration: true };
}
export const coverForProvince = (id) => photoFor(placesForProvince(id)[0]);
export function matchesPlace(place, query) {
  const province = provinceById[place.provinceId];
  return normalize([place.name, place.description, place.former, province.name, ...province.former].join(" ")).includes(normalize(query));
}
