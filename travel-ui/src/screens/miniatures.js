import * as T from "three";

export const landmarks = {
  "Hà Nội": { vi: ["Mặt hồ", "Tháp ven hồ"], en: ["Lake surface", "Lakeside tower"] },
  "Hội An": { vi: ["Dãy nhà phố", "Mái ngói"], en: ["Merchant houses", "Terracotta roofs"] },
  "Hạ Long": { vi: ["Vịnh biển", "Đảo đá vôi"], en: ["Bay waters", "Limestone islands"] },
  "Hồ Chí Minh": { vi: ["Bờ sông", "Cụm cao ốc"], en: ["Riverbank", "City skyline"] },
};

export function miniature(name, pedestal = true) {
  const group = new T.Group();
  const materials = new Map();
  function shape(geometry, color, x, y, z, scale) {
    if (!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({color,flatShading:true}));
    const mesh = new T.Mesh(geometry,materials.get(color));
    mesh.position.set(x,y,z);
    mesh.scale.set(...scale);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const box = new T.BoxGeometry();
  const drum = new T.CylinderGeometry(1, .91, 1, 48);
  if (pedestal) shape(drum,0x386b68,0,-.48,0,[5,.9,5]);
  if (pedestal) shape(drum,0x579e9d,0,.01,0,[4.94,.15,4.94]);
  if(name === "Hạ Long"){
    const boat = shape(box,0x875436,2.65,.23,2.5,[1.5,.28,.52]);
    shape(box,0xe3bd76,boat.position.x,.49,boat.position.z,[.7,.37,.42]);
    shape(box,0x754e39,boat.position.x,.75,boat.position.z,[.86,.12,.55]);
    const cliff = new T.IcosahedronGeometry(1,0);
    for(let i=0;i<11;i++){
      const angle=i*2.4,r=Math.sqrt(i)*1.13,h=1.5+Math.sin(i*3.1+1)*.75;
      const x=r*Math.cos(angle),z=r*Math.sin(angle);
      shape(cliff,0x778b78,x,h*.65,z,[1.13,h,1]);
      shape(cliff,0x51795a,x,h*1.34,z,[.85,h*.52,.84]);
    }
  } else if(name === "Hội An"){
    const lantern = new T.SphereGeometry(1,8,6);
    const roof=new T.ConeGeometry(1,1,4);
    for(let i=0;i<8;i++){
      const x=(i%4-1.5)*1.68,z=i<4?-1.15:1.15;
      shape(box,i%3===0?0xe5b876:0xe9cc8b,x,.68,z,[1.6,1.2,1.7]);
      shape(roof,0xa55c43,x,1.54,z,[1.26,.62,1.34]).rotation.y=Math.PI/4;
      shape(lantern, i%2 ? 0xbc5033 : 0xe9a947, x+.54,.95,z+.94,[.14,.19,.13]);
      shape(box,0x584c3e,x-.55,.82,z+.86,[.34,.44,.06]);
      shape(box,0x435b53,x,.46,z+.86,[.43,.77,.07]);
    }
  } else if(name === "Hà Nội"){
    shape(drum,0x93a375,0,.12,0,[2.65,.28,2.12]);
    const crown = new T.ConeGeometry(.94,.82,4);
    shape(crown,0x806652,0,3.27,0,[1,1,.85]).rotation.y=Math.PI/4;
    for(let i=0;i<3;i++){
      const w=2.75-i*.57,y=.72+i*.88;
      shape(box,0xe0ceaa,0,y,0,[w,.83,w*.7]);
      shape(box,0x9b8067,0,y+.41,0,[w+.26,.18,w*.7+.22]);
      for(const dx of [-.27,.27])shape(box,0x535c4d,w*dx,y, w*.351,[.27,.5,.06]);
    }
  } else {
    shape(drum,0x719778,0,.12,0,[4.5,.25,3.25]);
    shape(box,0x5b857d,0,3.75,0,[.65,1.8,.64]);
    shape(box,0xbdc8a9,0,4.85,0,[.08,.65,.08]);
    for(let i=0;i<15;i++){
      const a=i*2.4,r=Math.sqrt(i)*.96,h=.95+4.5/(1+r*.8)+Math.sin(i)*.75;
      const x=r*Math.cos(a),z=r*Math.sin(a);
      shape(box,i%2?0x789696:0xa2b5ae,x,h/2,z,[.85,h,.9]);
      for(let y=.6;y<h;y+=.66)shape(box,0xcbd3bd,x,y,z,[.88,.07,.93]);
    }
  }
  if (!group.children.some(m=>m.geometry===box)) box.dispose();
  if (!group.children.some(m=>m.geometry===drum)) drum.dispose();
  return group;
}

export function disposeScene(group){
  const assets=new Set();
  group.traverse(o=>{if(o.geometry)assets.add(o.geometry);if(o.material)assets.add(o.material);});
  assets.forEach(asset=>asset.dispose());
}
