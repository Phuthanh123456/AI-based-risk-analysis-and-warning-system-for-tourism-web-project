import { Link } from "react-router-dom";
import ArrowForward from "@mui/icons-material/ArrowForwardRounded";
import RestaurantMenu from "@mui/icons-material/RestaurantMenuRounded";
import { Reveal, TravelImage } from "./SiteChrome";
import { categories, categoryById, places, provinceById, photoFor, coverForProvince, placePath, ADMIN_SOURCE, HUE_SOURCE } from "./catalog";
import "./ExploreGuide.css";

export function ExperienceGrid() {
  return <section className="guide-experiences tour-container" aria-labelledby="experiences-title">
    <Reveal className="guide-section-heading"><div><p className="tour-kicker">CHỌN ĐIỀU BẠN MUỐN TRẢI NGHIỆM</p><h2 id="experiences-title">Mọi trải nghiệm – <em>Một hành trình.</em></h2></div><p>Từ di sản và phố xá đến hương vị bản địa, biển đảo và những làng nghề. Chọn một chủ đề để mở ra hành trình khám phá Việt Nam của bạn.</p></Reveal>
    <div className="guide-experience-grid">{categories.map((category, index) => {
      const photo = photoFor(places.find((place) => place.id === category.cover));
      return <Reveal key={category.id} delay={index * .04}><Link className="guide-experience-card" to={`/experiences/${category.id}`}><TravelImage src={photo.image} alt={photo.subject} /><span className="guide-image-shade" /><span className="guide-experience-label"><strong>{category.name}</strong><ArrowForward aria-hidden="true" /></span></Link></Reveal>;
    })}</div>
  </section>;
}

export function PhotoCredit({ photo }) {
  return <p className="guide-photo-credit">{photo.contextual ? "Ảnh tham khảo" : "Ảnh"}: {photo.subject}{photo.source && <> · <a href={photo.source} target="_blank" rel="noreferrer">{photo.artist}</a> · {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a> : photo.license}</>}{photo.illustration && " · Minh họa được tạo riêng cho dự án"}</p>;
}

export function GuideHero({ eyebrow, title, description, photo, children }) {
  return <section className="guide-hero"><TravelImage src={photo.image} alt={photo.subject} eager /><span className="guide-image-shade" /><div className="tour-container"><p className="home-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="guide-hero-description">{description}</p>{children}</div></section>;
}

export function GuideBreadcrumb({ province, place, category }) {
  return <nav className="tour-container guide-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span>/</span><Link to="/explore">Khám phá</Link>{province && <><span>/</span>{place ? <Link to={`/explore/${province.id}`}>{province.name}</Link> : <strong>{province.name}</strong>}</>}{category && <><span>/</span><strong>{category.short}</strong></>}{place && <><span>/</span><strong>{place.name}</strong></>}</nav>;
}

export function ProvinceCard({ province }) {
  const photo = coverForProvince(province.id);
  return <Link className="guide-province-card" to={`/explore/${province.id}`}><div className="guide-province-photo"><TravelImage src={photo.image} alt={photo.subject} /><span className="guide-image-shade" /><span className="guide-province-region">{province.region}<ArrowForward aria-hidden="true" /></span><div><small>{province.city ? "THÀNH PHỐ TRỰC THUỘC TRUNG ƯƠNG" : "TỈNH"}</small><h3>{province.name}</h3></div></div><div className="guide-province-info"><p>{province.intro}</p><span>{province.id === "hue" ? "Trước đây: Thừa Thiên Huế" : province.former.length === 1 ? "Không hợp nhất cấp tỉnh năm 2025" : "Gồm: " + province.former.join(" · ")}</span><strong>Khám phá {places.filter((place) => place.provinceId === province.id).length} gợi ý <ArrowForward fontSize="small" /></strong></div></Link>;
}

export function GuideCard({ place }) {
  const photo = photoFor(place);
  const foodNote = place.kind === "food" && photo.fallback;
  return <article className="guide-place-card"><Link to={placePath(place)} className="guide-place-photo">{foodNote ? <div className="guide-food-note"><RestaurantMenu aria-hidden="true" /><span>HƯƠNG VỊ BẢN ĐỊA</span><strong>{place.name}</strong></div> : <TravelImage src={photo.image} alt={photo.subject} />}<span className="guide-place-category">{categoryById[place.category].short}</span>{photo.contextual && !foodNote && <small>ẢNH MINH HỌA</small>}</Link><div><p className="guide-location">{provinceById[place.provinceId].name} · {place.former}</p><h3><Link to={placePath(place)}>{place.name}</Link></h3><p className="guide-card-description">{place.description}</p><Link className="tour-text-link" to={placePath(place)}>Khám phá chi tiết <ArrowForward fontSize="small" /></Link></div></article>;
}

export function CategoryFilters({ value, onChange, available = categories }) {
  return <div className="guide-filter-chips" role="group" aria-label="Lọc theo trải nghiệm"><button className={!value ? "is-active" : ""} aria-pressed={!value} onClick={() => onChange("")}>Tất cả</button>{available.map((category) => <button key={category.id} aria-pressed={value === category.id} className={value === category.id ? "is-active" : ""} onClick={() => onChange(category.id)}>{category.short}</button>)}</div>;
}

export function AdministrationNote({ province }) {
  return <aside className="guide-admin-note"><p className="tour-kicker">ĐỊA GIỚI HIỆN HÀNH</p><h2>{province.name}</h2><p>{province.id === "hue" ? "Thành phố Huế được thành lập trên cơ sở toàn bộ tỉnh Thừa Thiên Huế; không hợp nhất cấp tỉnh trong đợt sắp xếp năm 2025." : province.former.length > 1 ? "Địa phương hiện nay gồm các tỉnh, thành phố trước sắp xếp:" : "Không thực hiện hợp nhất cấp tỉnh trong đợt sắp xếp năm 2025."}</p><div className="guide-former-list">{province.former.map((name) => <span key={name}>{name}</span>)}</div><a href={province.id === "hue" ? HUE_SOURCE : ADMIN_SOURCE} target="_blank" rel="noreferrer">Đối chiếu nghị quyết chính thức ↗</a></aside>;
}

export function GuideEmpty({ onClear }) {
  return <div className="explore-state"><h3>Chưa có gợi ý phù hợp</h3><p>Thử một từ khóa khác hoặc xem lại các bộ lọc đang chọn.</p><button className="tour-button tour-button-blue" onClick={onClear}>Xóa bộ lọc</button></div>;
}
