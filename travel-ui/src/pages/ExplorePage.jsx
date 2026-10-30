import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/SearchRounded";
import { provinces, matchesProvince, coverForProvince, ADMIN_SOURCE } from "../tourism/catalog";
import { ExperienceGrid, GuideHero, ProvinceCard, GuideEmpty } from "../tourism/ExploreComponents";
import "./ExplorePage.css";

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const region = params.get("region") || "";
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => provinces.filter((province) => matchesProvince(province, query) && (!region || province.region === region)).sort((a, b) => a.name.localeCompare(b.name, "vi")), [query, region]);
  const pageCount = Math.ceil(filtered.length / 12);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true }); setPage(0);
  }
  return <div className="explore-page">
    <GuideHero eyebrow="KHÁM PHÁ VIỆT NAM" title={<>34 miền đất.<br />Vô vàn câu chuyện.</>} description="Tìm điểm đến, hiểu tên gọi mới và khám phá những trải nghiệm văn hóa, ẩm thực, thiên nhiên trên khắp Việt Nam." photo={coverForProvince("quang-ninh")} />
    <ExperienceGrid />
    <section className="tour-container guide-directory" aria-labelledby="explore-title">
      <div className="guide-directory-heading"><div><p className="tour-kicker">34 TỈNH, THÀNH PHỐ HIỆN HÀNH</p><h2 id="explore-title">Bạn muốn bắt đầu từ đâu?</h2><p>Tìm bằng tên tỉnh, thành phố hiện nay hoặc tên trước sắp xếp. Mỗi thẻ mở ra các địa danh, câu chuyện và gợi ý trải nghiệm của vùng đất ấy.</p></div><label className="explore-search"><span className="explore-search-label">Tìm tỉnh, thành phố hoặc tên cũ</span><div><SearchIcon aria-hidden="true" /><input type="search" value={query} onChange={(event) => update("q", event.target.value)} placeholder="Ví dụ: Quảng Nam → Đà Nẵng…" /></div></label></div>
      <div className="guide-filter-chips" role="group" aria-label="Lọc vùng miền">{["", "Bắc Bộ", "Trung Bộ & Tây Nguyên", "Nam Bộ"].map((value) => <button key={value} className={region === value ? "is-active" : ""} aria-pressed={region === value} onClick={() => update("region", value)}>{value || "Tất cả vùng miền"}</button>)}</div>
      <p className="explore-count" role="status" aria-live="polite">{filtered.length} tỉnh, thành phố phù hợp · Danh mục gồm 28 tỉnh và 6 thành phố trực thuộc trung ương</p>
      {!filtered.length ? <GuideEmpty onClear={() => { setParams({}); setPage(0); }} /> : <div className="guide-province-grid">{filtered.slice(currentPage * 12, currentPage * 12 + 12).map((province) => <ProvinceCard key={province.id} province={province} />)}</div>}
      {pageCount > 1 && <nav className="explore-pagination" aria-label="Trang danh sách tỉnh thành"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Trang trước</button><span>Trang {currentPage + 1} / {pageCount}</span><button disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Trang tiếp →</button></nav>}
      <details className="guide-sources"><summary>Tra cứu 34 tỉnh/thành và các tên trước sắp xếp</summary><p>Theo Nghị quyết 202/2025/QH15, chính quyền địa phương sau sắp xếp hoạt động từ 01/07/2025. Huế là thành phố trực thuộc trung ương được thành lập trên cơ sở tỉnh Thừa Thiên Huế và không hợp nhất trong đợt này. Các tên cũ được giữ để tra cứu địa điểm và đối chiếu dữ liệu lịch sử.</p><a href={ADMIN_SOURCE} target="_blank" rel="noreferrer">Xem nghị quyết trên Cổng thông tin Chính phủ ↗</a><div className="guide-admin-table"><table><caption>Danh mục tỉnh/thành hiện hành và địa phương cấu thành trước sắp xếp</caption><thead><tr><th scope="col">Hiện hành</th><th scope="col">Trước sắp xếp</th></tr></thead><tbody>{provinces.map((province) => <tr key={province.id}><th scope="row">{province.name}</th><td>{province.former.join(" · ")}{province.id === "hue" ? " (đổi tên, không hợp nhất năm 2025)" : province.former.length === 1 ? " (không hợp nhất năm 2025)" : ""}</td></tr>)}</tbody></table></div></details>
    </section>
  </div>;
}
