import * as T from "three";
import {elevation,fieldMask,noise,randomStream} from "./terrain";

// Contour planting rows follow the same field levels as the terraced mesh.
export function surfaceDetail(scene,quality,occupied) {
  const rand=randomStream(351),points=[],colors=[],tint=new T.Color();
  const step=quality.grid>=200?.35:.54, beds=[[18,4,15,18],[-14,-16,10,12]];
  for(const [cx,cz,w,h] of beds)for(let x=cx-w;x<cx+w;x+=step)for(let z=cz-h;z<cz+h;z+=step){
    if(fieldMask(x,z)<.48||occupied(x,z))continue;
    const corners=[[x,z],[x+step,z],[x+step,z+step],[x,z+step]].map(([a,b])=>[a,elevation(a,b),b]);
    const min=Math.min(...corners.map(p=>p[1])),max=Math.max(...corners.map(p=>p[1]));
    if(min<1||max-min>1.55)continue;
    for(let level=Math.ceil(min/.62)*.62+.08;level<=max;level+=.62){
      const hit=[];
      for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];if((a[1]<level)===(b[1]<level))continue;
        const t=(level-a[1])/(b[1]-a[1]);hit.push([a[0]+(b[0]-a[0])*t,level+.105,a[2]+(b[2]-a[2])*t]);
      }
      if(hit.length!==2)continue;
      tint.set(level%1.24<.62?0xb7bb66:0x6c8b48);
      for(const p of hit){points.push(...p);colors.push(tint.r,tint.g,tint.b);}
    }
  }
  const rows=new T.BufferGeometry();rows.setAttribute("position",new T.Float32BufferAttribute(points,3));rows.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  scene.add(new T.LineSegments(rows,new T.LineBasicMaterial({vertexColors:true})));
  const rocks=[],bushes=[],dummy=new T.Object3D();
  for(let i=0;i<quality.trees*1.45;i++){
    const x=(rand()-.5)*102,z=(rand()-.5)*99,y=elevation(x,z);
    if(y<.16||occupied(x,z)||fieldMask(x,z)>.4)continue;
    const steep=Math.abs(elevation(x+1,z)-y)+Math.abs(elevation(x,z+1)-y);
    const isRock=steep>1.15||y<1.6, size=isRock?.19+rand()*.55:.17+rand()*.34;
    dummy.position.set(x,y-.1,z);dummy.scale.set(size*1.28,size*(isRock?.79:1.13),size*.94);
    dummy.rotation.set(rand()*.3,rand()*6,rand()*.4);dummy.updateMatrix();
    const color=isRock?new T.Color(0x888679).lerp(new T.Color(0x555e53),rand()):new T.Color(0x506448).lerp(new T.Color(0x849250),noise(x*.22,z*.22));
    (isRock?rocks:bushes).push([dummy.matrix.clone(),color]);
  }
  for(const cluster of [rocks,bushes]){
    const m=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({roughness:1}),cluster.length);
    cluster.forEach(([matrix,color],i)=>{m.setMatrixAt(i,matrix);m.setColorAt(i,color);});m.receiveShadow=true;scene.add(m);
  }
}

// Woven wall grain, tile courses and weathering in local building coordinates.
export function houseFinish(roof){
  const size=128,bytes=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const course=Math.floor(y/16), seam=(x+(course%2)*7)%16;
    const speckle=6*noise(x*.51,y*.51)+9*noise(x*.12,y*.11);
    const shade=roof?183+27*Math.sin(seam*Math.PI/16)-29*(y%16<2)+speckle:215-12*(y%20<1)-7*(x%33<1)+speckle;
    bytes.set([shade,shade,shade,255],4*(y*size+x));
  }
  const tex=new T.DataTexture(bytes,size,size);tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;
  return new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:roof?.035:.015,roughness:roof?.79:.94});
}
