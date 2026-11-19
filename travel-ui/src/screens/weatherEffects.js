import * as T from "three";

export function weatherEffects(scene,rand,quality){
  const count=quality==="low"?110:420;
  const positions=new Float32Array(count*3);
  for(let i=0;i<count;i++) positions.set([(rand()-.5)*56,rand()*25,-rand()*52+10],i*3);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.BufferAttribute(positions,3));
  const drops=new T.Points(geometry,new T.PointsMaterial({color:0xc7e5ef,size:.09,transparent:true,opacity:0,depthWrite:false}));
  scene.add(drops);
  const clouds=new T.Group(),puff=new T.IcosahedronGeometry(1,1);
  const mist=new T.MeshStandardMaterial({color:0xfff4dc,roughness:1});
  for(let i=0;i<12;i++){
    const cloud=new T.Mesh(puff,mist);
    cloud.position.set((i%4)*15-24,13+rand()*3,-34-(i%3)*5);
    cloud.scale.set(3+rand()*3,1,2);clouds.add(cloud);
  }
  scene.add(clouds);
  const warm = new T.Color(0xffb679), daylight = new T.Color(0xffedd1);
  const dusk = new T.Color(0xf8bdab), rainLight = new T.Color(0xb5cad9);
  const night = new T.Color(0x7e88aa);
  return (preset,time,delta,sun)=>{
    const rainy=["rain","heavyRain","storm"].includes(preset);
    const intensity=rainy?(preset==="rain"?.45:.8):0;
    const blend=1-Math.exp(-delta*2);
    const lightColor = preset === "night" ? night : rainy ? rainLight : preset === "sunset" ? dusk : preset === "sunrise" ? warm : daylight;
    sun.color.lerp(lightColor, blend);
    scene.fog.color.lerp(lightColor, blend * .65);
    drops.material.opacity=T.MathUtils.lerp(drops.material.opacity,intensity,blend);
    drops.visible=drops.material.opacity>.01;
    if(drops.visible){
      for(let i=1;i<positions.length;i+=3){positions[i]-=delta*(preset==="rain"?8:16);if(positions[i]<0)positions[i]+=25;}
      geometry.attributes.position.needsUpdate=true;
    }
    clouds.position.x=Math.sin(time*(preset==="wind"?.18:.045))*4;
    scene.fog.density=T.MathUtils.lerp(scene.fog.density,preset==="fog"?.043:rainy?.027:.014,blend);
    sun.intensity=T.MathUtils.lerp(sun.intensity,preset==="night"?.15:rainy?.85:2,blend);
  };
}
