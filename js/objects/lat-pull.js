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
        .addBox([0.17, 0.34, 0.04], [sgn * 0.535, LP_PIVOT_Y, zs * 0.11], MAT.blue)
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
      .addPipe([0, 0, -0.075], [0, 0, 0.075], 0.075, MAT.yellow)
      .addPipe([0, 0, -0.185], [0, 0, 0.185], 0.03, MAT.silver);

    // Ekor tuas belakang (menghubungkan pin ke Link Rod)
    for (const zs of [1, -1]) {
      arm.addBox([0.38, 0.06, 0.03], [-0.13, 0, zs * 0.16], MAT.silver)
         .addPipe([0, 0, zs * 0.145], [0, 0, zs * 0.175], 0.06, MAT.silver);
    }
    arm.addPipe([LP_ARM_ATTACH[0], 0, 0.16], [LP_ARM_ATTACH[0], 0, LP_PIN_Z + 0.02], 0.022, MAT.silver)
       .addPipe([LP_ARM_ATTACH[0], 0, LP_PIN_Z - 0.015], [LP_ARM_ATTACH[0], 0, LP_PIN_Z + 0.02], 0.04, MAT.silver);

    arm
      .addPipe([0.07, 0, 0], [0.28, 0, 0], 0.055, MAT.yellow)
      .addPipe([0, 0, 0], [0.55, 0, 0], 0.04, MAT.yellow)
      .addSphere([0.55, 0, 0], 0.04, MAT.yellow)
      .addPipe([0.55, 0, 0], [0.85, 0, 0.34], 0.034, MAT.yellow)
      .addPipe([0.55, 0, 0], [0.85, 0, -0.34], 0.034, MAT.yellow)
      .addSphere([0.85, 0, 0.34], 0.034, MAT.yellow)
      .addSphere([0.85, 0, -0.34], 0.034, MAT.yellow)
      .addPipe([0.85, 0, 0.34], [1.45, 0, 0.34], 0.034, MAT.yellow)
      .addPipe([0.85, 0, -0.34], [1.45, 0, -0.34], 0.034, MAT.yellow);

    for (const [i, z] of [[1, 0.34], [2, -0.34]]) {
      const grip = arm.add(createNode('GripNode' + tag + i, meshes));
      grip.translation = [1.45, 0, z];
      grip.rotation = [0, z > 0 ? 90 : -90, 0];
      arm.addSphere([1.45, 0, z], 0.034, MAT.yellow);
      grip.addPipe([0, 0, 0], [0.04, 0, 0], 0.05, MAT.silver)
        .addPipe([0.04, 0, 0], [0.26, 0, 0], 0.042, MAT.black)
        .addSphere([0.26, 0, 0], 0.042, MAT.black);
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
      .addPipe([LP_LEG_X, -0.53, 0], [LP_LEG_X, 0.25, 0], 0.035, MAT.yellow)
      .addBox([0.56, 0.045, 0.44], [LP_LEG_X + 0.26, 0.26, 0], MAT.silver)
      .addPipe([LP_LEG_X + 0.04, 0.26, 0], [LP_LEG_X - 0.02, 0.37, 0], 0.035, MAT.yellow)
      .addPipe([LP_LEG_X - 0.02, 0.37, 0], [LP_LEG_X - 0.03, 0.47, 0], 0.035, MAT.yellow)
      .addBox([0.045, 0.38, 0.38], [LP_LEG_X - 0.035, 0.62, 0], MAT.yellow, [0, 0, 6])
      .addPipe([LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], 0], [LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], LP_PIN_Z + 0.02], 0.025, MAT.yellow)
      .addPipe([LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], LP_PIN_Z - 0.015], [LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], LP_PIN_Z + 0.02], 0.04, MAT.silver);

    for (const yp of [0, -0.32]) {
      for (const zs of [1, -1]) {
        seat.addPipe([-0.04, yp, zs * 0.052], [0.08, yp, zs * 0.052], 0.02, MAT.yellow);
      }
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
