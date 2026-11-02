'use strict';

/**
 * Kinematics Mechanism Solvers for Three Outdoor Fitness Machines:
 * 1. Lat Pull Down / Chest Press (Closed-loop parallelogram & link rod solver)
 * 2. Outdoor Elliptical Trainer (Planar Four-Bar Linkage solver)
 * 3. Outdoor Air Walker / Space Walker (Pendulum Leg Swing solver)
 */

/* =========================================================================
   1. LAT PULL DOWN KINEMATICS
   ========================================================================= */

function chainMatrix(node, stop) {
  let m = Mat4.identity();
  for (let n = node; n && n !== stop; n = n.parent) {
    m = Mat4.multiply(n.localMatrix(), m);
  }
  return m;
}

const armPoint  = (S, mainFrame) => Mat4.transformPoint(chainMatrix(S.arm, mainFrame), LP_ARM_ATTACH);
const seatPoint = (S, mainFrame) => Mat4.transformPoint(chainMatrix(S.seat, mainFrame), LP_SEAT_ATTACH);

function initSide(S, mainFrame) {
  S.pivot.rotation[2] = LP_REST_DEG;
  S.railU.rotation[2] = 0;
  S.railL.rotation[2] = 0;
  S.seat.rotation[2] = 0;
  const A = armPoint(S, mainFrame);
  const B = seatPoint(S, mainFrame);
  S.L = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

function solveSide(S, pullDeg, mainFrame) {
  S.pull = pullDeg;
  S.pivot.rotation[2] = LP_REST_DEG - pullDeg;
  const A = armPoint(S, mainFrame);

  const dist = a => {
    S.railU.rotation[2] = a;
    S.seat.rotation[2]  = -a;
    const B = seatPoint(S, mainFrame);
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
  };

  let lo = -5, hi = 70;
  for (let i = 0; i < 45; i++) {
    const mid = (lo + hi) / 2;
    if (dist(mid) > S.L) lo = mid; else hi = mid;
  }
  const alpha = (lo + hi) / 2;
  S.railU.rotation[2] = alpha;
  S.railL.rotation[2] = alpha;
  S.seat.rotation[2]  = -alpha;
  S.alpha = alpha;
  S.lift = LP_RAIL_LEN * Math.sin(alpha * DEG);
  S.rod.override = pipeMatrix(A, seatPoint(S, mainFrame), 0.028);
}


/* =========================================================================
   2. OUTDOOR ELLIPTICAL TRAINER KINEMATICS (Four-Bar Linkage)
   ========================================================================= */

function initEllipticalSide(S) {
  const Jf0 = [S.xPos, EL_FRONT_P1[0] - EL_H_DOWN, EL_FRONT_P1[1]];
  const Jr0 = [S.xPos, EL_REAR_P2[0] - EL_L_REAR,  EL_REAR_P2[1]];
  S.beamLen = Math.hypot(Jr0[1] - Jf0[1], Jr0[2] - Jf0[2]);
}

function solveEllipticalSide(S, strideDeg) {
  S.stride = strideDeg;
  const thRad = strideDeg * DEG;

  // 1) Titik engsel stang depan bawah Jf
  const Jf = [
    S.xPos,
    EL_FRONT_P1[0] - EL_H_DOWN * Math.cos(thRad),
    EL_FRONT_P1[1] - EL_H_DOWN * Math.sin(thRad)
  ];
  S.frontPivot.rotation[0] = strideDeg;

  // 2) Titik engsel ayun belakang Jr (kompak dekat lantai)
  const calcJr = phiDeg => {
    const pRad = phiDeg * DEG;
    return [
      S.xPos,
      EL_REAR_P2[0] - EL_L_REAR * Math.cos(pRad),
      EL_REAR_P2[1] - EL_L_REAR * Math.sin(pRad)
    ];
  };

  let lo = -65, hi = 65;
  for (let i = 0; i < 35; i++) {
    const mid = (lo + hi) / 2;
    const Jr = calcJr(mid);
    const d = Math.hypot(Jr[1] - Jf[1], Jr[2] - Jf[2]);
    if (d > S.beamLen) lo = mid; else hi = mid;
  }
  const phi = (lo + hi) / 2;
  S.phi = phi;
  S.rearPivot.rotation[0] = phi;

  const Jr = calcJr(phi);

  // 3) Update geometri batang pedal dan pelat pijakan kaki horizontal di atas lantai
  S.pedalBeam.parts[0].matrix = pipeMatrix(Jf, Jr, 0.024);

  const tPlate = 0.44;
  const Pplate = [
    S.xPos,
    Jf[1] + tPlate * (Jr[1] - Jf[1]) + 0.030,
    Jf[2] + tPlate * (Jr[2] - Jf[2])
  ];

  const dy = Jr[1] - Jf[1], dz = Jr[2] - Jf[2];
  const beamAngleX = -Math.atan2(dy, dz);
  const degX = beamAngleX / DEG;

  let mPlate = Mat4.translation(Pplate[0], Pplate[1], Pplate[2]);
  mPlate = Mat4.rotateX(mPlate, degX * DEG);

  S.pedalBeam.parts[1].matrix = Mat4.scale(mPlate, 0.19, 0.026, 0.38);

  const mLeftLip = Mat4.translate(mPlate, -0.090, 0.012, 0);
  S.pedalBeam.parts[2].matrix = Mat4.scale(mLeftLip, 0.012, 0.038, 0.38);

  const mRightLip = Mat4.translate(mPlate, +0.090, 0.012, 0);
  S.pedalBeam.parts[3].matrix = Mat4.scale(mRightLip, 0.012, 0.038, 0.38);

  S.pedalPos = Pplate;
}


/* =========================================================================
   3. OUTDOOR AIR WALKER KINEMATICS (Pendulum Leg Swing)
   ========================================================================= */

function solveAirWalkerSide(S, swingDeg) {
  S.swing = swingDeg;
  // Pendulum berputar pada sumbu X (maju/mundur)
  S.pivot.rotation[0] = swingDeg;
}
