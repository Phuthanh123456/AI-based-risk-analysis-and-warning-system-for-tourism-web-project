import { useTranslate } from "../i18n/index.js";import { Link } from "react-router-dom";
import ArrowForward from "@mui/icons-material/ArrowForwardRounded";
import RestaurantMenu from "@mui/icons-material/RestaurantMenuRounded";
import { Reveal, TravelImage } from "./SiteChrome";
import { categories, categoryById, places, provinceById, photoFor, coverForProvince, placePath, ADMIN_SOURCE, HUE_SOURCE } from "./catalog";
import "./ExploreGuide.css";

export function ExperienceGrid() {const translate = useTranslate();
  return <section className="guide-experiences tour-container" aria-labelledby="experiences-title">
    <Reveal className="guide-section-heading"><div><p className="tour-kicker">{translate("CHỌN ĐIỀU BẠN MUỐN TRẢI NGHIỆM")}</p><h2 id="experiences-title">{translate("Mọi trải nghiệm – ")}<em>{translate("Một hành trình.")}</em></h2></div><p>{translate("Từ di sản và phố xá đến hương vị bản địa, biển đảo và những làng nghề. Chọn một chủ đề để mở ra hành trình khám phá Việt Nam của bạn.")}</p></Reveal>
    <div className="guide-experience-grid">{translate(categories.map((category, index) => {
        const photo = photoFor(places.find((place) => place.id === category.cover));
        return <Reveal key={category.id} delay={index * .04}><Link className="guide-experience-card" to={`/experiences/${category.id}`}><TravelImage src={photo.image} alt={translate(photo.subject)} /><span className="guide-image-shade" /><span className="guide-experience-label"><strong>{translate(category.name)}</strong><ArrowForward aria-hidden="true" /></span></Link></Reveal>;
      }))}</div>
  </section>;
}

export function PhotoCredit({ photo }) {const translate = useTranslate();
  return <p className="guide-photo-credit">{translate(photo.contextual ? "Ảnh tham khảo" : "Ảnh")}{translate(": ")}{translate(photo.subject)}{translate(photo.source && <>{translate(" · ")}<a href={photo.source} target="_blank" rel="noreferrer">{translate(photo.artist)}</a>{translate(" · ")}{translate(photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{translate(photo.license)}</a> : photo.license)}</>)}{translate(photo.illustration && " · Minh họa được tạo riêng cho dự án")}</p>;
}

export function GuideHero({ eyebrow, title, description, photo, children }) {const translate = useTranslate();
  return <section className="guide-hero"><TravelImage src={photo.image} alt={translate(photo.subject)} eager /><span className="guide-image-shade" /><div className="tour-container"><p className="home-eyebrow">{translate(eyebrow)}</p><h1>{translate(title)}</h1><p className="guide-hero-description">{translate(description)}</p>{translate(children)}</div></section>;
}

export function GuideBreadcrumb({ province, place, category }) {const translate = useTranslate();
  return <nav className="tour-container guide-breadcrumb" aria-label={translate("Đường dẫn")}><Link to="/">{translate("Trang chủ")}</Link><span>{translate("/")}</span><Link to="/explore">{translate("Khám phá")}</Link>{translate(province && <><span>{translate("/")}</span>{translate(place ? <Link to={`/explore/${province.id}`}>{translate(province.name)}</Link> : <strong>{translate(province.name)}</strong>)}</>)}{translate(category && <><span>{translate("/")}</span><strong>{translate(category.short)}</strong></>)}{translate(place && <><span>{translate("/")}</span><strong>{translate(place.name)}</strong></>)}</nav>;
}

