'use strict';

/**
 * Shared scene graph utilities, materials, and hierarchy construction.
 * Machine builders are defined in js/objects/.
 */

const MAT = {
  blue:          { color: [0.10, 0.24, 0.80], shine: 60,  spec: 0.65 },   // rangka tiang biru
  yellow:        { color: [0.98, 0.84, 0.04], shine: 40,  spec: 0.50 },   // aksen kuning
  silver:        { color: [0.84, 0.86, 0.90], shine: 120, spec: 1.00 },   // pipa silver stang gawang siku
  black:         { color: [0.06, 0.06, 0.07], shine: 24,  spec: 0.35 },   // grip karet hitam
  pedalPlate:    { color: [0.36, 0.38, 0.44], shine: 28,  spec: 0.28 },   // pelat pijakan kaki abu-abu
  rod:           { color: [0.82, 0.84, 0.88], shine: 80,  spec: 0.70 },   // link rod perak
  grass:         { color: [0.30, 0.50, 0.20], shine: 4,   spec: 0.02 },   // rumput hijau
  concrete:      { color: [0.65, 0.65, 0.63], shine: 10,  spec: 0.08 },   // alas beton abu-abu

  // Material Urban Green Park:
  rubberMat:     { color: [0.72, 0.26, 0.18], shine: 10,  spec: 0.08 },   // lantai karet merah bata (EPDM)
  rubberBorder:  { color: [0.50, 0.18, 0.13], shine: 10,  spec: 0.08 },   // garis tepi karet gelap
  pavingTrack:   { color: [0.76, 0.73, 0.66], shine: 14,  spec: 0.10 },   // paving track melingkar
  pavingBorder:  { color: [0.55, 0.53, 0.48], shine: 10,  spec: 0.06 },   // tepi batu paving
  woodBench:     { color: [0.58, 0.34, 0.16], shine: 18,  spec: 0.15 },   // kayu bangku taman (warm teak)
  treeTrunk:     { color: [0.34, 0.22, 0.12], shine: 8,   spec: 0.04 },   // batang kayu pohon gelap
  treeCrownDark: { color: [0.15, 0.36, 0.12], shine: 6,   spec: 0.04 },   // tajuk daun hijau rimbun tua
  treeCrownLight:{ color: [0.28, 0.52, 0.18], shine: 6,   spec: 0.04 },   // tajuk daun hijau segar terang
  bush:          { color: [0.20, 0.44, 0.15], shine: 6,   spec: 0.04 },   // semak-semak taman
  lampMetal:     { color: [0.12, 0.14, 0.16], shine: 55,  spec: 0.55 },   // besi hitam tiang lampu & kaki bangku
  lampGlow:      { color: [1.00, 0.94, 0.60], shine: 1,   spec: 0.00 },   // kaca/bohlam lentera lampu menyala
  signPlaque:    { color: [0.88, 0.82, 0.72], shine: 10,  spec: 0.06 },   // pelat papan informasi
  signGreen:     { color: [0.12, 0.42, 0.22], shine: 30,  spec: 0.25 },   // aksen hijau papan
  trashCanBody:  { color: [0.16, 0.38, 0.25], shine: 35,  spec: 0.30 }    // tempat sampah taman hijau
};

function pipeMatrix(p1, p2, r) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1], dz = p2[2] - p1[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return Mat4.scaling(0, 0, 0);

  const d = [dx / len, dy / len, dz / len];
  const ax = d[2], az = -d[0];
  const al = Math.hypot(ax, az);
  let R;
  if (al < 1e-6) R = d[1] > 0 ? Mat4.identity() : Mat4.rotationX(Math.PI);
  else R = Mat4.fromAxisAngle(ax / al, 0, az / al, Math.acos(clamp(d[1], -1, 1)));
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
  return Mat4.multiply(
    Mat4.translation(mid[0], mid[1], mid[2]),
    Mat4.multiply(R, Mat4.scaling(r, len, r))
  );
}

