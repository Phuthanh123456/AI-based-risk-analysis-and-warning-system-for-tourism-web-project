import * as T from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {compose} from "./cameraDirector";
import {terrain,elevation,sites,presets,clamp} from "../three/world/terrain";
import {surfaceDetail} from "../three/world/surfaceDetail";
import {settlements} from "../three/world/settlements";
import {vegetation} from "../three/world/habitat";
import {atmosphere} from "../three/world/atmosphere";
import {vietnamAtlas} from "./vietnamAtlas";

export function mountLandscape(host, progress, choices, quality, onMode, onFailure, onFocus){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  const canvas=renderer.domElement,gl=renderer.getContext(),info=gl.getExtension("WEBGL_debug_renderer_info");
  const software=info&&/swiftshader|llvmpipe|software/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  const automatic=software||innerWidth<720||navigator.hardwareConcurrency<=4?"low":innerWidth<1350?"medium":"high";
  const q=presets[quality]||presets[automatic];
  host.dataset.quality=presets[quality]?quality:automatic;
  let dpr=Math.min(devicePixelRatio,q.dpr,software?.75:2);
  renderer.setPixelRatio(dpr);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
  renderer.shadowMap.enabled=!!q.shadow;renderer.shadowMap.type=T.PCFShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(47,1,.18,320);
  const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.10;orbit.minDistance=3.6;orbit.maxDistance=90;
  orbit.minPolarAngle=.16;orbit.maxPolarAngle=Math.PI*.467;orbit.enabled=false;
  const {mat:ground,surface}=terrain(scene,q),town=settlements(scene,surface),forest=vegetation(scene,q,town.occupied),air=atmosphere(scene,q);
  surfaceDetail(scene,q,town.occupied);
  const atlas=vietnamAtlas();atlas.position.set(0,14,-16);scene.add(atlas);
  const bead=new T.Mesh(new T.SphereGeometry(.23,12,8),new T.MeshBasicMaterial());scene.add(bead);
  const ring=new T.Mesh(new T.RingGeometry(1.6,1.85,56),new T.MeshBasicMaterial({transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;scene.add(ring);
  const target=new T.Vector3(),pos=new T.Vector3(),point=new T.Vector3(),offset=new T.Vector3();
  let viewport=host,markers=[],manual=false,mode="cinematic",focus=-1,flight=false,tourTime=0,time=0,frame=0,last=0,shown=false,first=true,slow=0,frames=0;
  compose(progress.get(),0,camera.position,orbit.target);camera.lookAt(orbit.target);
  host.dataset.trees=String(forest.count);
  const locations=sites.map(s=>new T.Vector3(s.x,elevation(s.x,s.z)+1.5,s.z));
  function resize(){const {width,height}=viewport.getBoundingClientRect();if(width&&height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}}
  function setFocus(index){
    focus=index;town.focus(index);flight=true;
    onFocus?.(index);
    target.copy(locations[index]);pos.copy(target).add(offset.set(7.8,6.2,9.2));
  }
  function setMode(next){
    mode=next;orbit.enabled=manual;flight=false;first=false;
    if(next==="forest"||next==="bridge"){
      focus=-1;town.focus(-1);
      if(next==="forest")target.set(-30,surface(-30,-27)+1,-27);
      else target.set(3,2.6,12);
      pos.copy(target).add(next==="forest"?offset.set(8,7,12):offset.set(6,4,7));flight=true;
    }
    if(next==="atlas"){focus=-1;town.focus(-1);target.set(0,14,-16);pos.set(1,52,-4);flight=true;}
    if(next==="tour"){tourTime=0;focus=-1;}
    if(next==="overview"){focus=-1;town.focus(-1);compose(0,time,pos,target);flight=true;}
    if(!manual){town.focus(-1);focus=-1;}
    onMode(next);
  }
  function interrupt(){if(mode==="tour"||flight)setMode("explore");}
  orbit.addEventListener("start",interrupt);
  function draw(now){
    const raw=last?(now-last)/1000:1/60,dt=Math.min(.26,raw);last=now;time+=dt;frames++;
    if(quality==="auto"&&frames>12&&raw>.065)slow++;else slow=Math.max(0,slow-1);
    if(slow>28&&dpr>.66){dpr=Math.max(.66,dpr*.86);renderer.setPixelRatio(dpr);resize();slow=0;}
    const p=clamp(progress.get()),blend=first?1:1-Math.exp(-dt*3.5);
    const chapter=Math.min(5,Math.round(p*5)),preset=manual?choices.current.manual:["sunrise","clear",choices.current.chapter,"fog","goldenHour","sunset"][chapter];
    atlas.visible = manual && mode === "atlas";
    let fov=46;
    if(!manual)fov=compose(p,time,pos,target);
    if(mode==="tour"){
      tourTime+=dt;const index=Math.floor(tourTime/8)%sites.length;
      if(index!==focus)setFocus(index);
      const a=tourTime*.14;pos.copy(target).add(offset.set(12*Math.cos(a),6.4,12*Math.sin(a)));
    }
    if(!manual||flight){
      camera.position.lerp(pos,blend);orbit.target.lerp(target,blend);
      if(mode==="explore"&&camera.position.distanceTo(pos)<.05)flight=false;
    }
    orbit.target.x=clamp(orbit.target.x,-50,50);orbit.target.z=clamp(orbit.target.z,-48,48);
    if(manual)orbit.update();else camera.lookAt(orbit.target);
    camera.position.y=Math.max(camera.position.y,elevation(camera.position.x,camera.position.z)+1.1);
    camera.lookAt(orbit.target);camera.fov=T.MathUtils.lerp(camera.fov,fov,blend);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const env=air.update(preset,time,dt,camera);forest.update(time,env.breeze,camera);town.update(time,dt,env.night);
    ground.userData.cloudClock.value=time;ground.roughness=.92-(["rain","heavyRain","storm"].includes(preset)?.25:0);
    const risk=choices.current.risk;ring.visible=!!risk&&(risk.index>=0||atlas.visible);
    bead.visible=ring.visible&&atlas.visible;
    if(ring.visible){
      if(atlas.visible)ring.position.set(atlas.position.x+(risk.lon-106)*1.68*atlas.scale.x,atlas.position.y+.73*atlas.scale.y,atlas.position.z-(risk.lat-16)*1.75*atlas.scale.z);
      else{ring.position.copy(locations[risk.index]);ring.position.y-=1.05;}
      ring.scale.setScalar((atlas.visible?.37:1.25)*(1+.09*Math.sin(time*2)));
      ring.material.color.set(({GO:"#35975a",CAUTION:"#eba647",DONT_GO:"#dc614e"})[risk.decision]);bead.position.copy(ring.position);bead.position.y+=.27;bead.material.color.copy(ring.material.color);}
    if(manual)locations.forEach((v,i)=>{
      const el=markers[i];if(!el)return;point.copy(v);point.y+=2.1;point.project(camera);
      el.hidden=mode==="atlas"||point.z>1||point.z<0||Math.abs(point.x)>1.05||Math.abs(point.y)>1;
      el.style.left=(50+point.x*50)+"%";el.style.top=(50-point.y*50)+"%";el.dataset.focus=String(focus===i);
    });
    renderer.render(scene,camera);first=false;host.dataset.ready="true";frame=requestAnimationFrame(draw);
  }
  function sync(){cancelAnimationFrame(frame);last=0;if((shown||manual)&&!document.hidden&&!gl.isContextLost())frame=requestAnimationFrame(draw);}
  const visibility=new IntersectionObserver(([entry])=>{shown=entry.isIntersecting;sync();});
  visibility.observe(host);const size=new ResizeObserver(resize);size.observe(host);
  host.appendChild(canvas);resize();document.addEventListener("visibilitychange",sync);
  function lost(e){e.preventDefault();cancelAnimationFrame(frame);delete host.dataset.ready;onFailure();}
  canvas.addEventListener("webglcontextlost",lost);
  return {attach(element,pins=[]){
    size.unobserve(viewport);viewport=element||host;manual=!!element;markers=pins;
    viewport.prepend(canvas);size.observe(viewport);setMode(manual?"overview":"cinematic");resize();sync();
  }, setMode,focus(i){setMode("explore");setFocus(i);},step(action){
    interrupt();point.copy(camera.position).sub(orbit.target);
    if(action==="in"||action==="out")point.multiplyScalar(clamp(point.length()*(action==="in"?.78:1.29),orbit.minDistance,orbit.maxDistance)/point.length());
    else if(action==="up"||action==="down"){
      const spherical=new T.Spherical().setFromVector3(point);
      spherical.phi=clamp(spherical.phi+(action==="up"?-.16:.16),orbit.minPolarAngle,orbit.maxPolarAngle);point.setFromSpherical(spherical);
    }else if(action.startsWith("pan")){
      offset.setFromMatrixColumn(camera.matrixWorld,0);offset.y=0;offset.normalize();
      if(action==="panUp"||action==="panDown")offset.applyAxisAngle(new T.Vector3(0,1,0),Math.PI/2);
      offset.multiplyScalar((action==="panLeft"||action==="panDown"?-1:1)*point.length()*.08);orbit.target.add(offset);
    }else point.applyAxisAngle(offset.set(0,1,0),action==="left"?-.28:.28);
    camera.position.copy(orbit.target).add(point);orbit.update();
  },dispose(){cancelAnimationFrame(frame);size.disconnect();visibility.disconnect();document.removeEventListener("visibilitychange",sync);canvas.removeEventListener("webglcontextlost",lost);
    orbit.dispose();forest.dispose();const resources=new Set();
    scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of [].concat(o.material||[])){resources.add(m);for(const t of Object.values(m))if(t?.isTexture)resources.add(t);}if(o.isInstancedMesh)o.dispose();if(o.shadow)o.shadow.dispose();});
    resources.forEach(r=>r.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove();delete host.dataset.ready;
  }};
}
