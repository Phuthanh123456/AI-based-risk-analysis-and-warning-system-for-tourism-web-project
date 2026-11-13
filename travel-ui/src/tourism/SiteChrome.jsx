import { useTranslate } from "../i18n/index.js";import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion as Motion, useReducedMotion } from "framer-motion";
import Drawer from "@mui/material/Drawer";
import ArrowForward from "@mui/icons-material/ArrowForwardRounded";
import MenuIcon from "@mui/icons-material/MenuRounded";
import CloseIcon from "@mui/icons-material/CloseRounded";
import ExploreIcon from "@mui/icons-material/ExploreOutlined";
import DarkIcon from "@mui/icons-material/DarkModeOutlined";
import LightIcon from "@mui/icons-material/LightModeOutlined";
import LanguageSwitch from "../components/LanguageSwitch";
import AssessmentIcon from "@mui/icons-material/FactCheckOutlined";
import RouteIcon from "@mui/icons-material/AltRouteOutlined";
import ArticleIcon from "@mui/icons-material/ArticleOutlined";
import CompareIcon from "@mui/icons-material/CompareArrowsRounded";
import NotificationsIcon from "@mui/icons-material/NotificationsNoneRounded";
import HistoryIcon from "@mui/icons-material/HistoryRounded";
import ChevronIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import "./Tourism.css";
import "./ToolsDropdown.css";

const tools = [["/result", "Kết quả rủi ro"], ["/traffic", "Giao thông"], ["/news", "Tin tức địa phương"], ["/compare", "So sánh điểm đến"], ["/alerts", "Cảnh báo của bạn"], ["/history", "Lịch sử hành trình"]];
const primary = [["/explore", "Khám phá"], ["/plan", "Lên hành trình"], ["/map", "Bản đồ"], ["/weather", "Thời tiết"]];
const toolIcons = [AssessmentIcon, RouteIcon, ArticleIcon, CompareIcon, NotificationsIcon, HistoryIcon];

export function Brand() {const translate = useTranslate();
  return <Link className="tour-brand" to="/" aria-label={translate("Vietnam Travel Risk AI — Trang chủ")}><span className="tour-brand-symbol" aria-hidden="true"><ExploreIcon /></span><span><strong>{translate("VIETNAM")}</strong><small>{translate("TRAVEL RISK AI")}</small></span></Link>;
}

