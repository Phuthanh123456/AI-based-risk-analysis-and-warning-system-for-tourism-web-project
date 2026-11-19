import * as T from "three";

export const clamp = (v, lo=0, hi=1) => Math.min(hi, Math.max(lo,v));
export const smooth = (a,b,v) => { const k=clamp((v-a)/(b-a)); return k*k*(3-2*k); };
export function randomStream(seed) { return () => ((seed = Math.imul(seed,1664525)+1013904223 | 0) >>> 0) / 4294967296; }
const values = new Float32Array(256*256);
const next = randomStream(917);
for (let i=0;i<values.length;i++) values[i]=next();
export function noise(x,z) {
  const i=Math.floor(x), j=Math.floor(z);
  const u=smooth(0,1,x-i), v=smooth(0,1,z-j);
  const a=((j&255)<<8), b=(((j+1)&255)<<8), c=i&255, d=(i+1)&255;
  return (values[a+c]*(1-u)+values[a+d]*u)*(1-v)+(values[b+c]*(1-u)+values[b+d]*u)*v;
}
function fbm(x,z) { return noise(x,z)*.54+noise(2.08*x+7,2.08*z)*.26+noise(x*4.3,z*4.3+27)*.13+noise(x*8.6+5,z*8.6)*.07; }
export const riverX = z => 8*Math.sin(z*.048)+3.7*Math.sin(z*.106+.7)-3;
export const riverWidth = z => 1.9 + 5.4*Math.exp(-((z+11)**2)/75);
export function fieldMask(x,z) {
  return smooth(1,.42,((x-18)/15)**2+((z-4)/18)**2)+smooth(1,.4,((x+14)/10)**2+((z+16)/12)**2);
}
// Coordinates are local scene units. Main ridges surround a farmed river valley.
const peaks = [[30,-30,29,17,18],[-36,-36,27,23,14],[-45,7,21,17,26],[49,9,17,23,22],[2,-63,30,28,15],[-32,49,20,17,15],[39,58,23,21,14]];
export function elevation(x,z) {
  const wx=x+6*(noise(x*.065,z*.06)-.5), wz=z+5*(noise(x*.045+73,z*.07)-.5);
  let relief=0;
  for (const [cx,cz,h,rx,rz] of peaks) {
    const d=Math.hypot((wx-cx)/rx,(wz-cz)/rz);
    relief += h*Math.exp(-d*d*1.35)*(1-.25*Math.min(1,d));
  }
  const bank=Math.abs(x-riverX(z))-riverWidth(z);
  const ridge=1-Math.abs(2*fbm(wx*.15,wz*.14)-1);
  let y=1.15+relief*(.7+.42*ridge)+3.7*fbm(wx*.11,wz*.1)+Math.min(6,Math.max(0,bank)*.19);
  const fields=clamp(fieldMask(x,z));
  y+=fields*(2.2*Math.sin(x*.125)+1.8*Math.cos(z*.1));
  const step=.62, level=y/step;
  y += fields*(Math.floor(level)+smooth(.68,1,level%1)-level)*step;
  return -1.1+(y+1.1)*smooth(-1.3,6,bank);
}
export {sites} from "./locations";
export const presets={
  low:{grid:96,trees:1500,grass:1400,clouds:14,shadow:0,dpr:1},
  medium:{grid:148,trees:3600,grass:4300,clouds:25,shadow:1024,dpr:1.15},
  high:{grid:216,trees:6800,grass:9000,clouds:42,shadow:2048,dpr:1.4},
  ultra:{grid:278,trees:10400,grass:16000,clouds:62,shadow:2048,dpr:1.65}
};
function grainTexture() {
  const n=256, data=new Uint8Array(n*n*4);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
    const tone=Math.round(190+35*noise(x/8,z/8)+28*noise(x*2,z*2));
    data.set([tone,tone,tone,255],4*(z*n+x));
  }
  const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;
  t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function terrain(scene,q) {
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.9,map:grainTexture()});
  mat.bumpMap=mat.map;mat.bumpScale=.13;
  const cloudClock={value:0};
  mat.userData.cloudClock=cloudClock;
  mat.onBeforeCompile=shader=>{
    shader.uniforms.cloudClock=cloudClock;
    shader.vertexShader="varying vec3 landscapePoint;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nlandscapePoint=position;");
    shader.fragmentShader="varying vec3 landscapePoint;uniform float cloudClock;\n"+shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      vec2 land=landscapePoint.xz;
      float shade=.5+.5*sin(land.x*.075+cloudClock*.022+sin(land.y*.14))*cos(land.y*.089+cloudClock*.018);
      float layers=sin(landscapePoint.y*6.+sin(land.x*.8)*1.3+land.y*.43);
      diffuseColor.rgb*=(.87+.17*shade)*(.97+.05*layers);
    `);
  };
  const dark=new T.Color("#3d5145"), grass=new T.Color("#87965c"), rock=new T.Color("#92918a"),
    soil=new T.Color("#83775b"),crop=new T.Color("#b7ac59"),bank=new T.Color("#a7a58c"), tint=new T.Color();
  const patches=new Map();
  function surface(x,z){
    const col=Math.floor((x+36)/72),row=Math.floor((z+36)/72);
    const tile=patches.get(col+","+row);if(!tile)return elevation(x,z);
    const {segments:n,pos}=tile;
    const u=clamp((x-col*72+36)*n/72,0,n-.00001),v=clamp((z-row*72+36)*n/72,0,n-.00001);
    const i=Math.floor(u),j=Math.floor(v),fx=u-i,fz=v-j,k=j*(n+1)+i;
    const b=pos.getY(k+1),c=pos.getY(k+n+1);
    if(fx+fz<=1)return pos.getY(k)*(1-fx-fz)+b*fx+c*fz;
    return b*(1-fz)+c*(1-fx)+pos.getY(k+n+2)*(fx+fz-1);
  }
  function patch(size,segments,cx,cz,far=false){
    const g=new T.PlaneGeometry(size,size,segments,segments);g.rotateX(-Math.PI/2);g.translate(cx,0,cz);
    const pos=g.attributes.position,uv=g.attributes.uv,colors=[];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i);
      const remote=smooth(68,118,Math.max(Math.abs(x),Math.abs(z)));
      const h=elevation(x,z)+remote*(6+27*fbm(x*.023,z*.025)+12*noise(x*.044,z*.063));
      pos.setY(i,h);uv.setXY(i,x*.16,z*.16);
    }
    const stride=segments+1,spacing=size/segments;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),h=pos.getY(i),z=pos.getZ(i),col=i%stride,row=Math.floor(i/stride);
      const left=pos.getY(col?i-1:i),right=pos.getY(col<segments?i+1:i);
      const back=pos.getY(row?i-stride:i),front=pos.getY(row<segments?i+stride:i);
      const steep=Math.hypot(right-left,front-back)/(2*spacing);
      const cavity=clamp((left+right+back+front-4*h)/spacing,0,1);
      const variation=fbm(x*.16,z*.16);
      tint.copy(dark).lerp(grass,.25+.72*variation).lerp(rock,smooth(.62,1.7,steep)*.93);
      const fields=clamp(fieldMask(x,z))*smooth(.1,2,h);
      tint.lerp(crop,fields*(.40+.46*(Math.sin(h*10.13)*.5+.5)));
      tint.lerp(soil,fields*smooth(.7,1.4,steep)).lerp(bank,1-smooth(-.8,1.4,h));
      tint.multiplyScalar((.78+.37*variation+(far?.02:0))*(1-.15*cavity));
      colors.push(tint.r,tint.g,tint.b);
    }
    patches.set(cx/size+","+cz/size,{segments,pos});
    g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
    const mesh=new T.Mesh(g,mat);mesh.receiveShadow=true;mesh.castShadow=!far;scene.add(mesh);
  }
  // Adjoining tiles keep the floodplain detailed and the peripheral ranges inexpensive.
  for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){
    const distance=Math.max(Math.abs(i),Math.abs(j));
    patch(72,distance===0?q.grid:distance===1?Math.round(q.grid/2):24,72*i,72*j,distance===2);
  }
  return {mat,surface};
}
