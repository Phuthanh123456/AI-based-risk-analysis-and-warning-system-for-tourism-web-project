import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion as Motion, useReducedMotion } from "framer-motion";
import Drawer from "@mui/material/Drawer";
import ArrowForward from "@mui/icons-material/ArrowForwardRounded";
import MenuIcon from "@mui/icons-material/MenuRounded";
import CloseIcon from "@mui/icons-material/CloseRounded";
import ExploreIcon from "@mui/icons-material/ExploreOutlined";
import DarkIcon from "@mui/icons-material/DarkModeOutlined";
import LightIcon from "@mui/icons-material/LightModeOutlined";
import "./Tourism.css";

const tools = [["/result", "Kết quả rủi ro"], ["/traffic", "Giao thông"], ["/news", "Tin tức địa phương"], ["/compare", "So sánh điểm đến"], ["/alerts", "Cảnh báo của bạn"], ["/history", "Lịch sử hành trình"]];
const primary = [["/explore", "Khám phá"], ["/plan", "Lên hành trình"], ["/map", "Bản đồ"], ["/weather", "Thời tiết"]];

export function Brand() {
  return <Link className="tour-brand" to="/" aria-label="Vietnam Travel Risk AI — Trang chủ"><span className="tour-brand-symbol" aria-hidden="true"><ExploreIcon /></span><span><strong>VIETNAM</strong><small>TRAVEL RISK AI</small></span></Link>;
}

export function SiteHeader({ overlay = false, signedIn = false, onLogin, themeMode, toggleTheme, logout }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  const item = ([path, label]) => <Link key={path} to={path} aria-current={pathname === path ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>;
  return <>
    <header className={`tour-header ${overlay && !scrolled ? "is-overlay" : ""}`}>
      <div className="tour-header-inner"><Brand /><nav className="tour-desktop-nav" aria-label="Điều hướng chính">{primary.map(item)}<details className="tour-more" onKeyDown={(event) => { if (event.key === "Escape") event.currentTarget.open = false; }}><summary>Tiện ích <span aria-hidden="true">⌄</span></summary><div>{tools.map(([path, label]) => <Link key={path} to={path} onClick={(event) => { event.currentTarget.closest("details").open = false; }}>{label}</Link>)}</div></details></nav>
        <div className="tour-header-actions">{signedIn && toggleTheme && <button className="tour-icon-button" onClick={toggleTheme} aria-label={themeMode === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}>{themeMode === "dark" ? <LightIcon /> : <DarkIcon />}</button>}{signedIn ? <button className="tour-account" onClick={logout}>Đăng xuất</button> : <button className="tour-account" onClick={() => onLogin?.("/plan")}>Đăng nhập</button>}<Link className="tour-button tour-button-blue tour-header-cta" to="/explore">Khám phá ngay <ArrowForward fontSize="small" /></Link><button className="tour-icon-button tour-mobile-toggle" aria-label="Mở menu điều hướng" aria-expanded={open} onClick={() => setOpen(true)}><MenuIcon /></button></div>
      </div>
    </header>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { className: "tour-mobile-menu" } }}><div className="tour-mobile-menu-top"><Brand /><button className="tour-icon-button" aria-label="Đóng menu" onClick={() => setOpen(false)}><CloseIcon /></button></div><nav aria-label="Điều hướng di động">{primary.map(item)}<span className="tour-menu-label">THÔNG TIN CHO CHUYẾN ĐI</span>{tools.map(item)}</nav></Drawer>
  </>;
}

export function SiteFooter() {
  return <footer className="tour-footer"><div className="tour-container tour-footer-grid"><div><Brand /><p>Khám phá những miền đất đẹp.<br />Chủ động trên mỗi hành trình.</p><span className="tour-footer-caption">VIỆT NAM · ĐI ĐỂ HIỂU THÊM</span></div><div><h2>Khám phá Việt Nam</h2><Link to="/explore">Điểm đến</Link><Link to="/map">Bản đồ Việt Nam</Link><Link to="/news">Tin tức địa phương</Link></div><div><h2>Hành trình của bạn</h2><Link to="/plan">Lên kế hoạch</Link><Link to="/weather">Thời tiết & dự báo</Link><Link to="/alerts">Theo dõi cảnh báo</Link></div><div><h2>Đi cùng thông tin</h2><p>Thông tin hỗ trợ chuẩn bị chuyến đi. Luôn kiểm tra nguồn và các thông báo chính thức trước khi khởi hành.</p><a href="/images/landing/PHOTO_CREDITS.md">Nguồn hình ảnh</a></div></div><div className="tour-container tour-footer-bottom"><span>© {new Date().getFullYear()} Vietnam Travel Risk AI</span><span>Một hành trình, nhiều góc nhìn.</span></div></footer>;
}

export function Reveal({ children, className = "", delay = 0 }) {
  const reduced = useReducedMotion();
  return <Motion.div className={className} initial={reduced ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</Motion.div>;
}

export function TravelImage({ src, alt = "", className = "", eager = false }) {
  return <img className={className} src={src} alt={alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/landing/vietnam-skyline.png"; }} />;
}

export function SectionHeading({ number, eyebrow, title, description, children }) {
  return <div className="tour-section-heading"><div><p className="tour-kicker"><span>{number}</span>{eyebrow}</p><h2>{title}</h2></div><div className="tour-section-aside">{description && <p>{description}</p>}{children}</div></div>;
}

export function DestinationCard({ place, onSelect, featured = false }) {
  return <button className={`tour-destination ${featured ? "is-featured" : ""}`} onClick={() => onSelect(place.name)}><TravelImage src={place.image} alt={place.alt || `Hình ảnh gợi cảm hứng tại ${place.name}`} /><span className="tour-destination-shade" /><span className="tour-destination-top">{place.tag || "VIỆT NAM"}<span aria-hidden="true">↗</span></span><span className="tour-destination-bottom"><small>{place.caption || "HÀNH TRÌNH CỦA RIÊNG BẠN"}</small><strong>{place.name}</strong><span>Khám phá & lên kế hoạch <ArrowForward fontSize="small" /></span></span></button>;
}
