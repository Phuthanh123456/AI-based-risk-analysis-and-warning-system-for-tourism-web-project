import ArrowBack from "@mui/icons-material/ArrowBackRounded";
import ExploreIcon from "@mui/icons-material/ExploreOutlined";
import "./AuthLayout.css";

export default function AuthLayout({ children, title, subtitle, onBack }) {
  return <main className="tour-auth"><section className="auth-image-panel"><img src="/images/landing/halong.webp" alt="Phong cảnh vịnh Hạ Long" /><div /><button className="auth-brand" onClick={onBack}><ExploreIcon aria-hidden="true" /><span>VIETNAM<small>TRAVEL RISK AI</small></span></button><div className="auth-photo-copy"><p>VIỆT NAM ĐANG CHỜ BẠN</p><h2>Những miền đất đẹp.<br />Những hành trình an tâm.</h2><span>VỊNH HẠ LONG · QUẢNG NINH</span></div></section><section className="auth-form-panel"><button className="auth-back" onClick={onBack}><ArrowBack fontSize="small" /> Về trang chủ</button><div className="auth-form-content"><p className="tour-kicker">HÀNH TRÌNH CỦA BẠN</p><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>{children}</div><p className="auth-footer-note">Vietnam Travel Risk AI · Đi để hiểu thêm</p></section></main>;
}
