import * as THREE from "three";
import outline from "../tourism/geography/vietnam.json";

// A small-scale editorial locator. Province boundaries and operational routes are independent.
export function vietnamAtlas() {
  const atlas = new THREE.Group();
  const project = ([lon, lat]) => new THREE.Vector2((lon - 106) * 1.68, (lat - 16) * 1.75);
  const shape = new THREE.Shape(outline.coordinates[0].map(project));
  const relief = new THREE.ExtrudeGeometry(shape, {depth: .52, bevelEnabled: false});
  relief.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(relief, new THREE.MeshStandardMaterial({color: 0x567e64, roughness: .88}));
  atlas.add(ground);
  const pins = [[105.8342,21.0278],[107.05,20.9],[108.2022,16.0544],[106.7009,10.7769]];
  const base = new THREE.CylinderGeometry(.16,.16,.95,8);
  const head = new THREE.SphereGeometry(.4,14,10);
  const bone = new THREE.MeshStandardMaterial({color: 0xffe6bc});
  const amber = new THREE.MeshStandardMaterial({color: 0xda8540});
  for (const point of pins) {
    const pos = project(point);
    const stem = new THREE.Mesh(base, bone), bead = new THREE.Mesh(head, amber);
    stem.position.set(pos.x, .95, -pos.y);
    bead.position.set(pos.x, 1.53, -pos.y);
    atlas.add(stem, bead);
  }
  return atlas;
}
