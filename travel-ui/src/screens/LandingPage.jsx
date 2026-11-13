import { useTranslate } from "../i18n/index.js";import { Link } from "react-router-dom";
import ArrowForward from "@mui/icons-material/ArrowForwardRounded";
import MapIcon from "@mui/icons-material/MapOutlined";
import CloudIcon from "@mui/icons-material/WbCloudyOutlined";
import NewsIcon from "@mui/icons-material/ArticleOutlined";
import RouteIcon from "@mui/icons-material/RouteOutlined";
import { DestinationCard, Reveal, SectionHeading, SiteHeader, SiteFooter, TravelImage } from "../tourism/SiteChrome";
import "./LandingPage.css";
import { ExperienceGrid } from "../tourism/ExploreComponents";

const images = "/images/landing/";
const places = [
{ name: "Hồ Chí Minh", image: images + "saigon-bridge.webp", href: "/explore/ho-chi-minh", tag: "NHỊP SỐNG ĐÔ THỊ", caption: "BÊN DÒNG SÔNG SÀI GÒN" },
{ name: "Hội An", image: images + "hoian.webp", href: "/explore/da-nang/hoi-an", tag: "NHỮNG MIỀN DI SẢN", caption: "ÁNH ĐÈN VÀ NÉT XƯA" },
{ name: "Hạ Long", image: images + "halong.webp", href: "/explore/quang-ninh/ha-long", tag: "THIÊN NHIÊN RỘNG MỞ", caption: "GIỮA TRÙNG ĐIỆP NÚI VÀ BIỂN" },
{ name: "Hà Nội", image: images + "hanoi.webp", href: "/explore/ha-noi", tag: "VĂN HÓA & CUỘC SỐNG", caption: "NHỮNG GÓC PHỐ ĐẦY CÂU CHUYỆN" }];

const features = [
{ Icon: RouteIcon, title: "Hành trình của riêng bạn", text: "Chọn điểm đi, điểm đến và mục đích để xem nhận định phù hợp.", route: "/plan" },
{ Icon: CloudIcon, title: "Thời tiết trước giờ đi", text: "Xem điều kiện hiện tại, dự báo từng ngày và các lưu ý từ hệ thống.", route: "/weather" },
{ Icon: MapIcon, title: "Mở rộng góc nhìn", text: "Đặt hành trình vào bản đồ cùng dữ liệu tỉnh thành và lớp rủi ro.", route: "/map" },
{ Icon: NewsIcon, title: "Hiểu thêm địa phương", text: "Đọc các sự kiện đã ghi nhận, kiểm tra ngày cập nhật và nguồn tin.", route: "/news" }];


