import { useTranslate } from "../i18n/index.js";import ArrowBack from "@mui/icons-material/ArrowBackRounded";
import ExploreIcon from "@mui/icons-material/ExploreOutlined";
import LanguageSwitch from "../components/LanguageSwitch";
import { Link } from "react-router-dom";

import "./AuthLayout.css";

export default function AuthLayout({ children, title, subtitle, onBack }) {const translate = useTranslate();

  function goHome(event) {
    if (onBack) { event.preventDefault(); onBack(); }
  }
  return <main className="tour-auth guardian-auth">

    <div className="auth-top-actions"><Link className="auth-back" to="/" onClick={goHome}><ArrowBack fontSize="small" />{translate(" Về trang chủ")}</Link><LanguageSwitch /></div>
    <div className="guardian-auth-card"><section className="auth-image-panel"><img className="guardian-auth-scene" src="/images/landing/hoian-lanterns.webp" alt="" /></section>
    <section className="auth-form-panel"><div className="auth-form-content"><p className="tour-kicker">{translate("HÀNH TRÌNH CỦA BẠN")}</p><h1>{translate(title)}</h1><p className="auth-subtitle">{translate(subtitle)}</p>{translate(children)}<div className="guardian-auth-note"><ExploreIcon /><p>{translate("Khám phá điểm đến, chuẩn bị hành trình và theo dõi thông tin phù hợp với chuyến đi của bạn.")}</p></div></div></section></div>
    <p className="auth-footer-note">{translate("Vietnam Travel Risk AI · Đi để hiểu thêm")}</p>
  </main>;
}
