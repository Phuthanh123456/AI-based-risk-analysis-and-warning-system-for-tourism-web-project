import { useTranslate } from "../i18n/index.js";import ArrowBack from "@mui/icons-material/ArrowBackRounded";
import ExploreIcon from "@mui/icons-material/ExploreOutlined";
import LanguageSwitch from "../components/LanguageSwitch";
import { Link } from "react-router-dom";
import "./AuthLayout.css";

export default function AuthLayout({ children, title, subtitle, onBack }) {const translate = useTranslate();
  function goHome(event) {
    if (onBack) { event.preventDefault(); onBack(); }
  }
  return <main className="tour-auth"><section className="auth-image-panel"><img src="/images/landing/halong.webp" alt={translate("Phong cảnh vịnh Hạ Long")} /><div /><Link className="auth-brand" to="/" onClick={goHome}><ExploreIcon aria-hidden="true" /><span>{translate("VIETNAM")}<small>{translate("TRAVEL RISK AI")}</small></span></Link><div className="auth-photo-copy"><p>{translate("VIỆT NAM ĐANG CHỜ BẠN")}</p><h2>{translate("Những miền đất đẹp.")}<br />{translate("Những hành trình an tâm.")}</h2><span>{translate("VỊNH HẠ LONG · QUẢNG NINH")}</span></div></section><section className="auth-form-panel"><div className="auth-top-actions"><Link className="auth-back" to="/" onClick={goHome}><ArrowBack fontSize="small" />{translate(" Về trang chủ")}</Link><LanguageSwitch /></div><div className="auth-form-content"><p className="tour-kicker">{translate("HÀNH TRÌNH CỦA BẠN")}</p><h1>{translate(title)}</h1><p className="auth-subtitle">{translate(subtitle)}</p>{translate(children)}</div><p className="auth-footer-note">{translate("Vietnam Travel Risk AI · Đi để hiểu thêm")}</p></section></main>;
}
