'use strict';

/**
 * Kinematics Mechanism Solver (Pull Angle -> Seat Lift & Rod Constraint)
 *
 * (1) Lengan = tuas dua sisi dengan tumpuan di UpperPivotNode:
 *     stang (luar) turun  <=>  pin tuas dalam (titik A) naik.
 * (2) Link rod = batang kaku, panjang L tetap, menggantung dari A ke titik B pada RailUpper.
 * (3) Kedua rel (sama panjang, sejajar) berpivot di klem tiang DAN di kaki kursi
 *     = mekanisme jajar genjang: saat rel berayun sudut alpha, kaki kursi naik
 *     sebesar RAIL_LEN * sin(alpha) tetapi TETAP TEGAK (SeatNode diputar -alpha).
 * (4) alpha dicari dari syarat |A - B(alpha)| = L (bisection).
 */

function chainMatrix(node, stop) {
  let m = Mat4.identity();
  for (let n = node; n && n !== stop; n = n.parent) {
    m = Mat4.multiply(n.localMatrix(), m);
  }
  return m;
}

const armPoint  = (S, mainFrame) => Mat4.transformPoint(chainMatrix(S.arm, mainFrame), ARM_ATTACH);
const railPoint = (S, mainFrame) => Mat4.transformPoint(chainMatrix(S.railU, mainFrame), RAIL_ATTACH);

function initSide(S, mainFrame) {
  S.pivot.rotation[2] = REST_DEG;
  S.railU.rotation[2] = 0;
  S.railL.rotation[2] = 0;
  S.seat.rotation[2] = 0;
  const A = armPoint(S, mainFrame);
  const B = railPoint(S, mainFrame);
  S.L = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); // panjang link rod (konstan)
}

function solveSide(S, pullDeg, mainFrame) {
  S.pull = pullDeg;
  S.pivot.rotation[2] = REST_DEG - pullDeg;                // (1) putar engsel lengan
  const A = armPoint(S, mainFrame);                       // (2) titik atas rod

  const dist = a => {                                     // jarak |A - B(alpha)|
    S.railU.rotation[2] = a;
    const B = railPoint(S, mainFrame);
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
  };

  let lo = -5, hi = 70;                                   // (4) bisection
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (dist(mid) > S.L) lo = mid; else hi = mid;
  }
  const alpha = (lo + hi) / 2;
  S.railU.rotation[2] = alpha;                            // (3) rel atas & bawah berayun
  S.railL.rotation[2] = alpha;
  S.seat.rotation[2]  = -alpha;                           // kompensasi pivot kaki -> tetap tegak
  S.alpha = alpha;
  S.lift = RAIL_LEN * Math.sin(alpha * DEG);              // tinggi angkat
  S.rod.override = pipeMatrix(A, railPoint(S, mainFrame), 0.028); // (5) rod A -> B
}
