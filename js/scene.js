'use strict';

/**
 * Scene Graph, Materials & Hierarchy Construction
 * Defines Node class, materials, and builds three outdoor fitness machines:
 * 1. Lat Pull Down / Chest Press (Tangkai Gawang Siku 90° Silver Sesuai Foto Asli)
 * 2. Outdoor Elliptical Trainer
 * 3. Outdoor Air Walker / Space Walker (Ayunan Kaki Pendulum)
 */

const MAT = {
  blue:       { color: [0.10, 0.24, 0.80], shine: 60,  spec: 0.65 },   // rangka tiang biru
  yellow:     { color: [0.98, 0.84, 0.04], shine: 40,  spec: 0.50 },   // aksen kuning
  silver:     { color: [0.84, 0.86, 0.90], shine: 120, spec: 1.00 },   // pipa silver stang gawang siku
  black:      { color: [0.06, 0.06, 0.07], shine: 24,  spec: 0.35 },   // grip karet hitam
  pedalPlate: { color: [0.36, 0.38, 0.44], shine: 28,  spec: 0.28 },   // pelat pijakan kaki abu-abu
  rod:        { color: [0.82, 0.84, 0.88], shine: 80,  spec: 0.70 },   // link rod perak
  grass:      { color: [0.30, 0.50, 0.20], shine: 4,   spec: 0.02 },   // rumput hijau
  concrete:   { color: [0.65, 0.65, 0.63], shine: 10,  spec: 0.08 }    // alas beton abu-abu
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

function createNode(name, meshes) {
  return new Node(name, meshes);
}

/* =========================================================================
   1. LAT PULL DOWN / CHEST PRESS MACHINE (Sesuai Foto Nyata REIDI)
   ========================================================================= */

const LP_PIVOT_X = 0.62, LP_PIVOT_Y = 2.20;
const LP_BD = 0.13;
const LP_REST_DEG = 18;
const LP_PIN_Z = 0.21;
const LP_RAIL_X = 0.20;
const LP_RAIL_Y = [0.28, 0.60];
const LP_RAIL_LEN = 0.70;
const LP_LEG_X = 0.10;
const LP_ARM_ATTACH  = [-0.30, 0.00, LP_PIN_Z];
const LP_SEAT_ATTACH = [ 0.04, 0.55, LP_PIN_Z];

function buildLatPullMachine(baseNode, meshes) {
  const concreteBase = baseNode.add(createNode('ConcreteBase_LatPull', meshes));
  concreteBase.addBox([3.6, 0.04, 1.6], [0, 0.02, 0], MAT.concrete);

  const mainFrame = baseNode.add(createNode('MainFrame_LatPull', meshes));
  mainFrame
    .addPipe([0, 0.03, 0], [0, 0.09, 0], 0.27, MAT.blue)
    .addPipe([0, 0.09, 0], [0, 2.38, 0], 0.11, MAT.blue)
    .addSphere([0, 2.37, 0], [0.125, 0.08, 0.125], MAT.blue) // tutup tiang biru
    .addBox([0.62, 0.34, 2 * LP_BD], [0, LP_PIVOT_Y, 0], MAT.silver) // bracket clevis silver
    .addBox([0.30, 0.24, 2 * LP_BD], [0, 1.96, 0], MAT.blue);

  for (const sgn of [1, -1]) {
    mainFrame.addBox([0.22, 0.34, 2 * LP_BD], [sgn * 0.40, LP_PIVOT_Y, 0], MAT.silver);
    for (const zs of [1, -1]) {
      mainFrame
        .addBox([0.17, 0.34, 0.04], [sgn * 0.535, LP_PIVOT_Y, zs * 0.11], MAT.silver)
        .addPipe([sgn * LP_PIVOT_X, LP_PIVOT_Y, zs * 0.09], [sgn * LP_PIVOT_X, LP_PIVOT_Y, zs * 0.13], 0.17, MAT.silver)
        .addPipe([sgn * LP_PIVOT_X, LP_PIVOT_Y, zs * 0.13], [sgn * LP_PIVOT_X, LP_PIVOT_Y, zs * 0.14], 0.055, MAT.silver);
    }
  }

  for (const y of LP_RAIL_Y) {
    mainFrame.addPipe([0, y - 0.07, 0], [0, y + 0.07, 0], 0.14, MAT.blue);
    for (const sgn of [1, -1]) {
      for (const zs of [1, -1]) {
        mainFrame.addBox([0.14, 0.12, 0.02], [sgn * 0.19, y, zs * 0.052], MAT.blue);
      }
      mainFrame
        .addPipe([sgn * LP_RAIL_X, y, -0.07], [sgn * LP_RAIL_X, y, 0.07], 0.02, MAT.silver)
        .addPipe([sgn * LP_RAIL_X, y, 0.062], [sgn * LP_RAIL_X, y, 0.072], 0.032, MAT.silver)
        .addPipe([sgn * LP_RAIL_X, y, -0.072], [sgn * LP_RAIL_X, y, -0.062], 0.032, MAT.silver);
    }
  }

  function buildLPSide(tag, sign) {
    const yaw = sign > 0 ? 0 : 180;
    const pivot = mainFrame.add(createNode('UpperPivotNode' + tag, meshes));
    pivot.translation = [sign * LP_PIVOT_X, LP_PIVOT_Y, 0];
    pivot.rotation = [0, yaw, LP_REST_DEG];
    pivot
      .addPipe([0, 0, 0.175], [0, 0, 0.19], 0.05, MAT.silver)
      .addPipe([0, 0, -0.19], [0, 0, -0.175], 0.05, MAT.silver);

    const arm = pivot.add(createNode('MovingArm' + tag, meshes));
    arm
      .addPipe([0, 0, -0.075], [0, 0, 0.075], 0.075, MAT.silver)
      .addPipe([0, 0, -0.185], [0, 0, 0.185], 0.03, MAT.silver);

    // Ekor tuas belakang (menghubungkan pin ke Link Rod)
    for (const zs of [1, -1]) {
      arm.addBox([0.38, 0.06, 0.03], [-0.13, 0, zs * 0.16], MAT.silver)
         .addPipe([0, 0, zs * 0.145], [0, 0, zs * 0.175], 0.06, MAT.silver);
    }
    arm.addPipe([LP_ARM_ATTACH[0], 0, 0.16], [LP_ARM_ATTACH[0], 0, LP_PIN_Z + 0.02], 0.022, MAT.silver)
       .addPipe([LP_ARM_ATTACH[0], 0, LP_PIN_Z - 0.015], [LP_ARM_ATTACH[0], 0, LP_PIN_Z + 0.02], 0.04, MAT.silver);

    // =========================================================================
    // LENGAN OVERHEAD LAT PULL DOWN (Sesuai Foto Asli):
    // 1. Dua pipa penopang ganda (Dual Boom Struts) dari poros ke depan
    // 2. Palang lebar melintang (Wide Lat Pulldown Crossbar) di atas kepala
    // 3. Sayap pegangan luar melengkung miring ke bawah (Angled Wide Grips ~18°)
    // 4. Dua pegangan sempit sejajar (Parallel Neutral Grips) di bagian dalam
    // 5. Karet grip hitam bertekstur di setiap pegangan tangan
    // =========================================================================
    const EXT_X = 0.84;       // Jangkauan horizontal ke depan dari poros
    const HALF_CENTER = 0.34; // Setengah lebar palang lurus tengah (total = 0.68m)
    const HALF_OUTER  = 0.58; // Setengah lebar total ujung luar sayap (total = 1.16m)
    const DROP_WING_Y = -0.09;// Sudut tekukan sayap luar miring ke bawah

    // 1) Dua pipa penopang utama (Dual Boom) dari engsel poros ke palang atas
    for (const zs of [1, -1]) {
      const zPivot = zs * 0.12;
      const zCross = zs * 0.15;
      arm.addPipe([0.04, 0, zPivot], [EXT_X, 0, zCross], 0.032, MAT.silver)
         .addSphere([0.04, 0, zPivot], 0.034, MAT.silver)
         .addSphere([EXT_X, 0, zCross], 0.034, MAT.silver);

      // Pelat penguat / gusset di dekat poros
      arm.addBox([0.16, 0.03, 0.02], [0.12, 0, zPivot], MAT.silver);
    }
    // Batang penguat melintang antara kedua pipa penopang
    arm.addPipe([0.48, 0, -0.135], [0.48, 0, 0.135], 0.024, MAT.silver);

    // 2) Palang lurus tengah (Center Crossbar)
    arm.addPipe([EXT_X, 0, -HALF_CENTER], [EXT_X, 0, HALF_CENTER], 0.032, MAT.silver);

    // 3) Sayap Pegangan Lebar Kiri & Kanan (Angled Wide Grip Wings)
    for (const [i, sgnZ] of [[1, 1], [2, -1]]) {
      const pInner = [EXT_X, 0, sgnZ * HALF_CENTER];
      const pOuter = [EXT_X + 0.03, DROP_WING_Y, sgnZ * HALF_OUTER];

      // Pipa sayap miring ke bawah
      arm.addSphere(pInner, 0.034, MAT.silver)
         .addPipe(pInner, pOuter, 0.028, MAT.silver)
         .addSphere(pOuter, 0.030, MAT.silver);

      // Karet grip hitam di sayap lebar luar (Wide Grip)
      const pGripStart = [
        pInner[0] + (pOuter[0] - pInner[0]) * 0.25,
        pInner[1] + (pOuter[1] - pInner[1]) * 0.25,
        pInner[2] + (pOuter[2] - pInner[2]) * 0.25
      ];
      arm.addPipe(pGripStart, pOuter, 0.035, MAT.black)
         .addSphere(pOuter, 0.035, MAT.black);

      // 4) Pegangan Sempit Sejajar Bagian Dalam (Parallel Neutral Grip)
      const zNeutral = sgnZ * 0.15;
      const pNeutStart = [EXT_X - 0.22, -0.02, zNeutral];
      const pNeutEnd   = [EXT_X, -0.02, zNeutral];
      arm.addPipe(pNeutStart, pNeutEnd, 0.026, MAT.silver)
         .addPipe([EXT_X - 0.20, -0.02, zNeutral], [EXT_X - 0.02, -0.02, zNeutral], 0.033, MAT.black)
         .addSphere(pNeutStart, 0.028, MAT.black);

      // Node pegangan tangan
      const g = arm.add(createNode('GripNode' + tag + i, meshes));
      g.translation = [
        (pInner[0] + pOuter[0]) / 2,
        (pInner[1] + pOuter[1]) / 2,
        (pInner[2] + pOuter[2]) / 2
      ];
      g.rotation = [0, 0, 0];
    }

    const railU = mainFrame.add(createNode('RailUpper' + tag, meshes));
    railU.translation = [sign * LP_RAIL_X, LP_RAIL_Y[1], 0];
    railU.rotation = [0, yaw, 0];
    const railL = mainFrame.add(createNode('RailLower' + tag, meshes));
    railL.translation = [sign * LP_RAIL_X, LP_RAIL_Y[0], 0];
    railL.rotation = [0, yaw, 0];

    for (const r of [railU, railL]) {
      r.addPipe([0, 0, -0.04], [0, 0, 0.04], 0.045, MAT.yellow)
       .addBox([LP_RAIL_LEN, 0.06, 0.06], [LP_RAIL_LEN / 2, 0, 0], MAT.yellow)
       .addPipe([LP_RAIL_LEN, 0, -0.04], [LP_RAIL_LEN, 0, 0.04], 0.045, MAT.yellow);
    }

    const seat = railU.add(createNode('SeatNode' + tag, meshes));
    seat.translation = [LP_RAIL_LEN, 0, 0];
    seat.rotation = [0, 0, 0];
    seat
      .addBox([0.08, 0.78, 0.08], [LP_LEG_X, -0.15, 0], MAT.yellow)
      .addBox([0.22, 0.03, 0.30], [LP_LEG_X, -0.555, 0], MAT.yellow)
      .addBox([0.56, 0.045, 0.44], [LP_LEG_X + 0.26, 0.26, 0], MAT.yellow)
      .addPipe([LP_LEG_X + 0.04, 0.26, 0], [LP_LEG_X - 0.02, 0.37, 0], 0.035, MAT.yellow)
      .addPipe([LP_LEG_X - 0.02, 0.37, 0], [LP_LEG_X - 0.03, 0.47, 0], 0.035, MAT.yellow)
      .addBox([0.045, 0.38, 0.38], [LP_LEG_X - 0.035, 0.62, 0], MAT.yellow, [0, 0, 6])
      .addPipe([LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], 0], [LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], LP_PIN_Z + 0.02], 0.025, MAT.yellow)
      .addPipe([LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], LP_PIN_Z - 0.015], [LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], LP_PIN_Z + 0.02], 0.04, MAT.silver);

    for (const yp of [0, -0.32]) {
      for (const zs of [1, -1]) seat.addBox([0.12, 0.12, 0.02], [0.02, yp, zs * 0.052], MAT.yellow);
      seat.addPipe([0, yp, -0.07], [0, yp, 0.07], 0.02, MAT.silver)
          .addPipe([0, yp, 0.062], [0, yp, 0.072], 0.032, MAT.silver)
          .addPipe([0, yp, -0.072], [0, yp, -0.062], 0.032, MAT.silver);
    }

    const rod = mainFrame.add(createNode('LinkRod' + tag, meshes));
    rod.parts.push({ mesh: meshes.cylinder, matrix: Mat4.identity(), mat: MAT.rod });
    rod.override = Mat4.identity();

    return { tag, sign, pivot, arm, railU, railL, seat, rod, L: 1, alpha: 0, lift: 0, pull: 0 };
  }

  const sides = [
    buildLPSide('R', +1),
    buildLPSide('L', -1)
  ];

  return { baseNode, concreteBase, mainFrame, sides };
}


