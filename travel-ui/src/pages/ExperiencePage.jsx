import { useTranslate } from "../i18n/index.js";import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { categories, categoryById, places, provinces, matchesPlace, photoFor } from "../tourism/catalog";
import { GuideBreadcrumb, GuideCard, GuideEmpty, GuideHero, PhotoCredit } from "../tourism/ExploreComponents";

export default function ExperiencePage() {const translate = useTranslate();
  const { categoryId } = useParams();
  const category = categoryById[categoryId];
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(12);
  if (!category) return <div className="tour-container guide-content"><h1>{translate("Chưa có chủ đề này")}</h1><Link to="/explore">{translate("Trở về Khám phá →")}</Link></div>;
  const query = params.get("q") || "";
  const province = params.get("province") || "";
  const all = places.filter((place) => place.category === categoryId);
  const displayed = all.filter((place) => (!province || place.provinceId === province) && matchesPlace(place, query));
  const available = provinces.filter((item) => all.some((place) => place.provinceId === item.id)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const photo = photoFor(places.find((place) => place.id === category.cover));
  function update(key, value) {const next = new URLSearchParams(params);if (value) next.set(key, value);else next.delete(key);setParams(next, { replace: true });setLimit(12);}
  return <div className="explore-page"><GuideBreadcrumb category={category} /><GuideHero eyebrow={translate("MỌI TRẢI NGHIỆM – MỘT HÀNH TRÌNH")} title={translate(category.name)} description={translate(category.description)} photo={photo} /><div className="tour-container"><PhotoCredit photo={photo} /></div><div className="tour-container guide-content">
    <nav className="guide-filter-chips" aria-label={translate("Các nhóm trải nghiệm")}>{translate(categories.map((item) => <Link className={`tour-button ${item.id === categoryId ? "tour-button-blue" : ""}`} aria-current={item.id === categoryId ? "page" : undefined} key={item.id} to={`/experiences/${item.id}`}>{translate(item.short)}</Link>))}</nav>
    <h2>{translate("Chọn một trải nghiệm cho riêng bạn.")}</h2><div className="guide-experience-toolbar"><label>{translate("Tìm địa danh, món ăn hoặc tên tỉnh cũ")}<input type="search" placeholder={translate("Nhập điều bạn muốn khám phá…")} value={query} onChange={(event) => update("q", event.target.value)} /></label><label>{translate("Lọc theo tỉnh, thành phố hiện hành")}<select value={province} onChange={(event) => update("province", event.target.value)}><option value="">{translate("Tất cả tỉnh, thành phố")}</option>{translate(available.map((item) => <option key={item.id} value={item.id}>{translate(item.name)}</option>))}</select></label></div>
    <p className="explore-count" role="status" aria-live="polite">{translate(displayed.length)}{translate(" gợi ý phù hợp")}</p>{translate(displayed.length ? <><div className="guide-place-grid">{translate(displayed.slice(0, limit).map((place) => <GuideCard key={place.id} place={place} />))}</div>{translate(limit < displayed.length && <div className="guide-load-more"><button className="tour-button tour-button-blue" onClick={() => setLimit(limit + 12)}>{translate("Xem thêm trải nghiệm →")}</button></div>)}</> : <GuideEmpty onClear={() => setParams({})} />)}<p className="guide-sources">{translate("Danh mục chọn lọc để tham khảo, không phải danh sách đầy đủ hay bảng xếp hạng. Mỗi bài chi tiết có nguồn thông tin và nguồn ảnh riêng.")}</p>
  </div></div>;
}