export function ProvinceCard({ province }) {const translate = useTranslate();
  const photo = coverForProvince(province.id);
  return <Link className="guide-province-card" to={`/explore/${province.id}`}><div className="guide-province-photo"><TravelImage src={photo.image} alt={translate(photo.subject)} /><span className="guide-image-shade" /><span className="guide-province-region">{translate(province.region)}<ArrowForward aria-hidden="true" /></span><div><small>{translate(province.city ? "THÀNH PHỐ TRỰC THUỘC TRUNG ƯƠNG" : "TỈNH")}</small><h3>{translate(province.name)}</h3></div></div><div className="guide-province-info"><p>{translate(province.intro)}</p><span>{translate(province.id === "hue" ? "Trước đây: Thừa Thiên Huế" : province.former.length === 1 ? "Không hợp nhất cấp tỉnh năm 2025" : "Gồm: " + province.former.join(" · "))}</span><strong>{translate("Khám phá ")}{translate(places.filter((place) => place.provinceId === province.id).length)}{translate(" gợi ý ")}<ArrowForward fontSize="small" /></strong></div></Link>;
}

export function GuideCard({ place }) {const translate = useTranslate();
  const photo = photoFor(place);
  const foodNote = place.kind === "food" && photo.fallback;
  return <article className="guide-place-card"><Link to={placePath(place)} className="guide-place-photo">{translate(foodNote ? <div className="guide-food-note"><RestaurantMenu aria-hidden="true" /><span>{translate("HƯƠNG VỊ BẢN ĐỊA")}</span><strong>{translate(place.name)}</strong></div> : <TravelImage src={photo.image} alt={translate(photo.subject)} />)}<span className="guide-place-category">{translate(categoryById[place.category].short)}</span>{translate(photo.contextual && !foodNote && <small>{translate("ẢNH MINH HỌA")}</small>)}</Link><div><p className="guide-location">{translate(provinceById[place.provinceId].name)}{translate(" · ")}{translate(place.former)}</p><h3><Link to={placePath(place)}>{translate(place.name)}</Link></h3><p className="guide-card-description">{translate(place.description)}</p><Link className="tour-text-link" to={placePath(place)}>{translate("Khám phá chi tiết ")}<ArrowForward fontSize="small" /></Link></div></article>;
}

export function CategoryFilters({ value, onChange, available = categories }) {const translate = useTranslate();
  return <div className="guide-filter-chips" role="group" aria-label={translate("Lọc theo trải nghiệm")}><button className={!value ? "is-active" : ""} aria-pressed={!value} onClick={() => onChange("")}>{translate("Tất cả")}</button>{translate(available.map((category) => <button key={category.id} aria-pressed={value === category.id} className={value === category.id ? "is-active" : ""} onClick={() => onChange(category.id)}>{translate(category.short)}</button>))}</div>;
}

export function AdministrationNote({ province }) {const translate = useTranslate();
  return <aside className="guide-admin-note"><p className="tour-kicker">{translate("ĐỊA GIỚI HIỆN HÀNH")}</p><h2>{translate(province.name)}</h2><p>{translate(province.id === "hue" ? "Thành phố Huế được thành lập trên cơ sở toàn bộ tỉnh Thừa Thiên Huế; không hợp nhất cấp tỉnh trong đợt sắp xếp năm 2025." : province.former.length > 1 ? "Địa phương hiện nay gồm các tỉnh, thành phố trước sắp xếp:" : "Không thực hiện hợp nhất cấp tỉnh trong đợt sắp xếp năm 2025.")}</p><div className="guide-former-list">{translate(province.former.map((name) => <span key={name}>{translate(name)}</span>))}</div><a href={province.id === "hue" ? HUE_SOURCE : ADMIN_SOURCE} target="_blank" rel="noreferrer">{translate("Đối chiếu nghị quyết chính thức ↗")}</a></aside>;
}

export function GuideEmpty({ onClear }) {const translate = useTranslate();
  return <div className="explore-state"><h3>{translate("Chưa có gợi ý phù hợp")}</h3><p>{translate("Thử một từ khóa khác hoặc xem lại các bộ lọc đang chọn.")}</p><button className="tour-button tour-button-blue" onClick={onClear}>{translate("Xóa bộ lọc")}</button></div>;
}
