import * as T from "three";
import {houseFinish} from "./surfaceDetail";
import {elevation, riverX, riverWidth, sites, randomStream} from "./terrain";

const vec=(x,y,z)=>new T.Vector3(x,y,z);
export function settlements(scene, groundHeight=elevation) {
  const rand=randomStream(2026), ob=new T.Object3D(), tint=new T.Color();
  const groups=new Map(), occupiedCells=new Set();
  const cell=(x,z)=>Math.floor(x)+","+Math.floor(z);
  function reserve(x,z,r) {
    for(let i=Math.floor(x-r);i<=x+r;i++)for(let j=Math.floor(z-r);j<=z+r;j++)occupiedCells.add(cell(i,j));
  }
  function piece(type,color,x,y,z,a,b,c,angle=0,tilt=0) {
    ob.position.set(x,y,z);ob.rotation.set(0,angle,0);ob.rotateX(tilt);ob.scale.set(a,b,c);ob.updateMatrix();
    if(!groups.has(type))groups.set(type,[]);
    groups.get(type).push([ob.matrix.clone(),color]);
  }
  const roadPaths=[], baseRoad=new T.MeshStandardMaterial({color:0x68635a,roughness:.96,side:T.DoubleSide});
  const shoulder=new T.MeshStandardMaterial({color:0xaf9d7d,side:T.DoubleSide});
  function road(points,width,bridge=false) {
    const spline=new T.CatmullRomCurve3(points.map(([x,z])=>vec(x,0,z)));
    const samples=spline.getSpacedPoints(Math.ceil(spline.getLength()*5));
    const crossing=riverX(12);
    function level(x,z) {
      const ground=groundHeight(x,z);
      if(!bridge)return ground;
      const span=riverWidth(12)+3.9, blend=1-T.MathUtils.smoothstep(Math.abs(x-crossing),span,span+2);
      return ground+blend*Math.max(0,2.15-ground);
    }
    const center=samples.map(p=>vec(p.x,level(p.x,p.z)+.13,p.z));
    function ribbon(w,offset,mat) {
      const pos=[],idx=[];
      center.forEach((p,i)=>{
        const tangent=center[Math.min(i+1,center.length-1)].clone().sub(center[Math.max(0,i-1)]);
        const n=vec(-tangent.z,0,tangent.x).normalize().multiplyScalar(w/2);
        for(const s of [-1,-.5,0,.5,1]){const x=p.x+n.x*s,z=p.z+n.z*s;pos.push(x,level(x,z)+offset,z);}
        if(i)for(let j=0;j<4;j++){const k=i*5+j;idx.push(k-5,k,k-4,k-4,k,k+1);}
      });
      const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
      const m=new T.Mesh(g,mat);m.receiveShadow=true;scene.add(m);return m;
    }
    ribbon(width+.22,.07,shoulder);ribbon(width,.11,baseRoad);
    center.forEach((p,i)=>{if(i%3===0)reserve(p.x,p.z,width*.55);});
    const curve=new T.CatmullRomCurve3(center);roadPaths.push(curve);
    if(bridge)for(let x=crossing-4.6;x<=crossing+4.6;x+=.65)for(const side of [-1,1]){
      piece("beam",0x837057,x,2.42,12+side*.63,.10,.65,.10);
      piece("beam",0xb0a187,x,2.67,12+side*.63,.70,.09,.09);
      if(Math.abs(Math.round(x)-x)<.2)piece("beam",0x8e8979,x,.65,12+side*.48,.29,3,.29);
    }
    return curve;
  }
  const highway=road([[10,36],[15,28],[11,20],[10,12],[14,8],[17,4],[16,-2],[9,-6],[8,-12],[13,-19],[17,-24],[17,-33],[22,-39]],1.15);
  road([[-22,24],[-19,18],[-17,12],[-11,12],[-4,12],[2,12],[8,12],[10,12]],1.15,true);
  road([[-17,12],[-21,8],[-19,3],[-14,0],[-16,-7],[-18,-13],[-13,-17]],.68);
  road([[14,8],[19,9],[23,6],[23,2],[17,4]],.58);
  road([[13,-19],[11,-23],[13,-26],[17,-24]],.55);
  const highlights=sites.map(site=>{
    const road=roadPaths.reduce((best,c)=>{const d=Math.min(...c.getSpacedPoints(70).map(p=>Math.hypot(p.x-site.x,p.z-site.z)));return d<best.d?{d,c}:best;},{d:Infinity}).c;
    const g=new T.TubeGeometry(road,190,.065,4,false),m=new T.Mesh(g,new T.MeshBasicMaterial({color:0xffc96a}));
    m.position.y=.16;m.visible=false;scene.add(m);return m;
  });
  const windows=new T.MeshStandardMaterial({roughness:.31,color:0x8ca098,emissive:0xffaf59,emissiveIntensity:0});
  const wallColors=[0xd3c4a1,0xb38d65,0xdba86b,0xd7d1bb,0x887563];
  const roofColors=[0x874a39,0x704438,0x546a68,0xa95f42,0x665749];
  for(const [s,site] of sites.entries()){
    for(let j=0;j<260;j++){
      const x=site.x+(rand()-.5)*13,z=site.z+(rand()-.5)*11,y=groundHeight(x,z);
      if(y<1.6||occupiedCells.has(cell(x,z))||Math.abs(groundHeight(x+1,z)-y)>1.25)continue;
      const a=.85+rand()*.55,b=.8+rand()*.38,h=.55+(s===1&&rand()<.4?.87:.2)*rand(),angle=rand()*.8-.4;
      reserve(x,z,1.05);
      function detail(k,color,dx,dy,dz,w,ht,d,pitch=0){
        piece(k,color,x+dx*Math.cos(angle)+dz*Math.sin(angle),y+dy,z-dx*Math.sin(angle)+dz*Math.cos(angle),w,ht,d,angle,pitch);
      }
      const wall=wallColors[Math.floor(rand()*wallColors.length)], roof=roofColors[Math.floor(rand()*roofColors.length)];
      detail("beam",0x887e68,0,.12,0,a+.1,.17,b+.1);
      for(const dx of [-.42,.42])for(const dz of [-.4,.4])detail("beam",0x766752,dx*a,-.51,dz*b,.12,1.4,.12);
      detail("beam",wall,0,.18+h+.115,0,a*.99,.23,b*.65);
      detail("beam",wall,0,.21+h/2,0,a,h,b);
      for(const dir of [-1,1])detail("roof",roof,0,.22+h+.13,dir*b*.27,a+.2,.12,b*.69,dir*.49);
      detail("beam",0xd1a186,0,.24+h+.25,0,a+.22,.10,.09);
      detail("beam",0x524b3e,0,.48,b*.51,.22,.53,.055);
      for(const dx of [-.32,.32])detail("glass",0xffffff,dx*a,.32+h*.50,b*.51,.21,.24,.06);
      for(const side of [-1,1]){
        detail("glass",0xffffff,side*a*.507,.27+h*.55,-.13,.035,.22,.20);
        detail("beam",0x695841,side*a*.525,.27+h*.55,-.13,.025,.24,.024);
        detail("glass",0xffffff,side*a*.27,.27+h*.55,-b*.508,.19,.2,.027);
      }
      detail("beam",0xb3a48b,0,.15,b*.62,a+.08,.14,.34);
      if(j%3===0){detail("roof",roof,0,.85,b*.65,a,.08,.39,.14);for(const dx of [-.39,.39])detail("beam",0x6e5b47,dx*a,.46,b*.79,.05,.72,.05);}
      if(j%4===0)detail("beam",0xa39a87,-a*.29,h+.53,-.10,.14,.49,.15);
    }
  }
  for(const route of roadPaths)for(let i=1;i<14;i++){
    const p=route.getPointAt(i/14);const z=p.z+.73,y=groundHeight(p.x,z);
    if(y<.4)continue;
    piece("beam",0x4c5147,p.x,y+.51,z,.035,1.03,.035);
    piece("glass",0xffffff,p.x,y+1.05,z,.14,.15,.14);
  }
  // Over-water visitor jetty and moored wooden rowboats in the river hamlet.
  const dockZ=-19,dockX=riverX(dockZ)+riverWidth(dockZ);
  for(let i=0;i<10;i++){
    piece("beam",0x957559,dockX+i*.29,.61,dockZ,.28,.10,.66);
    if(i%3===0)for(const s of [-1,1])piece("beam",0x605f4e,dockX+i*.29,-.35,dockZ+s*.24,.08,1.9,.08);
  }
  for(let i=0;i<4;i++){
    const x=dockX-.5-i*.34,z=dockZ+.25+i*.64;
    piece("beam",0x59463a,x,.13,z,.24,.08,.98,.12);
    for(const s of [-1,1])piece("beam",0x796046,x+s*.13,.20,z,.035,.16,1.02,.12);
  }
  // A glazed hillside nursery, with repeated pitched frames and planting beds.
  const gx=-22,gz=16,gy=groundHeight(gx,gz);
  piece("beam",0x8c8a75,gx,gy,gz,2.8,.22,1.5);
  for(const side of [-1,1])piece("roof",0xb9ccc3,gx,gy+.96,gz+side*.38,2.84,.07,.86,0,side*.39);
  for(let n=-1.3;n<=1.3;n+=.43)for(const side of [-1,1])piece("beam",0x78857a,gx+n,gy+.42,gz+side*.72,.042,.84,.042);
  const cube=new T.BoxGeometry(), painted=houseFinish(false),tiling=houseFinish(true);
  for(const [type,items] of groups){
    const m=new T.InstancedMesh(cube,type==="glass"?windows:type==="roof"?tiling:painted,items.length);
    items.forEach(([matrix,color],i)=>{m.setMatrixAt(i,matrix);m.setColorAt(i,tint.set(color));});
    m.castShadow=true;m.receiveShadow=true;scene.add(m);
  }
  const cars=Array.from({length:8},(_,i)=>{
    const group=new T.Group();function part(size,pos,color,lit=false){
      const material=lit?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color});
      const m=new T.Mesh(cube,material);m.scale.set(...size);m.position.set(...pos);group.add(m);
    }
    part([.23,.14,.5],[0,.11,0],[0xc8734c,0xb8c4b5,0x35707a][i%3]);part([.19,.12,.25],[0,.21,0],0x455858);
    for(const d of [-1,1]){part([.05,.04,.02],[d*.077,.12,.255],0xffe5a9,true);part([.04,.03,.02],[d*.077,.12,-.255],0xbd392e,true);}
    scene.add(group);return group;
  });
  let selected=-1,draw=0;
  return {occupied:(x,z)=>occupiedCells.has(cell(x,z)), focus(index){selected=index;draw=0;},
    update(time,delta,night){
      windows.emissiveIntensity=.07+night*1.8;
      draw=Math.min(1,draw+delta*.7);
      highlights.forEach((m,i)=>{m.visible=i===selected;if(m.visible)m.geometry.setDrawRange(0,Math.floor(draw*m.geometry.index.count/3)*3);});
      cars.forEach((car,i)=>{
        const route=i%3===0?roadPaths[1]:highway,reverse=i%2===0;
        const t=(time*(reverse?-.009:.008)+i*.143+1000)%1;
        const p=route.getPointAt(t),d=route.getTangentAt(t);
        car.position.copy(p);car.position.x+=d.z*(reverse?.22:-.22);car.position.z-=d.x*(reverse?.22:-.22);
        car.rotation.y=Math.atan2(d.x,d.z)+(reverse?Math.PI:0);
      });
    }};
}