class Node {
  constructor(name, meshesRef) {
    this.name = name;
    this.parent = null;
    this.translation = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.override = null;
    this.parts = [];
    this.children = [];
    this.world = Mat4.identity();
    this.visible = true;
    this._meshes = meshesRef;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  localMatrix() {
    if (this.override) return this.override;
    let m = Mat4.translation(this.translation[0], this.translation[1], this.translation[2]);
    m = Mat4.rotateY(m, this.rotation[1] * DEG);
    m = Mat4.rotateX(m, this.rotation[0] * DEG);
    m = Mat4.rotateZ(m, this.rotation[2] * DEG);
    return m;
  }

  addPipe(p1, p2, r, mat, unlit = 0) {
    this.parts.push({ mesh: this._meshes.cylinder, matrix: pipeMatrix(p1, p2, r), mat, unlit });
    return this;
  }

  addBox(size, pos, mat, rotDeg = [0, 0, 0], unlit = 0) {
    let m = Mat4.translation(pos[0], pos[1], pos[2]);
    m = Mat4.rotateY(m, rotDeg[1] * DEG);
    m = Mat4.rotateX(m, rotDeg[0] * DEG);
    m = Mat4.rotateZ(m, rotDeg[2] * DEG);
    m = Mat4.scale(m, size[0], size[1], size[2]);
    this.parts.push({ mesh: this._meshes.box, matrix: m, mat, unlit });
    return this;
  }

  addSphere(pos, size, mat, unlit = 0) {
    const s = typeof size === 'number' ? [size, size, size] : size;
    const m = Mat4.scale(Mat4.translation(pos[0], pos[1], pos[2]), s[0], s[1], s[2]);
    this.parts.push({ mesh: this._meshes.sphere, matrix: m, mat, unlit });
    return this;
  }
}

function createNode(name, meshes) {
  return new Node(name, meshes);
}

/* =========================================================================
   KONFIGURASI POSISI & ROTASI AWAL (DEFAULT BASES)
   Ubah nilai di bawah ini jika ingin mengganti posisi/rotasi awal alat.
   ========================================================================= */
const DEFAULT_BASES = {
  latPull:    { pos: [-3.2, 0, 0], rotY: 0 }, // Sisi Kiri (X = -3.2)
  elliptical: { pos: [ 0.5, 0, 0], rotY: 0 }, // Tengah    (X =  0.0)
  airWalker:  { pos: [ 3.2, 0, 0], rotY: 0 }  // Sisi Kanan (X = +3.2)
};

function buildSceneHierarchy(meshes) {
  const root = createNode('Root', meshes);

  // 1. Mesin Lat Pull Down
  const latPullBase = root.add(createNode('LatPullBaseNode', meshes));
  latPullBase.translation = [...DEFAULT_BASES.latPull.pos];
  latPullBase.rotation = [0, DEFAULT_BASES.latPull.rotY, 0];
  const latPull = buildLatPullMachine(latPullBase, meshes);

  // 2. Mesin Outdoor Elliptical
  const ellipticalBase = root.add(createNode('EllipticalBaseNode', meshes));
  ellipticalBase.translation = [...DEFAULT_BASES.elliptical.pos];
  ellipticalBase.rotation = [0, DEFAULT_BASES.elliptical.rotY, 0];
  const elliptical = buildEllipticalMachine(ellipticalBase, meshes);

  // 3. Mesin Outdoor Air Walker
  const airWalkerBase = root.add(createNode('AirWalkerBaseNode', meshes));
  airWalkerBase.translation = [...DEFAULT_BASES.airWalker.pos];
  airWalkerBase.rotation = [0, DEFAULT_BASES.airWalker.rotY, 0];
  const airWalker = buildAirWalkerMachine(airWalkerBase, meshes);

  // 4. Urban Green Park Scenery (Lantai Karet, Paving Track, Pohon, Bangku, Lampu)
  const environmentNode = root.add(createNode('UrbanParkEnvironmentNode', meshes));
  buildUrbanParkEnvironment(environmentNode, meshes);

  return { root, latPull, elliptical, airWalker, environmentNode };
}
