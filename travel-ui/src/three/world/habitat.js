import * as T from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import {clamp,elevation,fieldMask,noise,randomStream} from "./terrain";

function colored(g,hex) {
  const color=new T.Color(hex), xyz=g.attributes.position;
  const colors=new Float32Array(xyz.count*3);
  for(let i=0;i<xyz.count;i++){const k=.76+.24*clamp(xyz.getY(i)/2);color.toArray(colors,3*i);for(let c=0;c<3;c++)colors[3*i+c]*=k;}
  g.setAttribute("color",new T.BufferAttribute(colors,3));
  if(g.index){const flat=g.toNonIndexed();g.dispose();return flat;}
  return g;
}
function tree(kind,seed,simple=false){
  const rand=randomStream(seed), parts=[];
  const wood=new T.CylinderGeometry(.043,.105,1.85,5);wood.translate(0,.925,0);parts.push(colored(wood,"#625445"));
  if(kind===0 || kind===1){
    // Each needle-bearing whorl ends in separate drooping sprays.
    const pos=[],colors=[],n=simple?6:11,layers=simple?4:8;
    for(let a=0;a<layers;a++){
      const y=.35+1.7*a/layers,rad=(1-a/(layers+.4))*(kind?.56:.72);
      for(let j=0;j<n;j++){
        const angle=(j+a*.49)/n*Math.PI*2, width=Math.PI/n*.92;
        const radius=rad*(.74+.35*rand()),tipY=y-rand()*.23;
        const tip=[Math.cos(angle)*radius,tipY,Math.sin(angle)*radius];
        const side=(k)=>[Math.cos(angle+k*width)*radius*.58,y+.12,Math.sin(angle+k*width)*radius*.58];
        const crown=[0,y+.50,0];
        const leaf=new T.Color(kind?"#526e52":"#3e6554").multiplyScalar(.60+.40*a/layers+.24*rand());
        for(const v of [tip,side(-1),crown,crown,side(1),tip,side(-1),tip,side(1)]){pos.push(...v);colors.push(leaf.r,leaf.g,leaf.b);}
      }
    }
    const branches=new T.BufferGeometry();branches.setAttribute("position",new T.Float32BufferAttribute(pos,3));
    branches.setAttribute("color",new T.Float32BufferAttribute(colors,3));branches.computeVertexNormals();parts.push(branches);
  }else if(kind===4){
    for(let i=0;i<5;i++){
      const x=(rand()-.5)*.5,z=(rand()-.5)*.5;
      const stem=new T.CylinderGeometry(.022,.035,1.95,4);stem.translate(x,1,z);parts.push(colored(stem,"#899054"));
      const leaves=new T.IcosahedronGeometry(.35,0);leaves.scale(.7,2.1,.9);leaves.translate(x,1.7+rand()*.28,z);parts.push(colored(leaves,"#738751"));
    }
  }else {
    for(let i=0;i<(simple?4:8);i++){
      const a=i*2.4,h=1.42+rand()*.7,r=i?.38:0;
      const crown=new T.IcosahedronGeometry(.43+rand()*.18,simple?0:1);
      crown.scale(1,.82+rand()*.2,.94);crown.rotateY(a);crown.translate(Math.cos(a)*r,h,Math.sin(a)*r);
      parts.push(colored(crown,kind===3 && i%4?"#c69391":kind===5?"#678b59":"#628252"));
    }
  }
  // The merged prototypes use just positions, normals and baked vertex colours.
  parts.forEach(g=>g.deleteAttribute("uv"));const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());return merged;
}

export function vegetation(scene,q,occupied) {
  const rand=randomStream(60219), time={value:0}, wind={value:.35};
  const bark=new T.MeshStandardMaterial({vertexColors:true,roughness:.98,side:T.DoubleSide});
  bark.onBeforeCompile=shader=>{
    shader.uniforms.windTime=time;shader.uniforms.windPower=wind;
    shader.vertexShader="uniform float windTime;uniform float windPower;\n"+shader.vertexShader.replace("#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed.x += sin(windTime*1.6+instanceMatrix[3].x*.45+instanceMatrix[3].z*.3)*windPower*pow(max(0.,position.y),2.)*.024;");
  };
  const prototypes=Array.from({length:6},(_,i)=>[tree(i,i+17),tree(i,i+17,true)]);
  const groups=new Map(), dummy=new T.Object3D(), tint=new T.Color();
  const blade=new T.BufferGeometry();blade.setAttribute("position",new T.Float32BufferAttribute([-.14,0,0,.05,.53,.09,.12,0,0, 0,0,-.16,.04,.43,.05,0,0,.15],3));blade.computeVertexNormals();
  const blades=colored(blade,"#929d58");
  function batch(cx,cz,kind,geometry){
    const id=cx+","+cz+","+kind;
    if(!groups.has(id))groups.set(id,{cx,cz,kind,geometry,matrices:[],colors:[]});
    return groups.get(id);
  }
  let planted=0;
  for(let i=0;i<q.trees*7 && planted<q.trees;i++){
    const x=(rand()-.5)*118,z=(rand()-.5)*116,h=elevation(x,z);
    if(h<.55 || h>26 || occupied(x,z)||fieldMask(x,z)>.39)continue;
    const grove=noise(x*.072,z*.078);
    if(rand()>.18+grove*.80 || Math.abs(elevation(x+1,z)-h)>2)continue;
    const kind=h>11?(rand()<.63?0:1):grove>.57?2:rand()<.12?3:rand()<.42?4:5;
    const size=(.42+rand()*.55)*(kind<=1?1.27:.97);
    dummy.position.set(x,h-.1,z);dummy.rotation.set(.035*(rand()-.5),rand()*6.28,0);dummy.scale.set(size*(.75+rand()*.32),size*(.85+rand()*.4),size);dummy.updateMatrix();
    const group=batch(Math.floor(x/22),Math.floor(z/22),kind,prototypes[kind]);
    group.matrices.push(dummy.matrix.clone());group.colors.push(tint.setScalar(.77+rand()*.37).clone());planted++;
  }
  for(let i=0;i<q.grass;i++){
    const x=(rand()-.5)*80,z=(rand()-.5)*80,h=elevation(x,z);
    if(h<.45 || occupied(x,z))continue;
    const group=batch(Math.floor(x/22),Math.floor(z/22),6,[blades]);
    const scale=.45+rand()*.8;dummy.position.set(x,h-.03,z);dummy.rotation.set(0,rand()*6.28,0);dummy.scale.setScalar(scale);dummy.updateMatrix();
    group.matrices.push(dummy.matrix.clone());group.colors.push(tint.setScalar(.8+rand()*.25).clone());
  }
  const lods=[];
  for(const g of groups.values()){
    const far=Math.hypot(g.cx*22+11,g.cz*22+11)>48;
    const mesh=new T.InstancedMesh(g.geometry[far&&g.kind!==6?1:0],bark,g.matrices.length);
    g.matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,g.colors[i]);});
    mesh.computeBoundingSphere();mesh.castShadow=!far&&g.kind!==6;mesh.receiveShadow=true;
    scene.add(mesh);if(g.kind!==6)lods.push([mesh,g.geometry,g.cx*22+11,g.cz*22+11]);
  }
  let tick=0;
  return {count:planted,update(t,breeze,camera){
    time.value=t;wind.value=breeze;
    if(++tick%20===0)for(const [m,variants,x,z] of lods)m.geometry=variants[+(Math.hypot(camera.position.x-x,camera.position.z-z)>47)];
  }, dispose(){for(const variants of prototypes)variants.forEach(g=>g.dispose());blades.dispose();}};
}