/* =========================================================================
   2. OUTDOOR ELLIPTICAL TRAINER
   ========================================================================= */

const EL_FRONT_P1 = [1.36, -0.58]; // Y, Z poros stang depan
const EL_REAR_P2  = [0.24,  0.86]; // Y, Z poros belakang rendah kompak
const EL_H_UP     = 0.58;          // stang pegangan atas
const EL_H_DOWN   = 1.22;          // pipa stang bawah ke engsel pedal
const EL_L_REAR   = 0.11;          // engsel ayun belakang kompak dekat tanah
const EL_SIDE_X   = 0.23;          // jarak sisi Kanan/Kiri

function buildEllipticalMachine(baseNode, meshes) {
  const concreteBase = baseNode.add(createNode('ConcreteBase_Elliptical', meshes));
  concreteBase.addBox([1.25, 0.04, 2.3], [0, 0.02, 0.15], MAT.concrete);

  const mainFrame = baseNode.add(createNode('MainFrame_Elliptical', meshes));

  mainFrame
    .addPipe([0, 0.03, 0.10], [0, 0.08, 0.10], 0.23, MAT.blue)
    .addSphere([0.15, 0.08, 0.10], 0.022, MAT.silver)
    .addSphere([-0.15, 0.08, 0.10], 0.022, MAT.silver)
    .addSphere([0, 0.08, 0.25], 0.022, MAT.silver)
    .addSphere([0, 0.08, -0.05], 0.022, MAT.silver);

  mainFrame
    .addPipe([0, 0.14, -0.42], [0, 0.14, 0.86], 0.080, MAT.blue)
    .addSphere([0, 0.14, -0.42], 0.080, MAT.blue);

  mainFrame
    .addPipe([0, 0.14, -0.42], [0, 0.40, -0.58], 0.080, MAT.blue)
    .addSphere([0, 0.40, -0.58], 0.080, MAT.blue)
    .addPipe([0, 0.40, -0.58], [0, EL_FRONT_P1[0] + 0.08, -0.58], 0.080, MAT.blue)
    .addSphere([0, EL_FRONT_P1[0] + 0.08, -0.58], [0.092, 0.065, 0.092], MAT.blue);

  mainFrame
    .addPipe([-0.25, EL_FRONT_P1[0], EL_FRONT_P1[1]], [0.25, EL_FRONT_P1[0], EL_FRONT_P1[1]], 0.044, MAT.blue)
    .addSphere([0.25, EL_FRONT_P1[0], EL_FRONT_P1[1]], 0.046, MAT.silver)
    .addSphere([-0.25, EL_FRONT_P1[0], EL_FRONT_P1[1]], 0.046, MAT.silver);

  mainFrame
    .addPipe([0, 0.14, 0.86], [0, EL_REAR_P2[0], EL_REAR_P2[1]], 0.055, MAT.blue)
    .addSphere([0, EL_REAR_P2[0], EL_REAR_P2[1]], 0.055, MAT.blue)
    .addPipe([-0.25, EL_REAR_P2[0], EL_REAR_P2[1]], [0.25, EL_REAR_P2[0], EL_REAR_P2[1]], 0.032, MAT.blue)
    .addSphere([0.25, EL_REAR_P2[0], EL_REAR_P2[1]], 0.034, MAT.silver)
    .addSphere([-0.25, EL_REAR_P2[0], EL_REAR_P2[1]], 0.034, MAT.silver);

  function buildEllipticalSide(tag, sign) {
    const xPos = sign * EL_SIDE_X;

    const frontPivot = mainFrame.add(createNode('FrontPivotNode' + tag, meshes));
    frontPivot.translation = [xPos, EL_FRONT_P1[0], EL_FRONT_P1[1]];
    frontPivot.rotation = [0, 0, 0];

    const handlebar = frontPivot.add(createNode('Handlebar' + tag, meshes));
    handlebar
      .addPipe([0, 0, 0], [0, -EL_H_DOWN, 0], 0.026, MAT.silver)
      .addSphere([0, -EL_H_DOWN, 0], 0.032, MAT.silver)
      .addPipe([-0.025, -EL_H_DOWN, 0], [0.025, -EL_H_DOWN, 0], 0.020, MAT.silver)
      .addPipe([0, 0, 0], [0, 0.30, -0.05], 0.026, MAT.silver)
      .addSphere([0, 0.30, -0.05], 0.026, MAT.silver)
      .addPipe([0, 0.30, -0.05], [0, EL_H_UP, -0.015], 0.026, MAT.silver)
      .addPipe([0, 0.33, -0.045], [0, EL_H_UP, -0.015], 0.032, MAT.black)
      .addSphere([0, EL_H_UP, -0.015], 0.032, MAT.black);

    const rearPivot = mainFrame.add(createNode('RearPivotNode' + tag, meshes));
    rearPivot.translation = [xPos, EL_REAR_P2[0], EL_REAR_P2[1]];
    rearPivot.rotation = [0, 0, 0];

    const rearLink = rearPivot.add(createNode('RearLink' + tag, meshes));
    rearLink
      .addPipe([0, 0, 0], [0, -EL_L_REAR, 0], 0.022, MAT.silver)
      .addSphere([0, -EL_L_REAR, 0], 0.028, MAT.silver);

    const pedalBeam = mainFrame.add(createNode('PedalBeam' + tag, meshes));
    pedalBeam.override = Mat4.identity();
    pedalBeam.parts.push({ mesh: meshes.cylinder, matrix: Mat4.identity(), mat: MAT.silver });
    pedalBeam.parts.push({ mesh: meshes.box, matrix: Mat4.identity(), mat: MAT.pedalPlate });
    pedalBeam.parts.push({ mesh: meshes.box, matrix: Mat4.identity(), mat: MAT.silver });
    pedalBeam.parts.push({ mesh: meshes.box, matrix: Mat4.identity(), mat: MAT.silver });

    return { tag, sign, xPos, frontPivot, handlebar, rearPivot, rearLink, pedalBeam, stride: 0, phi: 0 };
  }

  const sides = [
    buildEllipticalSide('R', +1),
    buildEllipticalSide('L', -1)
  ];

  return { baseNode, concreteBase, mainFrame, sides };
}


