import { useExpandedViewer } from "../screens/useExpandedViewer";
import "./ExplorePage.css";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslate } from "../i18n/index.js";
import { categories, places, photoFor, placePath } from "../tourism/catalog";

const stops = categories.map(category => places.find(place => place.id === category.cover)).filter(Boolean);

export default function DiscoveryDeck() {
  const t = useTranslate();
  const dialog = useRef(null);
  const { expanded, toggle } = useExpandedViewer(dialog);
  const [index, setIndex] = useState(0);
  const drag=useRef(null),wheel=useRef(0);
  const selected = stops[index];
  function advance(step) { setIndex(current => (current + step + stops.length) % stops.length); }
  return <section className="discovery-deck tour-container">
    <h2>{t("Khám phá")}</h2>
    <div className="discovery-strip">{stops.map((place, i) => <button key={place.id} aria-haspopup="dialog" onClick={() => { setIndex(i); dialog.current.showModal(); }}>
      <img src={photoFor(place).image} alt={t(photoFor(place).subject)} /><strong>{t(place.name)}</strong>
    </button>)}</div>
    <dialog ref={dialog} data-expanded={expanded} className="discovery-viewer" aria-labelledby="discovery-title" onKeyDown={e => { if (["ArrowRight","ArrowLeft"].includes(e.key)) { e.preventDefault(); advance(e.key === "ArrowRight" ? 1 : -1); } }} onClick={e => {if(e.target === dialog.current) dialog.current.close();}}>
      <div className="deck-stage"><div className="discovery-stack" onPointerDown={e=>{drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerCancel={()=>{drag.current=null;}} onPointerUp={e=>{if(drag.current!==null && Math.abs(e.clientX-drag.current)>36)advance(e.clientX<drag.current?1:-1);drag.current=null;}} onWheel={e=>{const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(delta)>6 && Date.now()-wheel.current>400){advance(Math.sign(delta));wheel.current=Date.now();}}}>{[-1,0,1].map(offset => {
        const place = stops[(index + offset + stops.length) % stops.length];
        return <img draggable="false" key={place.id} data-position={offset} src={photoFor(place).image} alt={offset ? "" : t(photoFor(place).subject)} />;
      })}</div>
      <article><small aria-live="polite">{index + 1} / {stops.length}</small>
        <button className="deck-screen" aria-pressed={expanded} onClick={toggle}>{t(expanded ? "Thu nhỏ" : "Toàn màn hình")}</button><button className="deck-close" aria-label={t("Đóng")} onClick={() => dialog.current.close()}>×</button>
        <h2 id="discovery-title">{t(selected.name)}</h2><p>{t(selected.description)}</p>
        <div><button aria-label={t("Trang trước")} onClick={() => advance(-1)}>←</button>
        <Link to={placePath(selected)}>{t("Khám phá")} →</Link>
        <button aria-label={t("Trang tiếp →")} onClick={() => advance(1)}>→</button></div>
      </article></div>
    </dialog>
  </section>;
}
