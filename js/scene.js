'use strict';

/**
 * Scene Graph, Materials & Hierarchy Construction
 * Defines Node class, materials, and builds the Lat Pull Down / Chest Press 3D tree.
 */

const MAT = {
  blue:     { color: [0.10, 0.17, 0.74], shine: 56,  spec: 0.60 },   // tiang utama
  yellow:   { color: [0.98, 0.84, 0.04], shine: 40,  spec: 0.50 },   // lengan, rangka, dudukan
  silver:   { color: [0.80, 0.82, 0.86], shine: 120, spec: 1.0  },   // baut, engsel, collar
  black:    { color: [0.06, 0.06, 0.07], shine: 24,  spec: 0.35 },   // grip karet
  rod:      { color: [0.92, 0.78, 0.06], shine: 40,  spec: 0.50 },   // link rod
  grass:    { color: [0.30, 0.50, 0.20], shine: 4,   spec: 0.02 },
  concrete: { color: [0.64, 0.64, 0.62], shine: 8,   spec: 0.05 }
};

// Matriks silinder unit (sumbu Y) agar membentang dari titik p1 ke p2 dengan radius r.
function pipeMatrix(p1, p2, r) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1], dz = p2[2] - p1[2];
  const len = Math.hypot(dx, dy, dz);
  const d = [dx / len, dy / len, dz / len];
  const ax = d[2], az = -d[0];                 // (0,1,0) x d
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
    this.rotation = [0, 0, 0];          // derajat (X, Y, Z)
    this.override = null;               // matriks lokal manual (opsional)
    this.parts = [];
    this.children = [];
    this.world = Mat4.identity();       // diisi saat traversal
    this._meshes = meshesRef;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  // Matriks lokal relatif terhadap parent: M = T * Ry * Rx * Rz
  localMatrix() {
    if (this.override) return this.override;
    let m = Mat4.translation(this.translation[0], this.translation[1], this.translation[2]);
    m = Mat4.rotateY(m, this.rotation[1] * DEG);
    m = Mat4.rotateX(m, this.rotation[0] * DEG);
    m = Mat4.rotateZ(m, this.rotation[2] * DEG);
    return m;
  }

  addPipe(p1, p2, r, mat) {
    this.parts.push({ mesh: this._meshes.cylinder, matrix: pipeMatrix(p1, p2, r), mat });
    return this;
  }

  addBox(size, pos, mat, rotDeg = [0, 0, 0]) {
    let m = Mat4.translation(pos[0], pos[1], pos[2]);
    m = Mat4.rotateY(m, rotDeg[1] * DEG);
    m = Mat4.rotateX(m, rotDeg[0] * DEG);
    m = Mat4.rotateZ(m, rotDeg[2] * DEG);
    m = Mat4.scale(m, size[0], size[1], size[2]);
    this.parts.push({ mesh: this._meshes.box, matrix: m, mat });
    return this;
  }

  addSphere(pos, size, mat) {
    const s = typeof size === 'number' ? [size, size, size] : size;
    const m = Mat4.scale(Mat4.translation(pos[0], pos[1], pos[2]), s[0], s[1], s[2]);
    this.parts.push({ mesh: this._meshes.sphere, matrix: m, mat });
    return this;
  }
}

/* ---------- Dimensi mesin (meter) ---------- */
const PIVOT_X = 0.62, PIVOT_Y = 2.20;   // poros engsel lengan (kiri/kanan dari tiang)
const BD = 0.13;                        // setengah kedalaman (sumbu Z) bracket atas
const REST_DEG = 20;                    // sudut lengan saat Pull Angle = 0 (ujung stang terangkat)
const PIN_Z = 0.21;                     // bidang link rod (menjorok ke depan, di luar bracket)
const RAIL_X = 0.20;                    // poros rel pada klem tiang
const RAIL_Y = [0.28, 0.60];            // tinggi rel [bawah, atas] saat dudukan di posisi terendah
const RAIL_LEN = 0.70;                  // panjang kedua rel (SAMA -> jajar genjang)
const LEG_X = 0.10;                     // posisi kaki kursi dari poros rel
const ARM_ATTACH  = [-0.30, 0.00, PIN_Z];   // titik atas link rod (lokal MovingArm)
const RAIL_ATTACH = [ 0.55, 0.00, PIN_Z];   // titik bawah link rod (lokal RailUpper)

function createNode(name, meshes) {
  return new Node(name, meshes);
}