/* =========================================================================
   3. OUTDOOR AIR WALKER / SPACE WALKER (Sesuai Foto Rangka U & Ayunan Pendulum)
   ========================================================================= */

const AW_PIVOT_Y = 1.18;
const AW_ARM_LEN = 0.98;
const AW_SIDE_X  = 0.22;

function buildAirWalkerMachine(baseNode, meshes) {
  const concreteBase = baseNode.add(createNode('ConcreteBase_AirWalker', meshes));
  concreteBase.addBox([1.25, 0.04, 1.6], [0, 0.02, 0], MAT.concrete);

  const mainFrame = baseNode.add(createNode('MainFrame_AirWalker', meshes));

  mainFrame
    .addPipe([0, 0.03, 0], [0, 0.08, 0], 0.22, MAT.blue)
    .addSphere([0.14, 0.08, 0], 0.022, MAT.silver)
    .addSphere([-0.14, 0.08, 0], 0.022, MAT.silver)
    .addSphere([0, 0.08, 0.14], 0.022, MAT.silver)
    .addSphere([0, 0.08, -0.14], 0.022, MAT.silver);

  mainFrame.addPipe([0, 0.08, 0], [0, 0.22, 0], 0.075, MAT.blue);

  mainFrame
    .addPipe([-0.34, 0.22, 0], [0.34, 0.22, 0], 0.065, MAT.blue)
    .addSphere([-0.34, 0.22, 0], 0.065, MAT.blue)
    .addSphere([0.34, 0.22, 0], 0.065, MAT.blue);

  for (const sgn of [1, -1]) {
    mainFrame
      .addPipe([sgn * 0.34, 0.22, 0], [sgn * 0.34, AW_PIVOT_Y + 0.08, 0], 0.065, MAT.blue)
      .addSphere([sgn * 0.34, AW_PIVOT_Y + 0.08, 0], [0.075, 0.06, 0.075], MAT.blue)
      .addPipe([sgn * 0.34, AW_PIVOT_Y, 0], [sgn * (AW_SIDE_X + 0.02), AW_PIVOT_Y, 0], 0.036, MAT.silver)
      .addSphere([sgn * (AW_SIDE_X + 0.02), AW_PIVOT_Y, 0], 0.038, MAT.silver);
  }

  const HZ = -0.36, HY = 1.05;
  mainFrame
    .addPipe([-0.28, HY, HZ], [0.28, HY, HZ], 0.028, MAT.blue)
    .addSphere([-0.28, HY, HZ], 0.032, MAT.blue)
    .addSphere([0.28, HY, HZ], 0.032, MAT.blue)
    .addPipe([-0.26, HY, HZ], [-0.08, HY, HZ], 0.033, MAT.black)
    .addPipe([0.08, HY, HZ], [0.26, HY, HZ], 0.033, MAT.black);

  for (const sgn of [1, -1]) {
    mainFrame.addPipe([sgn * 0.34, 0.88, 0], [sgn * 0.28, HY, HZ], 0.028, MAT.blue);
  }

  function buildAWSide(tag, sign) {
    const xPos = sign * AW_SIDE_X;

    const pivot = mainFrame.add(createNode('AirWalkerPivot' + tag, meshes));
    pivot.translation = [xPos, AW_PIVOT_Y, 0];
    pivot.rotation = [0, 0, 0];

    const leg = pivot.add(createNode('AirWalkerLeg' + tag, meshes));
    leg
      .addPipe([0, 0, 0], [0, -AW_ARM_LEN, 0], 0.026, MAT.silver)
      .addSphere([0, -AW_ARM_LEN, 0], 0.034, MAT.silver);

    const footPos = [0, -AW_ARM_LEN + 0.025, 0];
    leg
      .addBox([0.18, 0.028, 0.36], footPos, MAT.pedalPlate)
      .addBox([0.012, 0.040, 0.36], [footPos[0] - 0.085, footPos[1] + 0.012, 0], MAT.silver)
      .addBox([0.012, 0.040, 0.36], [footPos[0] + 0.085, footPos[1] + 0.012, 0], MAT.silver)
      .addBox([0.18, 0.040, 0.014], [footPos[0], footPos[1] + 0.012, -0.175], MAT.silver);

    return { tag, sign, xPos, pivot, leg, swing: 0 };
  }

  const sides = [
    buildAWSide('R', +1),
    buildAWSide('L', -1)
  ];

  return { baseNode, concreteBase, mainFrame, sides };
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

  return { root, latPull, elliptical, airWalker };
}
