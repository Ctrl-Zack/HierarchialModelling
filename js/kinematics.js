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

const armPoint  = (S, mainFrame) => Mat4.transformPoint(chainMatrix(S.arm, mainFrame), S.armAttach);
const seatPoint = (S, mainFrame) => Mat4.transformPoint(chainMatrix(S.seat, mainFrame), S.seatAttach);

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

function ellipticalRearCandidates(S, Jf) {
  const dy = Jf[1] - EL_REAR_P2[0];
  const dz = Jf[2] - EL_REAR_P2[1];
  const centerDist = Math.hypot(dy, dz);
  const along = (EL_L_REAR ** 2 - S.beamLen ** 2 + centerDist ** 2) / (2 * centerDist);
  const heightSquared = EL_L_REAR ** 2 - along ** 2;
  // if (heightSquared < -1e-8) {
  //   throw new Error(`Elliptical linkage cannot reach stride ${S.stride}°.`);
  // }

  const height = Math.sqrt(Math.max(0, heightSquared));
  const unitY = dy / centerDist;
  const unitZ = dz / centerDist;
  return [-1, 1].map(branch => {
    const y = EL_REAR_P2[0] + along * unitY - branch * height * unitZ;
    const z = EL_REAR_P2[1] + along * unitZ + branch * height * unitY;
    return {
      y,
      z,
      phi: Math.atan2((z - EL_REAR_P2[1]) / S.sign, (y - EL_REAR_P2[0]) / S.sign) / DEG
    };
  });
}

function ellipticalAngleDifference(a, b) {
  return Math.atan2(Math.sin((a - b) * DEG), Math.cos((a - b) * DEG));
}

function initEllipticalSide(S) {
  S.beamLen = EL_PEDAL_BEAM_LEN;
  const initialJf = [S.xPos, EL_FRONT_P1[0] - EL_H_DOWN, EL_FRONT_P1[1]];
  const referencePhi = 0;
  const initCandidate = ellipticalRearCandidates(S, initialJf).reduce((best, candidate) =>
    Math.abs(ellipticalAngleDifference(candidate.phi, referencePhi)) <
      Math.abs(ellipticalAngleDifference(best.phi, referencePhi))
      ? candidate
      : best
  );
  S.phi = initCandidate.phi;
  S.prevJrY = initCandidate.y;
  S.prevJrZ = initCandidate.z;
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

  // Intersect the rear-crank and pedal-beam circles, then keep the nearest branch.
  // Gunakan jarak Euclidean ke posisi Jr sebelumnya — lebih stabil dari perbandingan sudut.
  const { y: rearY, z: rearZ } = ellipticalRearCandidates(S, Jf).reduce((best, candidate) =>
    Math.hypot(candidate.y - S.prevJrY, candidate.z - S.prevJrZ) <
    Math.hypot(best.y    - S.prevJrY, best.z    - S.prevJrZ)
      ? candidate : best
  );
  S.prevJrY = rearY;
  S.prevJrZ = rearZ;
  const dy_r = rearY - EL_REAR_P2[0];
  const dz_r = rearZ - EL_REAR_P2[1];
  const phi = Math.atan2(dz_r / S.sign, dy_r / S.sign) / DEG;
  S.phi = phi;
  S.rearPivot.rotation[0] = phi;

  const Jr = [S.xPos, rearY, rearZ];

  // 3) Update geometri batang pedal dan pelat pijakan kaki horizontal di atas lantai
  S.pedalBeam.parts[0].matrix = beamBoxMatrix(Jf, Jr, 0.1, 0.025);

  const tPlate = 0.44;
  const Pplate = [
    S.xPos,
    Jf[1] + tPlate * (Jr[1] - Jf[1]) + 0.030,
    Jf[2] + tPlate * (Jr[2] - Jf[2])
  ];

  const beamDy = Jr[1] - Jf[1], beamDz = Jr[2] - Jf[2];
  const beamAngleX = -Math.atan2(beamDy, beamDz);
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