export function LandingPage({ onGoToLogin, signedIn = false, themeMode, toggleTheme, logout }) {const translate = useTranslate();
  return <div className="tour-site">
    <a className="tour-skip" href="#home-main">{translate("Đi đến nội dung")}</a>
    <SiteHeader overlay signedIn={signedIn} onLogin={onGoToLogin} themeMode={themeMode} toggleTheme={toggleTheme} logout={logout} />
    <main id="home-main">
      <section className="home-hero">
        <TravelImage src={images + "halong.webp"} className="home-hero-image" alt={translate("Những đảo đá và thuyền trên vịnh Hạ Long")} eager />
        <div className="home-hero-overlay" />
        <div className="tour-container home-hero-content"><Reveal>
          <p className="home-eyebrow"><span />{translate(" VIỆT NAM · MỖI CHUYẾN ĐI MỘT CÂU CHUYỆN")}</p>
          <h1>{translate("Khám phá Việt Nam.")}<br /><em>{translate("An tâm trên")}<br className="home-desktop-break" />{translate(" mọi hành trình.")}</em></h1>
          <p className="home-hero-description">{translate("Những miền đất đẹp đang chờ bạn. Khám phá điểm đến và chủ động trước rủi ro thời tiết với công nghệ AI.")}</p>
          <div className="home-hero-actions"><Link className="tour-button tour-button-white" to="/explore">{translate("Khám phá điểm đến ")}<ArrowForward fontSize="small" /></Link><button className="tour-button tour-button-outline" onClick={() => onGoToLogin("/plan")}>{translate("Phân tích rủi ro ")}<ArrowForward fontSize="small" /></button></div>
        </Reveal></div>
        <div className="tour-container home-hero-bottom"><span>{translate("ĐIỂM ĐẾN · THỜI TIẾT · THÔNG TIN ĐỊA PHƯƠNG")}</span><a href="#home-destinations">{translate("Cuộn để khám phá ")}<span aria-hidden="true">{translate("↓")}</span></a></div>
        <span className="home-photo-caption">{translate("VỊNH HẠ LONG, QUẢNG NINH")}</span>
      </section>
      <div className="home-ribbon"><span>{translate("VIỆT NAM RỘNG MỞ")}</span><i aria-hidden="true">{translate("✦")}</i><span>{translate("ĐI ĐỂ HIỂU THÊM")}</span><i aria-hidden="true">{translate("✦")}</i><span>{translate("SẴN SÀNG CHO CHUYẾN ĐI")}</span></div>
      <ExperienceGrid />
      <section className="home-section" id="home-destinations"><div className="tour-container">
        <Reveal><SectionHeading number="01" eyebrow={translate("CẢM HỨNG KHÁM PHÁ")} title={translate(<>{translate("Một Việt Nam.")}<br />{translate("Vô vàn trải nghiệm.")}</>)} description={translate("Từ những góc phố rộn ràng đến miền di sản bên dòng nước. Chọn một nơi để bắt đầu câu chuyện của bạn.")}><Link className="tour-text-link" to="/explore">{translate("Khám phá các tỉnh thành ")}<ArrowForward fontSize="small" /></Link></SectionHeading></Reveal>
        <div className="home-destination-grid">{translate(places.map((place, i) => <Reveal key={place.name} delay={i * .06}><DestinationCard place={place} featured={i === 0 || i === 3} onSelect={(name) => onGoToLogin("/plan", name)} /></Reveal>))}</div>
        <p className="home-editorial-note">{translate("Gợi ý hình ảnh biên tập để lấy cảm hứng; không phải bảng xếp hạng an toàn.")}</p>
      </div></section>
      <section className="home-story"><div className="tour-container home-story-grid">
        <Reveal className="home-story-art"><TravelImage src={images + "vietnam-skyline.webp"} alt={translate("Minh họa các miền cảnh quan Việt Nam")} /><span className="home-art-note">{translate("ĐI XA HƠN. HIỂU NHIỀU HƠN.")}</span></Reveal>
        <Reveal><p className="tour-kicker"><span>{translate("02")}</span>{translate(" CÔNG NGHỆ ĐỒNG HÀNH")}</p><h2>{translate("Hành trang tốt nhất")}<br />{translate("là sự chủ động.")}</h2><p>{translate("Đằng sau mỗi chuyến đi là những điều cần cân nhắc. Hệ thống kết hợp điều kiện thời tiết, tuyến đường và tin tức địa phương để bạn có thêm cơ sở trước khi khởi hành.")}</p><p>{translate("Đánh giá có nguồn, có thời điểm và có giới hạn được ghi rõ. Bạn luôn là người quyết định hành trình của mình.")}</p><button className="tour-text-link" onClick={() => onGoToLogin("/plan")}>{translate("Tìm hiểu qua hành trình của bạn ")}<ArrowForward fontSize="small" /></button></Reveal>
      </div></section>
      <section className="home-section"><div className="tour-container">
        <Reveal><SectionHeading number="03" eyebrow={translate("MỌI THÔNG TIN, MỘT HÀNH TRÌNH")} title={translate(<>{translate("Thêm thông tin.")}<br />{translate("Thêm tự tin khám phá.")}</>)} description={translate("Mỗi công cụ có một góc nhìn. Khám phá điều bạn cần, vào lúc bạn cần.")} /></Reveal>
        <div className="home-feature-list">{translate(features.map((tool, i) => <Reveal key={tool.route} delay={i * .06}><button onClick={() => onGoToLogin(tool.route)}><span className="home-feature-number">{translate("0")}{translate(i + 1)}</span><tool.Icon aria-hidden="true" /><div><h3>{translate(tool.title)}</h3><p>{translate(tool.text)}</p></div><ArrowForward className="home-feature-arrow" aria-hidden="true" /></button></Reveal>))}</div>
      </div></section>
      <section className="home-journal"><div className="tour-container">
        <Reveal><SectionHeading number="04" eyebrow={translate("BẮT ĐẦU THẬT ĐƠN GIẢN")} title={translate("Ba bước cho một chuyến đi chủ động.")} description={translate("Chuẩn bị vừa đủ để dành nhiều thời gian hơn cho những trải nghiệm đẹp.")} /></Reveal>
        <div className="home-journal-grid">{translate([
            ["01", "Chọn điểm đến", "Điểm đi, điểm đến và thời gian — bắt đầu từ những dự định của bạn.", "hoian-lanterns.webp", "/plan"],
            ["02", "Xem các điều kiện", "Kiểm tra thời tiết, tuyến đường và tình trạng dữ liệu địa phương.", "halong-karsts.webp", "/weather"],
            ["03", "Cân nhắc và lên đường", "Đọc nhận định, nguồn thông tin và lưu ý trước khi đưa ra quyết định.", "saigon-night.webp", "/plan"]].
            map(([number, title, text, image, route]) => <Reveal key={number}><button className="home-journal-photo" onClick={() => onGoToLogin(route)} aria-label={translate(title)}><TravelImage src={images + image} alt={translate("")} /><span>{translate(number)}</span><ArrowForward aria-hidden="true" /></button><h3>{translate(title)}</h3><p>{translate(text)}</p></Reveal>))}</div>
      </div></section>
      <section className="home-final"><TravelImage src={images + "saigon-sunset.webp"} alt={translate("")} /><div className="home-final-shade" /><Reveal className="tour-container home-final-copy"><p className="home-eyebrow">{translate("HÀNH TRÌNH TIẾP THEO CỦA BẠN")}</p><h2>{translate("Việt Nam luôn có")}<br />{translate("điều mới để khám phá.")}</h2><Link className="tour-button tour-button-white" to="/explore">{translate("Tìm điểm đến của bạn ")}<ArrowForward fontSize="small" /></Link></Reveal></section>
    </main><SiteFooter />
  </div>;
}
