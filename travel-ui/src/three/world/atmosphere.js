import * as T from "three";
import {noise,randomStream,riverX,riverWidth} from "./terrain";

const skies={
  sunrise:["#91afc1","#ddd1b8","#ffdfaf",2.25,.008,.24,0],
  clear:["#719dc1","#deebdf","#fff0cc",2.6,.008,.12,0],
  goldenHour:["#8da5b1","#e9ba91","#ffc47d",2.25,.010,.18,0],
  sunset:["#8789a3","#e4a299","#ffb588",1.65,.016,.36,.18],
  blueHour:["#485a80","#a7a0b0","#c8cdfb",.82,.018,.32,.56],
  night:["#17233d","#43516b","#accbf4",.43,.019,.23,1],
  cloud:["#83939f","#cad3cf","#e8e6d7",1.47,.014,.77,0],
  wind:["#78a6b4","#cbd9d0","#fff2d6",1.95,.012,.55,0],
  fog:["#a2afb6","#c8d1c9","#f3e5ce",1.35,.031,.81,0],
  rain:["#667d8e","#a2b5b9","#d6dedb",1.13,.021,.83,0],
  heavyRain:["#465c72","#8a9da4","#c3d1d8",.87,.026,.91,.17],
  storm:["#344858","#738690","#bdcad4",.62,.032,.96,.31]
};
function cloudTexture(){
  const size=128,bytes=new Uint8Array(size*size*4);
  for(let j=0;j<size;j++)for(let i=0;i<size;i++){
    const x=(i-64)/61,y=(j-64)/62, density=Math.max(0,1-x*x-y*y);
    const n=.53*noise(i*.059,j*.063)+.3*noise(i*.13+42,j*.13)+.17*noise(i*.27,j*.27);
    const alpha=Math.min(1,Math.max(0,(density*.93+n*.87-.73)*1.7))*density;
    const shade=199+Math.floor(48*n);bytes.set([shade,shade,shade,Math.round(255*alpha)],4*(j*size+i));
  }
  const t=new T.DataTexture(bytes,size,size);t.magFilter=t.minFilter=T.LinearFilter;t.needsUpdate=true;return t;
}
function river(scene){
  const pos=[],idx=[];
  for(let i=0;i<=440;i++){
    const z=-86+i*.38, half=riverWidth(z)+2.2;
    pos.push(riverX(z)-half,.035,z,riverX(z)+half,.035,z);
    const k=i*2;if(i)idx.push(k-2,k,k-1,k-1,k,k+1);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(pos,3));geometry.setIndex(idx);
  const uniforms={clock:{value:0},sky:{value:new T.Color()},haze:{value:0},rain:{value:0}};
  const m=new T.ShaderMaterial({uniforms,side:T.DoubleSide,vertexShader:`
    varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
  `,fragmentShader:`
    varying vec3 p;uniform float clock,haze,rain;uniform vec3 sky;
    void main(){vec3 view=normalize(cameraPosition-p);
      float a=sin(p.x*7.+p.z*2.4-clock*1.7),b=sin(p.z*10.4+p.x*2.3+clock*1.4);
      vec3 n=normalize(vec3(a*.075,1.,b*(.06+rain*.08)));
      float fres=pow(1.-max(0.,dot(view,n)),3.);
      float center=8.*sin(p.z*.048)+3.7*sin(p.z*.106+.7)-3.;
      float halfW=1.9+5.4*exp(-(p.z+11.)*(p.z+11.)/75.);
      float shoal=smoothstep(.70,1.23,abs(p.x-center)/halfW);
      vec3 bed=mix(vec3(.012,.16,.20),vec3(.14,.32,.25),shoal);
      vec3 col=mix(bed,sky,.045+.42*fres)+.018*vec3(a*b);
      col+=vec3(.68,.59,.36)*pow(max(0.,dot(reflect(normalize(vec3(.5,-.37,.21)),n),view)),34.);
      col=mix(col,sky,.54*(1.-exp(-pow(length(cameraPosition-p)*haze,2.))));
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  scene.add(new T.Mesh(geometry,m));return uniforms;
}
export function atmosphere(scene,q){
  const rand=randomStream(731),sun=new T.DirectionalLight(0xffe0af,2.1),ambient=new T.HemisphereLight(0xe4eef2,0x777957,1.37);
  sun.position.set(-40,39,-31);sun.castShadow=!!q.shadow;
  Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,far:155});sun.shadow.mapSize.set(q.shadow||256,q.shadow||256);
  sun.shadow.bias=-.00045;sun.shadow.normalBias=.06;scene.add(sun,ambient);
  scene.fog=new T.FogExp2(0xe1d1bc,.012);
  const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{zenith:{value:new T.Color("#a1b9cf")},horizon:{value:scene.fog.color}},
    vertexShader:`varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 ray;uniform vec3 zenith,horizon;void main(){float t=clamp(normalize(ray).y*1.65,0.,1.);vec3 d=normalize(ray);float sun=max(dot(d,normalize(vec3(-.64,.42,-.62))),0.);
      vec3 sky=mix(horizon,zenith,t)+horizon*(.16*pow(sun,14.)+.30*pow(sun,290.));
      gl_FragColor=vec4(sky,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  const dome=new T.Mesh(new T.SphereGeometry(270,24,12),skyMat);scene.add(dome);
  const tex=cloudTexture(),clouds=[];
  for(let i=0;i<q.clouds*2;i++){
    const layer=i%4===0,mat=new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:true});
    const sprite=new T.Sprite(mat),theta=rand()*Math.PI*2,r=layer?19+rand()*40:57+rand()*57;
    sprite.position.set(r*Math.cos(theta),layer?4+rand()*4:20+rand()*16,r*Math.sin(theta));
    const size=layer?12+rand()*14:12+rand()*23;sprite.scale.set(size,size*(layer?.21:.46),1);scene.add(sprite);clouds.push([sprite,sprite.position.x,layer]);
  }
  const coords=[];
  for(let i=0;i<q.clouds*27;i++){const x=(rand()-.5)*95,y=rand()*46,z=(rand()-.5)*95;coords.push(x,y,z,x-.07,y+.56,z);}
  const rainGeo=new T.BufferGeometry();rainGeo.setAttribute("position",new T.Float32BufferAttribute(coords,3));
  const rainMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{clock:{value:0},alpha:{value:0}},vertexShader:`
    uniform float clock;void main(){vec3 p=position;p.y=mod(p.y-clock*12.,46.);p.x+=p.y*.14;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float alpha;void main(){gl_FragColor=vec4(.77,.83,.88,alpha);}`});
  const rainLines=new T.LineSegments(rainGeo,rainMat);rainLines.frustumCulled=false;scene.add(rainLines);
  const starsGeo=new T.BufferGeometry();const stars=[];
  for(let i=0;i<650;i++){const a=rand()*6.283,h=.1+rand()*.88,r=Math.sqrt(1-h*h);stars.push(198*r*Math.cos(a),198*h,198*r*Math.sin(a));}
  starsGeo.setAttribute("position",new T.Float32BufferAttribute(stars,3));
  const star=new T.Points(starsGeo,new T.PointsMaterial({color:0xf4f8ff,size:.36,transparent:true,depthWrite:false,fog:false}));scene.add(star);
  const wing=new T.BufferGeometry();wing.setAttribute("position",new T.Float32BufferAttribute([-.45,.13,0,0,0,0,-.14,0,.11,0,0,0,.45,.13,0,.14,0,.11],3));
  const flock=new T.Group(),feathers=new T.MeshBasicMaterial({color:0x394442,side:T.DoubleSide});
  for(let i=0;i<12;i++){const b=new T.Mesh(wing,feathers);b.position.set(i*.46,.2*Math.sin(i),Math.abs(i-6)*.47);flock.add(b);}scene.add(flock);
  // Soft forward-scattering strips between ridges. Height and texture breakup mask the ends.
  const shafts=new T.Group();
  if(q.shadow>=2048){
    const geom=new T.PlaneGeometry(1,1);
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{strength:{value:0},phase:{value:0}},
      vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 v;uniform float strength,phase;void main(){
        float spread=.27+.18*(1.-v.y);float band=exp(-((v.x-.5)/spread)*((v.x-.5)/spread));
        float fade=sin(3.14159*v.y)*sin(3.14159*v.x);
        float scatter=.65+.35*cos(13.*v.x+.22*phase+1.3*sin(5.*v.y));
        gl_FragColor=vec4(.99,.88,.64,strength*max(0.,fade)*band*scatter);}`});
    for(let i=0;i<6;i++){const ray=new T.Mesh(geom,material);ray.position.set(-36+i*12,17,-32+i%3*11);
      ray.rotation.set(-.18,.15,-.50);ray.scale.set(5+i%3*2,34,1);shafts.add(ray);}
    scene.add(shafts);
  }
  const water=river(scene),color=new T.Color();
  let night=0,wet=0,cover=.3,drift=0;
  return {update(id,time,dt,camera){
    const [top,horizon,key,power,density,targetCover,targetNight]=skies[id]||skies.clear,k=1-Math.exp(-dt*1.45);
    const damp=(v,target)=>v+(target-v)*k;
    const targetRain=({rain:.35,heavyRain:.64,storm:.78})[id]||0;
    wet=damp(wet,targetRain);night=damp(night,targetNight);cover=damp(cover,targetCover);
    scene.fog.color.lerp(color.set(horizon),k);scene.fog.density=damp(scene.fog.density,density);
    skyMat.uniforms.zenith.value.lerp(color.set(top),k);dome.position.copy(camera.position);
    sun.color.lerp(color.set(key),k);sun.intensity=damp(sun.intensity,power+(id==="storm"?.36*Math.pow(Math.max(0,Math.sin(time*.51)),18):0));
    sun.position.y=damp(sun.position.y,({clear:62,sunrise:25,goldenHour:21,sunset:15,night:46})[id]||44);
    ambient.intensity=damp(ambient.intensity,1.23-night*.81);
    star.material.opacity=night*night;star.visible=night>.15;
    drift+=dt*(id==="wind"||id==="storm"?.095:.024);
    clouds.forEach(([s,x,low],i)=>{s.position.x=x+5*Math.sin(drift+i);s.material.opacity=(low?.32:.83)*cover;
      s.material.color.copy(scene.fog.color).lerp(color.set(0xffffff),.5*(1-wet));});
    rainLines.visible=wet>.014;rainMat.uniforms.clock.value=time;rainMat.uniforms.alpha.value=wet*.59;
    if(shafts.children.length){
      const u=shafts.children[0].material.uniforms;u.phase.value=time;
      u.strength.value=damp(u.strength.value,["sunrise","goldenHour","clear"].includes(id)?.055:0);
      shafts.visible=u.strength.value>.002;
    }
    water.clock.value=time;water.sky.value.copy(scene.fog.color);water.haze.value=density;water.rain.value=wet;
    flock.position.set(9*Math.sin(time*.09),19+Math.sin(time*.17),-19+5*Math.cos(time*.09));
    flock.children.forEach((b,i)=>{b.scale.y=.5+Math.sin(time*3.1+i)*1.6;});flock.visible=wet<.45&&night<.4;
    return {night,breeze:id==="wind"||id==="storm"?1.55:.48+wet};
  }};
}
