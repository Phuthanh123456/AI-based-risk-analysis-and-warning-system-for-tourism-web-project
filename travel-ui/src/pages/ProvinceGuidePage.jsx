import { useTranslate } from "../i18n/index.js";import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { provinceById, placesForProvince, categories, coverForProvince } from "../tourism/catalog";
import { AdministrationNote, CategoryFilters, GuideBreadcrumb, GuideCard, GuideHero, PhotoCredit } from "../tourism/ExploreComponents";

export default function ProvinceGuidePage({ onSelect }) {const translate = useTranslate();
  const { provinceId } = useParams();
  const province = provinceById[provinceId];
  const [category, setCategory] = useState("");
  if (!province) return <div className="tour-container guide-content"><h1>{translate("Chưa tìm thấy tỉnh, thành phố")}</h1><Link className="tour-text-link" to="/explore">{translate("Trở về danh mục 34 tỉnh/thành →")}</Link></div>;
  const all = placesForProvince(provinceId);
  const activeCategory = all.some((place) => place.category === category) ? category : "";
  const displayed = all.filter((place) => !activeCategory || place.category === activeCategory);
  const photo = coverForProvince(provinceId);
  return <div className="explore-page"><GuideBreadcrumb province={province} /><GuideHero eyebrow={translate(`${province.region.toUpperCase()} · VIỆT NAM`)} title={translate(province.name)} description={translate(province.intro)} photo={photo} /><div className="tour-container"><PhotoCredit photo={photo} /></div>
    <div className="tour-container guide-content">
      <div className="guide-intro-grid"><div><p className="tour-kicker">{translate("MỘT VÙNG ĐẤT, NHIỀU CÁCH KHÁM PHÁ")}</p><h2>{translate("Đi để hiểu thêm")}<br />{translate("về ")}{translate(province.name)}{translate(".")}</h2><p>{translate(province.intro)}{translate(" Chọn một gợi ý bên dưới để đọc câu chuyện, những điều có thể tìm hiểu và nguồn thông tin của từng điểm đến.")}</p><button className="tour-button tour-button-blue" onClick={() => onSelect(province.former[0])}>{translate("Lên kế hoạch theo khu vực →")}</button></div><AdministrationNote province={province} /></div>
      <section aria-labelledby="province-spots"><p className="tour-kicker">{translate("GỢI Ý BIÊN TẬP")}</p><h2 id="province-spots">{translate("Những điều đáng khám phá.")}</h2><CategoryFilters value={activeCategory} onChange={setCategory} available={categories.filter((item) => all.some((place) => place.category === item.id))} /><p className="explore-count" role="status">{translate(displayed.length)}{translate(" gợi ý · Tên khu vực cũ được ghi để dễ đối chiếu")}</p><div className="guide-place-grid">{translate(displayed.map((place) => <GuideCard key={place.id} place={place} />))}</div></section>
      <aside className="guide-sources"><h3>{translate("Đọc thông tin trước khi lên đường")}</h3><p>{translate("Các bài giới thiệu là nội dung tham khảo có dẫn nguồn, không phải kết quả đánh giá an toàn. Giờ mở cửa, giá vé và hoạt động thực tế cần kiểm tra với đơn vị quản lý. Đánh giá rủi ro hiện sử dụng các khu vực trong dữ liệu lịch sử; không tự gộp điểm rủi ro của các tỉnh cũ thành một điểm mới.")}</p><Link to="/explore" className="tour-text-link">{translate("Khám phá vùng đất khác →")}</Link></aside>
    </div></div>;
}
