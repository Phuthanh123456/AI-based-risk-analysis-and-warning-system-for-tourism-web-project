import { useExpandedViewer } from "./useExpandedViewer";
import { TRIP_PURPOSES } from "../components/tripPurposeConfig";
import DestinationViewer from "./DestinationViewer";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, useReducedMotion, useScroll, useTransform, useSpring } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForwardRounded";
import ArrowDown from "@mui/icons-material/KeyboardArrowDownRounded";
import Check from "@mui/icons-material/CheckCircleRounded";
import Cloud from "@mui/icons-material/WbCloudyOutlined";
import Route from "@mui/icons-material/RouteOutlined";
import DiscoveryDeck from "../pages/DiscoveryDeck";
import Explore from "@mui/icons-material/ExploreOutlined";
import { useTranslate } from "../i18n/index.js";
import { SiteHeader, SiteFooter, Reveal, TravelImage } from "../tourism/SiteChrome";
import { ExperienceGrid } from "../tourism/ExploreComponents";
import "./LandingPage.css";
import JourneyLandscape from "./JourneyLandscape";
import WorldExplorer from "./WorldExplorer";

const art = "/images/landing/";
const chapters = ["Hành trình", "Tìm hiểu", "Thời tiết", "Đánh giá chuyến đi", "Khám phá Việt Nam", "Hành trình của bạn"];
const scenes = ["halong.webp", "hoian.webp", "halong-karsts.webp", "saigon-bridge.webp", "hanoi.webp", "saigon-sunset.webp"];
const destinations = [
  ["Hà Nội", "hanoi.webp", "/explore/ha-noi", "Văn hóa & cuộc sống"],
  ["Hội An", "hoian.webp", "/explore/da-nang/hoi-an", "Dấu ấn di sản"],
  ["Hạ Long", "halong.webp", "/explore/quang-ninh/ha-long", "Thiên nhiên rộng mở"],
  ["Hồ Chí Minh", "saigon-bridge.webp", "/explore/ho-chi-minh", "Nhịp sống đô thị"],
];

function SceneLayer({ src, index, progress, reduced, active }) {
  const opacity = useTransform(progress, [Math.max(0, (index - .6) / 5), index / 5, Math.min(1, (index + 1) / 5)], index === 0 ? [1, 1, 0] : index === 5 ? [0, 1, 1] : [0, 1, 0]);
  return <Motion.img src={art + src} alt="" draggable="false" fetchPriority={index === 0 ? "high" : "auto"} style={{ opacity: reduced ? index === active ? 1 : 0 : opacity }} />;
}