function buildSceneHierarchy(meshes) {
  const root = createNode('Root', meshes);
  const mainFrame = root.add(createNode('MainFrame', meshes));

  // ---- MainFrame ----
  mainFrame
    .addBox([3.6, 0.03, 1.5], [0, 0.015, 0], MAT.concrete)                      // alas beton
    .addPipe([0, 0.03, 0], [0, 0.09, 0], 0.27, MAT.blue)                        // flens dasar
    .addPipe([0, 0.09, 0], [0, 2.38, 0], 0.11, MAT.blue)                        // tiang utama
    .addSphere([0, 2.37, 0], [0.125, 0.08, 0.125], MAT.yellow)                  // tutup kuning
    .addBox([0.62, 0.34, 2 * BD], [0, PIVOT_Y, 0], MAT.blue)                    // badan bracket atas
    .addBox([0.30, 0.24, 2 * BD], [0, 1.96, 0], MAT.blue);                      // leher bracket

  // Bracket bertelinga (clevis)
  for (const sgn of [1, -1]) {
    mainFrame.addBox([0.22, 0.34, 2 * BD], [sgn * 0.40, PIVOT_Y, 0], MAT.blue);
    for (const zs of [1, -1]) {
      mainFrame
        .addBox([0.17, 0.34, 0.04], [sgn * 0.535, PIVOT_Y, zs * 0.11], MAT.blue)
        .addPipe([sgn * PIVOT_X, PIVOT_Y, zs * 0.09], [sgn * PIVOT_X, PIVOT_Y, zs * 0.13], 0.17, MAT.blue)
        .addPipe([sgn * PIVOT_X, PIVOT_Y, zs * 0.13], [sgn * PIVOT_X, PIVOT_Y, zs * 0.14], 0.055, MAT.silver);
    }
  }

  // Klem tiang untuk pivot rel
  for (const y of RAIL_Y) {
    mainFrame.addPipe([0, y - 0.07, 0], [0, y + 0.07, 0], 0.14, MAT.blue);
    for (const sgn of [1, -1]) {
      for (const zs of [1, -1]) {
        mainFrame.addBox([0.14, 0.12, 0.02], [sgn * 0.19, y, zs * 0.052], MAT.blue);
      }
      mainFrame
        .addPipe([sgn * RAIL_X, y, -0.07], [sgn * RAIL_X, y, 0.07], 0.02, MAT.silver)
        .addPipe([sgn * RAIL_X, y, 0.062], [sgn * RAIL_X, y, 0.072], 0.032, MAT.silver)
        .addPipe([sgn * RAIL_X, y, -0.072], [sgn * RAIL_X, y, -0.062], 0.032, MAT.silver);
    }
  }

  function buildSide(tag, sign) {
    const yaw = sign > 0 ? 0 : 180;

    // Joint: UpperPivotNode
    const pivot = mainFrame.add(createNode('UpperPivotNode' + tag, meshes));
    pivot.translation = [sign * PIVOT_X, PIVOT_Y, 0];
    pivot.rotation = [0, yaw, REST_DEG];
    pivot
      .addPipe([0, 0, 0.175], [0, 0, 0.19], 0.05, MAT.silver)
      .addPipe([0, 0, -0.19], [0, 0, -0.175], 0.05, MAT.silver);

    // Child: MovingArm
    const arm = pivot.add(createNode('MovingArm' + tag, meshes));
    arm
      .addPipe([0, 0, -0.075], [0, 0, 0.075], 0.075, MAT.yellow)
      .addPipe([0, 0, -0.185], [0, 0, 0.185], 0.03, MAT.silver)
      .addPipe([0.07, 0, 0], [0.28, 0, 0], 0.055, MAT.yellow)
      .addPipe([0.0, 0, 0], [0.55, 0, 0], 0.04, MAT.yellow)
      .addSphere([0.55, 0, 0], 0.04, MAT.yellow)
      .addPipe([0.55, 0, 0], [0.85, 0, 0.34], 0.034, MAT.yellow)
      .addPipe([0.55, 0, 0], [0.85, 0, -0.34], 0.034, MAT.yellow)
      .addSphere([0.85, 0, 0.34], 0.034, MAT.yellow)
      .addSphere([0.85, 0, -0.34], 0.034, MAT.yellow)
      .addPipe([0.85, 0, 0.34], [1.45, 0, 0.34], 0.034, MAT.yellow)
      .addPipe([0.85, 0, -0.34], [1.45, 0, -0.34], 0.034, MAT.yellow);

    for (const zs of [1, -1]) {
      arm.addBox([0.38, 0.06, 0.03], [-0.13, 0, zs * 0.16], MAT.yellow)
         .addPipe([0, 0, zs * 0.145], [0, 0, zs * 0.175], 0.06, MAT.yellow);
    }
    arm.addPipe([ARM_ATTACH[0], 0, 0.16], [ARM_ATTACH[0], 0, PIN_Z + 0.02], 0.022, MAT.silver)
       .addPipe([ARM_ATTACH[0], 0, PIN_Z - 0.015], [ARM_ATTACH[0], 0, PIN_Z + 0.02], 0.04, MAT.silver);

    // Pegangan karet GripNode 1 & 2
    for (const [i, z] of [[1, 0.34], [2, -0.34]]) {
      const g = arm.add(createNode('GripNode' + tag + i, meshes));
      g.translation = [1.45, 0, z];
      g.rotation = [0, z > 0 ? 90 : -90, 0];
      arm.addSphere([1.45, 0, z], 0.034, MAT.yellow);
      g.addPipe([0, 0, 0], [0.04, 0, 0], 0.05, MAT.silver)
       .addPipe([0.04, 0, 0], [0.26, 0, 0], 0.042, MAT.black)
       .addSphere([0.26, 0, 0], 0.042, MAT.black);
    }

    // Dua rel pivot: RailUpper & RailLower
    const railU = mainFrame.add(createNode('RailUpper' + tag, meshes));
    railU.translation = [sign * RAIL_X, RAIL_Y[1], 0];
    railU.rotation = [0, yaw, 0];
    const railL = mainFrame.add(createNode('RailLower' + tag, meshes));
    railL.translation = [sign * RAIL_X, RAIL_Y[0], 0];
    railL.rotation = [0, yaw, 0];

    for (const r of [railU, railL]) {
      r.addPipe([0, 0, -0.04], [0, 0, 0.04], 0.045, MAT.yellow)
       .addBox([RAIL_LEN, 0.06, 0.06], [RAIL_LEN / 2, 0, 0], MAT.yellow)
       .addPipe([RAIL_LEN, 0, -0.04], [RAIL_LEN, 0, 0.04], 0.045, MAT.yellow);
    }
    railU.addPipe([RAIL_ATTACH[0], 0, 0], [RAIL_ATTACH[0], 0, PIN_Z + 0.02], 0.025, MAT.yellow)
         .addPipe([RAIL_ATTACH[0], 0, PIN_Z - 0.015], [RAIL_ATTACH[0], 0, PIN_Z + 0.02], 0.04, MAT.silver);

    // Child: SeatNode
    const seat = railU.add(createNode('SeatNode' + tag, meshes));
    seat.translation = [RAIL_LEN, 0, 0];
    seat.rotation = [0, 0, 0];
    seat
      .addBox([0.08, 0.78, 0.08], [LEG_X, -0.15, 0], MAT.yellow)
      .addBox([0.22, 0.03, 0.30], [LEG_X, -0.555, 0], MAT.yellow)
      .addBox([0.56, 0.045, 0.44], [LEG_X + 0.26, 0.26, 0], MAT.yellow)
      .addPipe([LEG_X + 0.04, 0.26, 0], [LEG_X - 0.02, 0.37, 0], 0.035, MAT.yellow)
      .addPipe([LEG_X - 0.02, 0.37, 0], [LEG_X - 0.03, 0.47, 0], 0.035, MAT.yellow)
      .addBox([0.045, 0.38, 0.38], [LEG_X - 0.035, 0.62, 0], MAT.yellow, [0, 0, 6]);

    for (const yp of [0, -0.32]) {
      for (const zs of [1, -1]) seat.addBox([0.12, 0.12, 0.02], [0.02, yp, zs * 0.052], MAT.yellow);
      seat.addPipe([0, yp, -0.07], [0, yp, 0.07], 0.02, MAT.silver)
          .addPipe([0, yp, 0.062], [0, yp, 0.072], 0.032, MAT.silver)
          .addPipe([0, yp, -0.072], [0, yp, -0.062], 0.032, MAT.silver);
    }

    // LinkRod
    const rod = mainFrame.add(createNode('LinkRod' + tag, meshes));
    rod.parts.push({ mesh: meshes.cylinder, matrix: Mat4.identity(), mat: MAT.rod });
    rod.override = Mat4.identity();

    return { tag, sign, pivot, arm, railU, railL, seat, rod, L: 1, alpha: 0, lift: 0, pull: 0 };
  }

  const sides = [
    buildSide('R', +1),
    buildSide('L', -1)
  ];

  return { root, mainFrame, sides };
}