export function SiteHeader({ overlay = false, signedIn = false, onLogin, themeMode, toggleTheme, logout }) {const translate = useTranslate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toolsRef = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    function closeOutside(event) {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) toolsRef.current.open = false;
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("focusin", closeOutside); };
  }, []);
  useEffect(() => { if (toolsRef.current) toolsRef.current.open = false; }, [pathname]);
  function toolsKeys(event) {
    const panel = toolsRef.current;
    if (event.key === "Escape") {
      panel.open = false;
      panel.querySelector("summary").focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    panel.open = true;
    const links = [...panel.querySelectorAll(".tour-tools-panel a")];
    const index = links.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : event.key === "ArrowDown" ? (index + 1) % links.length : index < 0 ? links.length - 1 : (index - 1 + links.length) % links.length;
    links[next]?.focus();
  }
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  const item = ([path, label]) => <Link key={path} to={path} aria-current={pathname === path || path === "/explore" && (pathname.startsWith("/explore/") || pathname.startsWith("/experiences/")) ? "page" : undefined} onClick={() => setOpen(false)}>{translate(label)}</Link>;
  return <>
    <header className={`tour-header ${overlay ? "over-hero" : ""} ${overlay && !scrolled ? "is-overlay" : ""}`}>
      <div className="tour-header-inner"><Brand /><nav className="tour-desktop-nav" aria-label={translate("Điều hướng chính")}>{translate(primary.map(item))}<details ref={toolsRef} className="tour-more" onKeyDown={toolsKeys}><summary>{translate("Tiện ích")}<ChevronIcon aria-hidden="true" /></summary><div className="tour-tools-panel">{tools.map(([path, label], index) => { const Icon = toolIcons[index]; return <Link key={path} to={path} aria-current={pathname === path ? "page" : undefined} onClick={() => { toolsRef.current.open = false; }}><span className="tour-tool-icon"><Icon aria-hidden="true" /></span><span>{translate(label)}</span><ArrowForward className="tour-tool-arrow" aria-hidden="true" /></Link>; })}</div></details></nav>
        <div className="tour-header-actions"><LanguageSwitch />{translate(signedIn && toggleTheme && <button className="tour-icon-button" onClick={toggleTheme} aria-label={translate(themeMode === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối")}>{translate(themeMode === "dark" ? <LightIcon /> : <DarkIcon />)}</button>)}{translate(signedIn ? <button className="tour-account" onClick={logout}>{translate("Đăng xuất")}</button> : <button className="tour-account" onClick={() => onLogin?.("/plan")}>{translate("Đăng nhập")}</button>)}<Link className="tour-button tour-button-blue tour-header-cta" to="/explore">{translate("Khám phá ngay ")}<ArrowForward fontSize="small" /></Link><button className="tour-icon-button tour-mobile-toggle" aria-label={translate("Mở menu điều hướng")} aria-expanded={open} onClick={() => setOpen(true)}><MenuIcon /></button></div>
      </div>
    </header>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { className: "tour-mobile-menu" } }}><div className="tour-mobile-menu-top"><Brand /><button className="tour-icon-button" aria-label={translate("Đóng menu")} onClick={() => setOpen(false)}><CloseIcon /></button></div><nav aria-label={translate("Điều hướng di động")}>{translate(primary.map(item))}<span className="tour-menu-label">{translate("THÔNG TIN CHO CHUYẾN ĐI")}</span>{translate(tools.map(item))}</nav><div className="tour-mobile-account-actions">{signedIn && toggleTheme && <button className="tour-button tour-button-outline" onClick={toggleTheme}>{translate(themeMode === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối")}</button>}<button className="tour-button tour-button-blue" onClick={() => { setOpen(false); if (signedIn) logout(); else onLogin?.("/plan"); }}>{translate(signedIn ? "Đăng xuất" : "Đăng nhập")}</button></div></Drawer>
  </>;
}

export function SiteFooter() {const translate = useTranslate();
  return <footer className="tour-footer"><div className="tour-container tour-footer-grid"><div><Brand /><p>{translate("Khám phá những miền đất đẹp.")}<br />{translate("Chủ động trên mỗi hành trình.")}</p><span className="tour-footer-caption">{translate("VIỆT NAM · ĐI ĐỂ HIỂU THÊM")}</span></div><div><h2>{translate("Khám phá Việt Nam")}</h2><Link to="/explore">{translate("Điểm đến")}</Link><Link to="/map">{translate("Bản đồ Việt Nam")}</Link><Link to="/news">{translate("Tin tức địa phương")}</Link></div><div><h2>{translate("Hành trình của bạn")}</h2><Link to="/plan">{translate("Lên kế hoạch")}</Link><Link to="/weather">{translate("Thời tiết & dự báo")}</Link><Link to="/alerts">{translate("Theo dõi cảnh báo")}</Link></div><div><h2>{translate("Đi cùng thông tin")}</h2><p>{translate("Thông tin hỗ trợ chuẩn bị chuyến đi. Luôn kiểm tra nguồn và các thông báo chính thức trước khi khởi hành.")}</p><a href="/images/landing/PHOTO_CREDITS.md">{translate("Nguồn hình ảnh")}</a><a href="/images/explore/PHOTO_CREDITS.json">{translate("Nguồn ảnh mục Khám phá")}</a></div></div><div className="tour-container tour-footer-bottom"><span>{translate("© ")}{translate(new Date().getFullYear())}{translate(" Vietnam Travel Risk AI")}</span><span>{translate("Một hành trình, nhiều góc nhìn.")}</span></div></footer>;
}

export function Reveal({ children, className = "", delay = 0 }) {const translate = useTranslate();
  const reduced = useReducedMotion();
  return <Motion.div className={className} initial={reduced ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>{translate(children)}</Motion.div>;
}

export function TravelImage({ src, alt = "", className = "", eager = false }) {const translate = useTranslate();
  return <img className={className} src={src} alt={translate(alt)} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" onError={(event) => {event.currentTarget.onerror = null;event.currentTarget.src = "/images/landing/vietnam-skyline.webp";}} />;
}

export function SectionHeading({ number, eyebrow, title, description, children }) {const translate = useTranslate();
  return <div className="tour-section-heading"><div><p className="tour-kicker"><span>{translate(number)}</span>{translate(eyebrow)}</p><h2>{translate(title)}</h2></div><div className="tour-section-aside">{translate(description && <p>{translate(description)}</p>)}{translate(children)}</div></div>;
}

export function DestinationCard({ place, onSelect, featured = false }) {const translate = useTranslate();
  const Card = place.href ? Link : "button";
  const action = place.href ? { to: place.href } : { onClick: () => onSelect(place.name) };
  return <Card className={`tour-destination ${featured ? "is-featured" : ""}`} {...action}><TravelImage src={place.image} alt={translate(place.alt || `Hình ảnh gợi cảm hứng tại ${place.name}`)} /><span className="tour-destination-shade" /><span className="tour-destination-top">{translate(place.tag || "VIỆT NAM")}<span aria-hidden="true">{translate("↗")}</span></span><span className="tour-destination-bottom"><small>{translate(place.caption || "HÀNH TRÌNH CỦA RIÊNG BẠN")}</small><strong>{translate(place.name)}</strong><span>{translate("Khám phá & lên kế hoạch ")}<ArrowForward fontSize="small" /></span></span></Card>;
}
