import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/SearchRounded";
import ArrowForward from "@mui/icons-material/ArrowForwardRounded";
import { apiGet } from "../api";
import { DestinationCard } from "../tourism/SiteChrome";
import "./ExplorePage.css";

function normalized(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase(); }
function provincePhoto(name) {
  const key = normalized(name);
  if (key.includes("ho chi minh")) return ["saigon-bridge.webp", "Cảnh sông và đô thị TP. Hồ Chí Minh"];
  if (key === "ha noi") return ["hanoi.webp", "Cuộc sống đường phố Hà Nội"];
  if (key === "quang ninh") return ["halong.webp", "Vịnh Hạ Long, Quảng Ninh"];
  if (key === "quang nam") return ["hoian.webp", "Đèn lồng Hội An, Quảng Nam"];
  return ["vietnam-skyline.png", "Minh họa cảnh quan Việt Nam"];
}

export default function ExplorePage({ onSelect }) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [points, setPoints] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(0);
  useEffect(() => {
    let alive = true;
    apiGet("/map/points").then((data) => {
      if (alive) { setPoints((data.points || []).filter((point) => typeof point.province === "string")); setStatus("ready"); }
    }).catch((reason) => { if (alive) { setError(reason.message || "Không thể kết nối"); setStatus("error"); } });
    return () => { alive = false; };
  }, [retry]);
  const filtered = useMemo(() => points.filter((point) => normalized(point.province).includes(normalized(query))).sort((a, b) => a.province.localeCompare(b.province, "vi")), [points, query]);
  const pageCount = Math.ceil(filtered.length / 12);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  function search(value) { setParams(value ? { q: value } : {}, { replace: true }); setPage(0); }
  return <div className="explore-page">
    <section className="explore-banner"><img src="/images/landing/halong-karsts.webp" alt="" /><div className="tour-container"><p className="home-eyebrow">KHÁM PHÁ VIỆT NAM</p><h1>Mỗi miền đất,<br />một lời mời khám phá.</h1><p>Tìm tỉnh, thành phố trong dữ liệu hiện có và bắt đầu lên kế hoạch cho hành trình của bạn.</p></div></section>
    <section className="tour-container explore-content" aria-labelledby="explore-title">
      <div className="explore-search-row"><div><p className="tour-kicker">ĐIỂM ĐẾN TRONG HỆ THỐNG</p><h2 id="explore-title">Bạn muốn bắt đầu từ đâu?</h2></div><label className="explore-search"><span className="explore-search-label">Tìm tỉnh, thành phố</span><div><SearchIcon aria-hidden="true" /><input type="search" value={query} onChange={(event) => search(event.target.value)} placeholder="Ví dụ: Hà Nội, Quảng Ninh…" /></div></label></div>
      {status === "loading" && <><p role="status">Đang tải danh sách điểm đến…</p><div className="explore-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div className="explore-skeleton" key={index} />)}</div></>}
      {status === "error" && <div className="explore-state" role="alert"><h3>Chưa tải được điểm đến</h3><p>{error}</p><button className="tour-button tour-button-blue" onClick={() => { setStatus("loading"); setError(""); setRetry((value) => value + 1); }}>Thử lại</button></div>}
      {status === "ready" && <><p className="explore-count" role="status" aria-live="polite">{filtered.length} tỉnh, thành phố phù hợp{query ? " với “" + query + "”" : ""}</p>{!filtered.length ? <div className="explore-state"><h3>Chưa tìm thấy địa điểm phù hợp</h3><p>Thử tên tỉnh khác hoặc xóa từ khóa để xem toàn bộ dữ liệu.</p>{query && <button className="tour-button tour-button-blue" onClick={() => search("")}>Xóa tìm kiếm</button>}</div> : <div className="explore-grid">{filtered.slice(currentPage * 12, currentPage * 12 + 12).map((point) => { const [file, alt] = provincePhoto(point.province); return <DestinationCard key={point.province} place={{ name: point.province, image: "/images/landing/" + file, alt, caption: file === "vietnam-skyline.png" ? "MINH HỌA VIỆT NAM" : "HÌNH ẢNH GỢI CẢM HỨNG", tag: "ĐIỂM ĐẾN VIỆT NAM" }} onSelect={onSelect} />; })}</div>}
      {pageCount > 1 && <nav className="explore-pagination" aria-label="Trang danh sách điểm đến"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Trang trước</button><span>Trang {currentPage + 1} / {pageCount}</span><button disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Trang tiếp <ArrowForward fontSize="small" /></button></nav>}
      <p className="explore-note">Danh sách lấy từ dữ liệu tỉnh/thành của dự án qua /map/points. Hình ảnh mang tính biên tập hoặc minh họa, không thể hiện tình trạng rủi ro tại thời điểm hiện tại.</p></>}
    </section>
  </div>;
}
