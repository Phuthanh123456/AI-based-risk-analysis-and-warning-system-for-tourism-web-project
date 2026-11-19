import {CatmullRomCurve3,Vector3,MathUtils} from "three";
import {elevation} from "../three/world/terrain";

const path = pts=>new CatmullRomCurve3(pts.map(p=>new Vector3(...p)));
const flight=path([[40,33,51],[28,24,32],[12,13,26],[-7,13,27],[-23,16,20],[-13,9,17],[9,7,20],[23,37,1],[4,62,13],[38,33,49]]);
const targets=path([[0,6,-13],[0,7,-20],[7,6,-15],[-13,5,9],[-16,6,10],[-3,3,12],[15,6,7],[3,5,-11],[0,1,-10],[0,6,-15]]);
const lens=[47,43,54,47,39,45,46,49,54,48], point=new Vector3();
export function compose(progress,time,position,target){
  const p=MathUtils.clamp(progress,0,1), n=p*(lens.length-1), i=Math.floor(n);
  flight.getPoint(p,position);targets.getPoint(p,point);target.copy(point);
  position.x+=Math.sin(time*.095)*.37;position.y=Math.max(elevation(position.x,position.z)+2,position.y);
  return MathUtils.lerp(lens[i],lens[Math.min(i+1,lens.length-1)],n-i);
}
