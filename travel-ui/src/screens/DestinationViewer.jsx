import {useEffect,useRef,useState} from "react";
import {useLanguage} from "../i18n/index.js";

export default function DestinationViewer({name,photo,expanded,toggle}) {
  const el=useRef(null), controller=useRef(null);
  const [ready,setReady]=useState(false),[detail,setDetail]=useState(0);
  const lang=useLanguage();
  useEffect(()=>{
    let cancelled=false;
    Promise.all([import("three"),import("three/addons/controls/OrbitControls.js"),import("./miniatures.js")]).then(([T,{OrbitControls},{miniature,disposeScene,landmarks}])=>{
      if(cancelled||!el.current)return;
      const mount=el.current;
      const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
      const scene=new T.Scene(), camera=new T.PerspectiveCamera(40,1,.1,100);
      scene.add(miniature(name),new T.HemisphereLight(0xfff0d9,0x779083,2));
      const sun=new T.DirectionalLight(0xffdfa7,2.4);sun.position.set(4,9,5);scene.add(sun);
      const controls=new OrbitControls(camera,renderer.domElement);
      controls.minDistance=5;controls.maxDistance=30;controls.maxPolarAngle=Math.PI*.48;
      const draw=()=>renderer.render(scene,camera);
      const focus=i=>{camera.position.set(i?6:9,i?4.8:8,i?6:12);controls.target.set(0,i?1.6:.55,0);controls.update();draw();};
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
      mount.append(renderer.domElement);
      const resize=()=>{const {width,height}=mount.getBoundingClientRect();if(width&&height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();}};
      const observer=new ResizeObserver(resize);observer.observe(mount);
      controls.addEventListener("change",draw);resize();focus(0);setReady(true);
      function keyboard(event) {
        const keys = ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","=","-"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const offset = camera.position.clone().sub(controls.target);
        const orbit = new T.Spherical().setFromVector3(offset);
        if (event.key === "ArrowLeft") orbit.theta -= .16;
        if (event.key === "ArrowRight") orbit.theta += .16;
        if (event.key === "ArrowUp") orbit.phi = Math.max(.12, orbit.phi-.12);
        if (event.key === "ArrowDown") orbit.phi = Math.min(controls.maxPolarAngle, orbit.phi+.12);
        if (event.key === "+" || event.key === "=") orbit.radius = Math.max(controls.minDistance, orbit.radius*.85);
        if (event.key === "-") orbit.radius = Math.min(controls.maxDistance, orbit.radius*1.15);
        camera.position.setFromSpherical(orbit).add(controls.target);
        controls.update();
      }
      mount.addEventListener("keydown", keyboard);
      controller.current={focus,labels:landmarks[name]?.[lang]||[],close:()=>{mount.removeEventListener("keydown",keyboard);observer.disconnect();controls.dispose();disposeScene(scene);renderer.forceContextLoss();renderer.dispose();renderer.domElement.remove();}};
    }).catch(()=>{if (!cancelled) setReady(false);});
    return ()=>{cancelled=true;controller.current?.close();controller.current=null;};
  },[name,lang]);
  const vi=lang==="vi";
  return <section className="miniature-view"><div className="miniature-stage" ref={el} style={{backgroundImage:ready?"none":`url(${photo})`}} role="group" tabIndex={ready?0:undefined} aria-label={name + (ready ? (vi ? ". Dùng phím mũi tên để xoay, cộng trừ để thu phóng." : ". Use arrow keys to rotate, plus and minus to zoom.") : "")}/><div className="miniature-controls"><strong>{vi?"Sa bàn minh họa":"Illustrative miniature"} · {name}</strong>
  {ready&&<><button onClick={()=>{const n=1-detail;setDetail(n);controller.current?.focus(n);}}>{controller.current?.labels?.[1-detail]} →</button><button onClick={()=>{setDetail(0);controller.current?.focus(0);}}>{vi?"Đặt lại góc nhìn":"Reset view"}</button></>}
  <button aria-pressed={expanded} onClick={toggle}>{vi ? (expanded ? "Thu nhỏ" : "Toàn màn hình") : (expanded ? "Exit fullscreen" : "Fullscreen")}</button></div></section>;
}
