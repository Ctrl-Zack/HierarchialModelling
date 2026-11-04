'use strict';
const MAT = {
  // Mesin Outdoor Fitness:
  blue:          { color: [0.10, 0.24, 0.80], shine: 80,  spec: 0.65 },   // rangka tiang biru
  silver:        { color: [0.84, 0.86, 0.90], shine: 120, spec: 1.00 },   // pipa silver stang gawang siku
  black:         { color: [0.06, 0.06, 0.07], shine: 24,  spec: 0.35 },   // grip karet hitam
  pedalPlate:    { color: [0.36, 0.38, 0.44], shine: 28,  spec: 0.28 },   // pelat pijakan kaki abu-abu
  rod:           { color: [0.82, 0.84, 0.88], shine: 80,  spec: 0.70 },   // link rod perak
  grass:         { color: [0.30, 0.50, 0.20], shine: 4,   spec: 0.02 },   // rumput hijau
  concrete:      { color: [0.65, 0.65, 0.63], shine: 10,  spec: 0.08 },   // alas beton abu-abu

  // Material Urban Green Park:
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
  trashCanBody:  { color: [0.16, 0.38, 0.25], shine: 35,  spec: 0.30 },   // tempat sampah taman hijau

  // Material Danau (Lakeside Scenery):
  waterDeep:     { color: [0.02, 0.14, 0.30], shine: 180, spec: 1.20, isWater: 1 },   // air danau dalam biru pekat gelap (water shader aktif)
  waterShallow:  { color: [0.05, 0.22, 0.38], shine: 130, spec: 0.95, isWater: 1 },   // air tepian danau jernih teduh gelap (water shader aktif)
  lakeSand:      { color: [0.78, 0.72, 0.58], shine: 8,   spec: 0.04 },   // pasir pantai tepi danau
  lakeRock:      { color: [0.46, 0.45, 0.43], shine: 18,  spec: 0.12 },   // batu kali alami abu-abu
  lakeRockDark:  { color: [0.34, 0.33, 0.32], shine: 16,  spec: 0.10 },   // batu kali gelap basah
  lilyPad:       { color: [0.14, 0.52, 0.20], shine: 20,  spec: 0.15 },   // daun teratai hijau mengapung
  lotusPetal:    { color: [0.96, 0.58, 0.76], shine: 25,  spec: 0.25 },   // kelopak bunga teratai merah muda
  lotusCenter:   { color: [0.98, 0.88, 0.15], shine: 35,  spec: 0.40 },   // putik bunga teratai kuning
  reedStem:      { color: [0.32, 0.46, 0.16], shine: 10,  spec: 0.04 },   // batang buluh/gelagah air
  cattailHead:   { color: [0.34, 0.20, 0.10], shine: 8,   spec: 0.02 },   // bulir bunga gelagah cokelat
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

  /**
   * addPrism — Prisma segitiga siku-siku.
   * size = [legX, legY, depth]
   * pos = posisi sudut siku-siku (default: origin='corner') atau centroid (origin='centroid')
   * rotDeg = [rx, ry, rz] rotasi dalam derajat
   */
  addPrism(size, pos, mat, rotDeg = [0, 0, 0], origin = 'corner') {
    let m = Mat4.translation(pos[0], pos[1], pos[2]);
    m = Mat4.rotateY(m, rotDeg[1] * DEG);
    m = Mat4.rotateX(m, rotDeg[0] * DEG);
    m = Mat4.rotateZ(m, rotDeg[2] * DEG);
    m = Mat4.scale(m, size[0], size[1], size[2]);
    if (origin === 'centroid') {
      m = Mat4.multiply(m, Mat4.translation(-1/3, -1/3, 0));
    }
    this.parts.push({ mesh: this._meshes.prism, matrix: m, mat });
    return this;
  }

  addSphere(pos, size, mat, unlit = 0) {
    const s = typeof size === 'number' ? [size, size, size] : size;
    const m = Mat4.scale(Mat4.translation(pos[0], pos[1], pos[2]), s[0], s[1], s[2]);
    this.parts.push({ mesh: this._meshes.sphere, matrix: m, mat, unlit });
    return this;
  }

  addCylinder(radius, height, pos, mat, rotDeg = [0, 0, 0], unlit = 0) {
    const rx = typeof radius === 'number' ? radius : radius[0];
    const rz = typeof radius === 'number' ? radius : radius[1];
    let m = Mat4.translation(pos[0], pos[1], pos[2]);
    m = Mat4.rotateY(m, rotDeg[1] * DEG);
    m = Mat4.rotateX(m, rotDeg[0] * DEG);
    m = Mat4.rotateZ(m, rotDeg[2] * DEG);
    m = Mat4.scale(m, rx, height, rz);
    this.parts.push({ mesh: this._meshes.cylinder, matrix: m, mat, unlit });
    return this;
  }
}

function createNode(name, meshes) {
  return new Node(name, meshes);
}


// Offset translasi environment di sumbu X agar FitnessPad tepat berada di tengah origin (0, 0, 0)
const ENV_OFFSET_X = -12.5;

const DEFAULT_BASES = {
  latPull:    { pos: [-3.2, 0, 0], rotY: 90 }, // Sisi Kiri (X = -3.2)
  elliptical: { pos: [ 0.0, 0, 0], rotY: 0 }, // Tengah Origin (X = 0.0)
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
  // Seluruh hierarki scenery digeser di sumbu X agar FitnessPad berada di tengah origin
  const environmentNode = root.add(createNode('UrbanParkEnvironmentNode', meshes));
  environmentNode.translation = [ENV_OFFSET_X, 0, 0];
  buildUrbanParkEnvironment(environmentNode, meshes);

  return { root, latPull, elliptical, airWalker, environmentNode };
}