export function LandingPage({ onGoToLogin, signedIn = false, travel, themeMode, toggleTheme, logout }) {
  const t = useTranslate();
  const story = useRef(null);
  const preview = useRef(null);
  const [postcardHost,setPostcardHost] = useState(null);
  const fullscreen = useExpandedViewer(preview);
  const [place, setPlace] = useState(null);
  function openPlace(item) {
    setPlace(item);
    preview.current.showModal();
  }
  function moveCamera(event) {
    if (reduced || event.pointerType !== "mouse") return;
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    story.current.style.setProperty("--camera-x", x * 38 + "px");
    story.current.style.setProperty("--camera-y", y * 24 + "px");
  }
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [weatherDemo, setWeatherDemo] = useState("rain");
  function selectWeather(value) {
    setWeatherDemo(value);
  }
  const { scrollYProgress } = useScroll({ target: story, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 30 });
  const zoom = useTransform(smooth, [0, 1], [1.02, 1.12]);
  const drift = useTransform(smooth, [0, 1], ["0%", "-4%"]);
  function goChapter(index) {
    document.getElementById("journey-chapter-" + index)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
    setActive(index);
  }
  function chapterKeys(event) {
    const index = Number(event.target.closest("button")?.dataset.index);
    if (!Number.isInteger(index)) return;
    const next = {ArrowDown: Math.min(index + 1, chapters.length - 1),
      ArrowUp: Math.max(index - 1, 0), Home: 0, End: chapters.length - 1}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    event.currentTarget.querySelectorAll("button")[next].focus({preventScroll:true});
    goChapter(next);
  }
  const start = (route = "/plan") => onGoToLogin(route);
  const faq = [
    ["Tôi bắt đầu như thế nào?", "Chọn điểm xuất phát, điểm đến, ngày đi và mục đích chuyến đi. Hệ thống tổng hợp thời tiết, tuyến đường và tin địa phương để bạn cân nhắc."],
    ["Kết quả đánh giá cho biết điều gì?", "Bạn nhận được gợi ý nên đi, cần lưu ý trước khi đi hoặc không nên đi, kèm các yếu tố đang ảnh hưởng. Bạn luôn là người quyết định hành trình."],
    ["Có thể xem dự báo cho ngày khác không?", "Bạn có thể chọn hôm nay và 7 ngày tiếp theo. Dự báo phụ thuộc vào dữ liệu có thật của nguồn cung cấp cho ngày bạn chọn."],
    ["Tôi có xem riêng từng yếu tố được không?", "Có. Từ kết quả tổng quan, bạn có thể mở trang thời tiết, bản đồ tuyến đường và tin tức để xem thông tin chi tiết cùng nguồn dữ liệu."],
    ["Thông tin có được cập nhật không?", "Thời tiết và tin mới được tra cứu từ nguồn bên ngoài. Hãy xem thời điểm dữ liệu và kiểm tra lại gần giờ khởi hành; điều kiện thực tế có thể thay đổi."],
  ];
  return <div className="tour-site guardian-home">
    <a className="tour-skip" href="#home-main">{t("Đi đến nội dung")}</a>
    <SiteHeader overlay signedIn={signedIn} onLogin={onGoToLogin} themeMode={themeMode} toggleTheme={toggleTheme} logout={logout} />
    <main id="home-main">
      <div className="guardian-story" ref={story} onPointerMove={moveCamera} id="how-it-works">
        <div className="guardian-scene" aria-hidden="true"><Motion.div className="guardian-scene-images" style={{ scale: reduced ? 1 : zoom, y: reduced ? 0 : drift }}>{scenes.map((src, i) => <SceneLayer key={src} src={src} index={i} progress={smooth} reduced={reduced} active={active} />)}</Motion.div><JourneyLandscape /><div className="guardian-scene-veil" /><div className="guardian-pollen">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</div></div>
        <div className="scene-caption">{t("Phong cảnh và thời tiết minh họa")}</div>
        <nav className="guardian-chapter-nav" data-active={active} onKeyDown={chapterKeys} aria-label={t("Cách hoạt động")}>{chapters.map((name, i) => <button key={name} data-index={i} onClick={() => goChapter(i)} aria-label={t(name)} aria-current={active === i ? "step" : undefined}><span>{t(name)}</span><i /></button>)}</nav>
        <Motion.section id="journey-chapter-0" className="guardian-chapter guardian-opening" onViewportEnter={() => setActive(0)} viewport={{ amount: .5 }}>
          <div className="guardian-copy"><Reveal><p className="guardian-eyebrow">VIETNAM · TRAVEL RISK</p><h1>{t("Hành trình Việt Nam")}<br /><em>{t("vừa với bạn.")}</em></h1><p className="guardian-lead">{t("Chọn một nơi bạn muốn đến. Hiểu thời tiết, xem đường đi và theo dõi tin địa phương để tự tin hơn trước mỗi hành trình.")}</p><div className="guardian-actions"><button className="tour-button tour-button-blue" onClick={() => start()}>{t("Lên hành trình của bạn")}<ArrowForward /></button><button className="guardian-text-action" onClick={() => goChapter(1)}>{t("Xem cách hoạt động")}<ArrowDown /></button></div><WorldExplorer postcardHost={postcardHost} story={story} progress={smooth} weather={weatherDemo} reduced={reduced} travel={travel} /><div className="guardian-trust">{["34 tỉnh, thành phố", "Thông tin có nguồn", "Bạn tự quyết định"].map(label => <span key={label}><Check aria-hidden="true" />{t(label)}</span>)}</div></Reveal></div>
          <div className="world-hero-postcards" ref={setPostcardHost} /><div className="opening-footer"><small className="mobile-scene-caption">{t("Phong cảnh và thời tiết minh họa")}</small><button className="guardian-scroll" onClick={() => goChapter(1)}><ArrowDown />{t("Cuộn xuống để xem cách hoạt động")}</button></div>
        </Motion.section>
        <Motion.section id="journey-chapter-1" className="guardian-chapter" onViewportEnter={() => setActive(1)} viewport={{ amount: .5 }}><div className="guardian-copy"><Reveal><p className="guardian-eyebrow">01 · {t("TÌM HIỂU")}</p><h2>{t("Chuyến này,")}<br />{t("bạn muốn đi thế nào?")}</h2><p>{t("Một cuộc hẹn, chuyến đi gia đình hay hành trình phiêu lưu. Bắt đầu từ điều bạn muốn, rồi xem những lưu ý phù hợp.")}</p><div className="guardian-purpose-grid">{[["Hẹn hò", "hoian-lanterns.webp"], ["Gia đình", "halong.webp"], ["Phiêu lưu", "halong-karsts.webp"], ["Một mình", "hanoi.webp"]].map(([name, image]) => <button key={name} onClick={() => onGoToLogin("/plan", undefined, TRIP_PURPOSES.find(p => p.label === name)?.key)}><TravelImage src={"/images/landing/" + image} eager alt="" /><span>{t(name)}<ArrowForward /></span></button>)}</div><button className="guardian-text-action" onClick={() => start()}>{t("Bắt đầu với chuyến đi của bạn")}<ArrowForward /></button></Reveal></div></Motion.section>
        <Motion.section id="journey-chapter-2" className="guardian-chapter" onViewportEnter={() => setActive(2)} viewport={{ amount: .5 }}><div className="guardian-copy"><Reveal>
          <p className="guardian-eyebrow">{t("Thời tiết & không khí")}</p>
          <h2>{t("Điều gì có thể ảnh hưởng đến chuyến đi?")}</h2>
          <p>{t("Dự báo tại điểm đến, tuyến đường và các bản tin địa phương giúp bạn chuẩn bị cho ngày khởi hành.")}</p>
          {!reduced && <fieldset className="weather-demo"><legend>{t("Thời tiết minh họa")}</legend>
            {[["clear","Trời quang"],["rain","Mưa"],["storm","Mưa lớn"],["night","Ban đêm"]].map(([value,label]) => <button type="button" key={value} aria-pressed={weatherDemo === value} onClick={()=>selectWeather(value)}>{t(label)}</button>)}
          </fieldset>}
          <div className="guardian-feature-preview scene-analysis"><Cloud /><div><h3>{t("Cách đánh giá thời tiết")}</h3>
          <ol>{["Lấy dự báo theo tọa độ", "Phân tích mưa, gió và tầm nhìn", "Tính mức rủi ro cho ngày đi"].map(step => <li key={step}>{t(step)}</li>)}</ol></div></div>
          <button className="tour-button tour-button-blue" onClick={() => start("/weather")}>{t("Xem thời tiết")}<ArrowForward /></button>
        </Reveal></div><button className="guardian-scroll" onClick={() => goChapter(3)}><ArrowDown />{t("Chương tiếp theo")}</button></Motion.section>
        <Motion.section id="journey-chapter-3" className="guardian-chapter" onViewportEnter={() => setActive(3)} viewport={{ amount: .5 }}><div className="guardian-copy"><Reveal>
          <p className="guardian-eyebrow">{t("Đánh giá chuyến đi")}</p><h2>{t("Giữ lịch hay đổi ngày?")}</h2>
          <p>{t("Ví dụ minh họa: khi dự báo có mưa lớn và tuyến đường đi qua vùng chịu ảnh hưởng, bạn có thể cân nhắc đổi giờ khởi hành.")}</p>
          <div className="guardian-feature-preview"><Route /><div><h3>{t("Ba mức khuyến nghị")}</h3><div className="scenario-levels">{["Nên đi","Cần lưu ý trước khi đi","Không nên đi"].map(label => <span key={label}>{t(label)}</span>)}</div></div></div>
          <button className="tour-button tour-button-blue" onClick={() => start()}>{t("Kiểm tra chuyến đi")}<ArrowForward /></button>
        </Reveal></div><button className="guardian-scroll" onClick={() => goChapter(4)}><ArrowDown />{t("Chương tiếp theo")}</button></Motion.section>
        <Motion.section id="journey-chapter-4" className="guardian-chapter" onViewportEnter={() => setActive(4)} viewport={{ amount: .5 }}><div className="guardian-copy"><Reveal>
          <p className="guardian-eyebrow">{t("Khám phá Việt Nam")}</p><h2>{t("Chọn một góc nhìn khác.")}</h2>
          <p>{t("Ghé phố cổ, dạo ven hồ hay đến vùng vịnh. Chọn một ảnh để khám phá sa bàn và thông tin về điểm đến.")}</p>
          <div className="scene-postcards">{destinations.slice(0,3).map(item => <button key={item[0]} aria-haspopup="dialog" onClick={() => openPlace(item)}><img loading="lazy" src={art+item[1]} alt="" /><strong>{t(item[0])}</strong></button>)}</div>
        </Reveal></div><button className="guardian-scroll" onClick={() => goChapter(5)}><ArrowDown />{t("Chương tiếp theo")}</button></Motion.section>
        <Motion.section id="journey-chapter-5" className="guardian-chapter" onViewportEnter={() => setActive(5)} viewport={{amount:.5}}><div className="guardian-copy"><Reveal><p className="guardian-eyebrow">05 · VIETNAM TRAVEL RISK</p><h2>{t("Sẵn sàng lên đường?")}</h2><p>{t("Chọn ngày và điểm đến để xem thời tiết, tuyến đường và tin địa phương cho hành trình của bạn.")}</p><button className="tour-button tour-button-blue" onClick={()=>start()}>{t("Kiểm tra chuyến đi")}<ArrowForward /></button></Reveal></div></Motion.section>
      </div>
      <dialog ref={preview} data-expanded={fullscreen.expanded} onClose={() => setPlace(null)} className="guardian-place-dialog cinematic-dialog" aria-labelledby="place-preview-title" onClick={event => { if (event.target === event.currentTarget) preview.current.close(); }}>
        {place && <article key={place[2]}>
          <DestinationViewer name={place[0]} photo={"/images/landing/"+place[1]} expanded={fullscreen.expanded} toggle={fullscreen.toggle} />
          <button autoFocus className="guardian-dismiss" aria-label={t("Đóng")} onClick={() => preview.current.close()}>&times;</button>
          <div><small>{t(place[3])}</small><h2 id="place-preview-title">{t(place[0])}</h2>
          <Link className="tour-button tour-button-blue" to={place[2]}>{t("Kh\u00e1m ph\u00e1")} <ArrowForward /></Link></div>
        </article>}
      </dialog>
      <section className="guardian-destinations tour-container" id="home-destinations"><Reveal><p className="guardian-eyebrow">{t("KHÁM PHÁ VIỆT NAM")}</p><div className="guardian-section-heading"><h2>{t("Mỗi nơi,")}<br />{t("một điều đáng nhớ.")}</h2><p>{t("Từ phố xá đến miền di sản, từ biển xanh đến những cung đường. Chọn một nơi để bắt đầu câu chuyện của bạn.")}</p></div></Reveal><div className="guardian-destination-grid">{destinations.map(([name, img, href, tag], i) => <Reveal key={name} delay={i * .06}><button className="guardian-place-trigger" aria-haspopup="dialog" onClick={() => openPlace([name, img, href, tag])}><TravelImage src={"/images/landing/" + img} alt={t(name)} /><span className="guardian-photo-tag">{t(tag)}</span><div><h3>{t(name)}</h3><span className="guardian-card-arrow"><ArrowForward /></span></div></button></Reveal>)}</div><Link className="guardian-text-action" to="/explore">{t("Khám phá 34 tỉnh, thành phố")}<ArrowForward /></Link></section>
      <DiscoveryDeck />
      <ExperienceGrid />
      <section className="guardian-faq tour-container" id="quick-questions"><Reveal><p className="guardian-eyebrow">{t("TRƯỚC KHI BẮT ĐẦU")}</p><h2>{t("Hỏi nhanh.")}</h2></Reveal><div>{faq.map(([q, answer], i) => <details key={q} name="guardian-faq" open={i === 0 ? true : undefined}><summary>{t(q)}<span aria-hidden="true">+</span></summary><p>{t(answer)}</p></details>)}</div></section>
      <section className="guardian-final"><Reveal><Explore className="guardian-final-icon" /><h2>{t("Chuyến đi tiếp theo,")}<br /><em>{t("bắt đầu từ bạn.")}</em></h2><button className="tour-button tour-button-blue" onClick={() => start()}>{t("Lên hành trình của bạn")}<ArrowForward /></button><p>{t("Khám phá · Chuẩn bị · Lên đường")}</p></Reveal></section>
    </main><SiteFooter />
  </div>;
}
