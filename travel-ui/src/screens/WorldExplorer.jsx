import {useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {Link} from "react-router-dom";
import {useLanguage,useTranslate} from "../i18n";
import {sites} from "../three/world/locations";
import {buildTripAssessment} from "../portal/tripAssessment";
import "./WorldExplorer.css";

const conditions=[["clear","Trời quang","Clear"],["sunrise","Bình minh","Sunrise"],["goldenHour","Nắng chiều","Golden hour"],["sunset","Hoàng hôn","Sunset"],["blueHour","Chạng vạng","Blue hour"],["night","Ban đêm","Night"],["cloud","Nhiều mây","Cloudy"],["wind","Gió mạnh","Wind"],["fog","Sương mù","Fog"],["rain","Mưa","Rain"],["heavyRain","Mưa lớn","Heavy rain"],["storm","Giông","Storm"]];
const qualities=[["auto","Tự động","Automatic"],["ultra","Rất cao","Ultra"],["high","Cao","High"],["medium","Vừa","Medium"],["low","Thấp","Low"],["photo","Ảnh tĩnh","Photos"]];
function matchTrip(travel){
  const trip=travel?.tripRes,to=trip?.to;
  if(!to||to.lat==null||to.lon==null)return null;
  const index=sites.findIndex(s=>Math.hypot((Number(to.lat)-s.lat)*111,(Number(to.lon)-s.lon)*108)<3);
  const lat=Number(to.lat),lon=Number(to.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<8||lat>24||lon<102||lon>110)return null;
  const a=buildTripAssessment(trip,travel.forecastData,travel.departureDate,travel.forecastLoading);
  if(!a.availableFactors)return null;
  return {index,lat,lon,name:to.name,date:a.assessmentDate,title:a.overallVerdict.title,decision:a.overallVerdict.decision,weather:a.weatherScore};
}
export default function WorldExplorer({postcardHost,story,progress,weather,reduced,travel}){
  const en=useLanguage()==="en",t=useTranslate(),say=(vi,english)=>en?english:vi;
  const dialog=useRef(null),viewport=useRef(null),stage=useRef(null),engine=useRef(null),pins=useRef([]),isOpen=useRef(false);
  const [mode,setMode]=useState("cinematic"),[status,setStatus]=useState("loading"),[quality,setQuality]=useState("auto");
  const [picked,setPicked]=useState(-1),[preset,setPreset]=useState("sunrise"),[expanded,setExpanded]=useState(false);
  const pendingStop=useRef(-1);
  const risk=useMemo(()=>matchTrip(travel),[travel]);
  const choices=useRef({chapter:weather,manual:preset,risk});
  useEffect(()=>{choices.current={chapter:weather,manual:preset,risk};},[weather,preset,risk]);
  const staticMode=quality==="photo"||(reduced&&quality==="auto");
  useEffect(()=>{
    const host=story.current.querySelector(".journey-landscape");
    if(staticMode)return;
    let disposed=false,control=null;
    import("./journeyScene").then(({mountLandscape})=>{
      if(disposed)return;
      control=mountLandscape(host,progress,choices,quality,setMode,()=>setStatus("failed"));
      engine.current=control;
      if(isOpen.current){control.attach(viewport.current,pins.current);if(pendingStop.current>=0)control.focus(pendingStop.current);}
      setStatus("ready");
    }).catch(error=>{if(!disposed){console.warn("Scenic view unavailable",error);setStatus("failed");}});
    return ()=>{disposed=true;engine.current=null;control?.dispose();};
  },[quality,staticMode,progress,story]);
  useEffect(()=>{const handle=()=>setExpanded(!!document.fullscreenElement);document.addEventListener("fullscreenchange",handle);
    return ()=>document.removeEventListener("fullscreenchange",handle);},[]);
  const ready=!staticMode&&status==="ready";
  function open(index=-1){
    dialog.current.showModal();isOpen.current=true;pendingStop.current=index;setPicked(index);if(ready){engine.current?.attach(viewport.current,pins.current);if(index>=0)engine.current?.focus(index);}
  }
  function close(){
    if(document.fullscreenElement===stage.current)document.exitFullscreen().catch(()=>{});
    isOpen.current=false;engine.current?.attach(null);setExpanded(false);setPicked(-1);
  }
  function choose(i){pendingStop.current=i;setPicked(i);if(ready)engine.current?.focus(i);}
  function tour(){setPicked(-1);engine.current?.setMode(mode==="tour"?"explore":"tour");}
  async function fullscreen(){
    if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});
    else if(stage.current.requestFullscreen)try{await stage.current.requestFullscreen();}catch{setExpanded(!expanded);}
    else setExpanded(!expanded);
  }
  function keyCamera(event){
    if(!ready||event.target!==viewport.current)return;
    const moves=event.shiftKey?{ArrowUp:"panUp",ArrowDown:"panDown",ArrowLeft:"panLeft",ArrowRight:"panRight"}:
      {ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right","+":"in","=":"in","-":"out"};
    if(moves[event.key]){event.preventDefault();engine.current?.step(moves[event.key]);}
  }
  const record=risk&&(picked===-2||picked>=0&&picked===risk.index)?risk:null;
  return <><button type="button" className="world-open" onClick={()=>open()} aria-haspopup="dialog"><span aria-hidden="true">⤾</span> {say("Khám phá 360°","Explore in 360°")}</button>
    {postcardHost&&createPortal(sites.map((s,i)=><button key={s.id} className="world-postcard" aria-haspopup="dialog" onClick={()=>open(i)}>
      <img src={"/images/explore/"+s.id+".webp"} alt=""/><span>{s.name} <b aria-hidden="true">↗</b></span></button>),postcardHost)}
    {createPortal(<dialog className="world-dialog" ref={dialog} onClose={close} aria-labelledby="world-title" data-expanded={expanded}>
      <div className="world-stage" ref={stage}>
        <div className="world-viewport" ref={viewport} role="group" tabIndex={ready?0:-1} aria-label={say("Sa bàn. Dùng phím mũi tên để xoay hoặc giữ Shift để di chuyển.","Landscape. Use arrow keys to orbit or hold Shift to pan.")} onKeyDown={keyCamera} style={{backgroundImage:'url(/images/'+(picked>=0?'explore/'+sites[picked].id:'landing/halong-karsts')+'.webp)'}}>
          {sites.map((s,i)=><button key={s.id} ref={e=>{pins.current[i]=e;}} className="world-pin" data-available={ready} aria-label={s.name} onClick={()=>choose(i)}>
            <img src={"/images/explore/"+s.id+".webp"} alt="" /><strong>{s.name}</strong>{risk?.index===i&&<i>{t(risk.title)}</i>}
          </button>)}
        </div>
        <header className="world-head"><div><h2 id="world-title">{say("Miền núi Việt Nam","Vietnamese highlands")}</h2>
          <small>{say("Sa bàn du lịch · Thời tiết minh họa","Travel diorama · Simulated weather")}</small></div>
          <button className="world-exit" onClick={()=>dialog.current.close()}>{say("Về trang chủ","Back to home")} ×</button></header>
        <aside className="world-panel"><h3>{say("Điểm dừng","Destinations")}</h3><div className="world-stops">{sites.map((s,i)=>
          <button key={s.id} aria-pressed={picked===i} onClick={()=>choose(i)}><img src={"/images/explore/"+s.id+".webp"} alt="" />{s.name}</button>)}</div>
          {ready&&<div className="world-scenic-stops">{[["bridge","Cầu qua sông","River bridge"],["forest","Rừng núi","Forest ridge"]].map(([key,vi,eng])=>
            <button key={key} aria-pressed={mode===key} onClick={()=>{setPicked(-1);engine.current?.setMode(key);}}>{say(vi,eng)}</button>)}</div>}
          {picked>=0&&<Link to={sites[picked].path}>{say("Xem cẩm nang","Destination guide")} ↗</Link>}
          {risk&&<button className="world-trip-stop" onClick={()=>{setPicked(-2);engine.current?.setMode("atlas");}}>{say("Chuyến đi đã đánh giá","Assessed trip")}</button>}
          {record&&<p className="world-record">{record.name} · {record.date}<br/>{t(record.title)}{record.weather!=null&&<><br/>{say("Điểm thời tiết","Weather score")} {record.weather}/10</>}</p>}
          <label>{say("Đồ họa","Graphics")}<select value={quality} onChange={e=>{pendingStop.current=-1;setStatus("loading");setQuality(e.target.value);setPicked(-1);}}>
            {qualities.map(([key,vi,eng])=><option key={key} value={key}>{say(vi,eng)}</option>)}</select></label>
          {ready&&<label>{say("Khung cảnh","Conditions")}<select value={preset} onChange={e=>setPreset(e.target.value)}>
            {conditions.map(([key,vi,eng])=><option key={key} value={key}>{say(vi,eng)}</option>)}</select></label>}
        </aside>
        <div className="world-tools">{ready?<><button onClick={tour} aria-pressed={mode==="tour"}>{mode==="tour"?say("Dừng tham quan","Stop tour"):say("Tham quan tự động","Guided tour")}</button>
          {[["left","↶","Xoay trái","Rotate left"],["right","↷","Xoay phải","Rotate right"],["in","+","Phóng to","Zoom in"],["out","−","Thu nhỏ","Zoom out"]].map(([action,glyph,vi,eng])=>
            <button key={action} aria-label={say(vi,eng)} title={say(vi,eng)} onClick={()=>engine.current?.step(action)}>{glyph}</button>)}
          <button onClick={()=>{setPicked(-1);engine.current?.setMode("overview");}}>{say("Toàn cảnh","Overview")}</button></>:<span role="status">{!staticMode&&status==="loading"?say("Đang dựng cảnh…","Loading landscape…"):say("Chế độ ảnh","Photo view")}</span>}
          <button onClick={fullscreen}>{expanded?say("Thu gọn","Exit fullscreen"):say("Toàn màn hình","Fullscreen")}</button>
        </div>
        {ready&&<small className="world-hint">{say("Kéo để xoay · Cuộn để thu phóng · Shift + kéo để di chuyển","Drag to orbit · Scroll to zoom · Shift + drag to pan")}</small>}
      </div></dialog>,document.body)}
  </>;
}
