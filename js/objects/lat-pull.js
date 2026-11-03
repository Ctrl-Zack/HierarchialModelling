/* =========================================================================
   LAT PULL DOWN / CHEST PRESS
   ========================================================================= */

const LP_GROUND = 0.04;
const LP_COL_R = 0.08;
const LP_PLATE_Y = 2.18;
const LP_Z0 = 0.095;
const LP_PIVOT_X = 0.32, LP_PIVOT_Y = 2.24;
const LP_PIVOT_SHAFT_HALF = 0.18;
const LP_REST_DEG = 4;
const LP_PIN_ARM = 0;
const LP_ROD_Z = 0;
const LP_RAIL_X = 0.13;
const LP_RAIL_Y = [0.25, 0.50];
const LP_RAIL_LEN = 0.50;
const LP_LEG_X = 0.07;
const LP_ARM_ATTACH = [-0.12, -0.12, LP_PIN_ARM];

function lpStem(t) {
  const points = [[LP_LEG_X, 0.16], [LP_LEG_X, 0.36], [-0.10, 0.40], [-0.12, 0.62]];
  const u = 1 - t;
  return [0, 1].map(k =>
    u * u * u * points[0][k] +
    3 * u * u * t * points[1][k] +
    3 * u * t * t * points[2][k] +
    t * t * t * points[3][k]
  );
}

const LP_SEAT_ATTACH = [lpStem(1)[0] - 0.06, lpStem(1.3)[1], LP_ROD_Z];

function buildLatPullMachine(baseNode, meshes) {
  const D = Math.PI / 180;
  const addPart = (node, mesh, matrix, mat) => {
    node.parts.push({ mesh, matrix, mat });
    return node;
  };
  const disc = (node, pos, radiusX, thickness, radiusZ, rotation, mat) =>
    addPart(node, meshes.cylinder,
      Mat4.multiply(
        Mat4.translation(pos[0], pos[1], pos[2]),
        Mat4.multiply(Mat4.rotationZ(rotation * D), Mat4.scaling(radiusX, thickness, radiusZ))
      ),
      mat
    );
  const bolt = (node, pos, radius) =>
    addPart(node, meshes.sphere,
      Mat4.multiply(Mat4.translation(pos[0], pos[1], pos[2]), Mat4.scaling(radius, radius, radius * 0.55)),
      MAT.silver
    );

  const concreteBase = baseNode.add(createNode('ConcreteBase_LatPull', meshes));
  concreteBase.addBox([2.8, LP_GROUND, 1.3], [0, LP_GROUND / 2, 0], MAT.concrete);

  const mainFrame = baseNode.add(createNode('MainFrame_LatPull', meshes));
  mainFrame
    .addPipe([0, LP_GROUND, 0], [0, LP_GROUND + 0.03, 0], 0.15, MAT.blue)
    .addPipe([0, LP_GROUND + 0.03, 0], [0, 2.28, 0], LP_COL_R, MAT.blue)
    .addSphere([0, 2.28, 0], [LP_COL_R, 0.10, LP_COL_R], MAT.blue);

  for (let k = 0; k < 4; k++) {
    const angle = (45 + 90 * k) * D;
    mainFrame.addSphere(
      [0.115 * Math.cos(angle), LP_GROUND + 0.034, 0.115 * Math.sin(angle)],
      [0.022, 0.012, 0.022],
      MAT.silver
    );
  }

  const plateThickness = 0.035;
  for (const zSign of [1, -1]) {
    const zPos = zSign * LP_Z0;
    mainFrame.addBox([0.30, 0.20, plateThickness], [0, LP_PLATE_Y, zPos], MAT.blue);

    mainFrame.addPrism([0.18, 0.20, plateThickness], [-0.15, 2.28, zPos], MAT.blue, [0, 0, 180]);
    mainFrame.addPrism([0.20, 0.18, plateThickness], [0.15, 2.28, zPos], MAT.blue, [0, 0, -90]);

    bolt(mainFrame, [-0.10, 2.105, zPos + zSign * 0.024], 0.026);
    bolt(mainFrame, [0.10, 2.105, zPos + zSign * 0.024], 0.026);
  }


  for (const y of LP_RAIL_Y) {
    mainFrame.addPipe([0, y - 0.04, 0], [0, y + 0.04, 0], LP_COL_R + 0.012, MAT.blue);
    for (const sign of [1, -1]) {
      for (const zSign of [1, -1]) {
        mainFrame.addBox([0.10, 0.07, 0.012], [sign * 0.125, y, zSign * 0.042], MAT.blue);
      }
      mainFrame.addPipe([sign * LP_RAIL_X, y, -0.052], [sign * LP_RAIL_X, y, 0.052], 0.01, MAT.silver);
      bolt(mainFrame, [sign * LP_RAIL_X, y, 0.056], 0.024);
      bolt(mainFrame, [sign * LP_RAIL_X, y, -0.056], 0.024);
    }
  }

  function buildLPSide(tag, sign) {
    const yaw = sign > 0 ? 0 : 180;
    const armAttach = [LP_ARM_ATTACH[0], LP_ARM_ATTACH[1], sign * LP_ARM_ATTACH[2]];
    const seatAttach = [LP_SEAT_ATTACH[0], LP_SEAT_ATTACH[1], sign * LP_SEAT_ATTACH[2]];

    const pivot = mainFrame.add(createNode('UpperPivotNode' + tag, meshes));
    pivot.translation = [sign * LP_PIVOT_X, LP_PIVOT_Y, 0];
    pivot.rotation = [0, yaw, LP_REST_DEG];

    const arm = pivot.add(createNode('MovingArm' + tag, meshes));
    const armRadius = 0.018, halfSpan = 0.30, bendX = 0.40, gripX = 1.05;
    for (const zSign of [1, -1]) {
      arm
        .addPipe([0, 0, zSign * 0.14], [0, 0, zSign * 0.12], 0.05, MAT.silver)
        .addPipe([0, 0, 0], [0, 0, zSign * 0.12], 0.02, MAT.silver)
        .addPipe([0.1, 0, 0], [0.1, 0, zSign * halfSpan], armRadius, MAT.silver)
        .addSphere([0.1, 0, zSign * halfSpan], armRadius, MAT.silver)
        .addPipe([0.1, 0, zSign * halfSpan], [gripX, 0, zSign * halfSpan], armRadius, MAT.silver)
        .addSphere([gripX, 0, zSign * halfSpan], armRadius, MAT.silver);
    }
    arm
      .addPipe([0, 0, 0], [0.1, 0, 0], 0.02, MAT.silver)
      .addPipe([0, 0, 0], [armAttach[0], armAttach[1], 0], 0.02, MAT.silver);
    bolt(arm, [armAttach[0], armAttach[1], 0], 0.05);

    for (const [index, zSign] of [[1, 1], [2, -1]]) {
      const grip = arm.add(createNode('GripNode' + tag + index, meshes));
      grip.translation = [gripX, 0, zSign * halfSpan];
      grip.rotation = [0, zSign > 0 ? 90 : -90, 0];
      grip
        .addPipe([0, 0, 0], [0.03, 0, 0], 0.026, MAT.silver)
        .addPipe([0.03, 0, 0], [0.14, 0, 0], 0.024, MAT.black)
        .addSphere([0.14, 0, 0], 0.024, MAT.black);
    }

    const railU = mainFrame.add(createNode('RailUpper' + tag, meshes));
    railU.translation = [sign * LP_RAIL_X, LP_RAIL_Y[1], 0];
    railU.rotation = [0, yaw, 0];
    const railL = mainFrame.add(createNode('RailLower' + tag, meshes));
    railL.translation = [sign * LP_RAIL_X, LP_RAIL_Y[0], 0];
    railL.rotation = [0, yaw, 0];
    for (const rail of [railU, railL]) {
      rail
        .addPipe([0, 0, -0.03], [0, 0, 0.03], 0.03, MAT.silver)
        .addPipe([0, 0, 0], [LP_RAIL_LEN, 0, 0], 0.02, MAT.silver)
        .addPipe([LP_RAIL_LEN, 0, -0.03], [LP_RAIL_LEN, 0, 0.03], 0.03, MAT.silver);
    }

    const seat = railU.add(createNode('SeatNode' + tag, meshes));
    seat.translation = [LP_RAIL_LEN, 0, 0];
    const legBottom = LP_GROUND - LP_RAIL_Y[1];
    seat
      .addPipe([LP_LEG_X, legBottom, 0], [LP_LEG_X, 0.16, 0], 0.025, MAT.silver);
    disc(seat, [LP_LEG_X + 0.20, 0.175, 0], 0.25, 0.035, 0.25, 0, MAT.silver);

    let previous = lpStem(0);
    for (let i = 1; i <= 8; i++) {
      const point = lpStem(i / 8);
      seat.addPipe([previous[0], previous[1], 0], [point[0], point[1], 0], 0.02, MAT.silver);
      if (i < 8) seat.addSphere([point[0], point[1], 0], 0.02, MAT.silver);
      previous = point;
    }
    disc(seat, [-0.135, 0.81, 0], 0.19, 0.03, 0.19, 98, MAT.silver);
    seat
      .addPipe(
        [seatAttach[0], seatAttach[1], -0.035],
        [seatAttach[0], seatAttach[1], 0.035],
        0.013,
        MAT.silver
      );
    bolt(seat, [seatAttach[0], seatAttach[1], 0], 0.022);

    for (const y of [0, LP_RAIL_Y[0] - LP_RAIL_Y[1]]) {
      for (const zSign of [1, -1]) {
        seat.addBox([0.08, 0.06, 0.012], [0.03, y, zSign * 0.042], MAT.silver);
      }
      seat.addPipe([0, y, -0.052], [0, y, 0.052], 0.01, MAT.silver);
      bolt(seat, [0, y, 0.056], 0.024);
      bolt(seat, [0, y, -0.056], 0.024);
    }

    const rod = mainFrame.add(createNode('LinkRod' + tag, meshes));
    rod.parts.push({ mesh: meshes.cylinder, matrix: Mat4.identity(), mat: MAT.rod });
    rod.override = Mat4.identity();

    return {
      tag, sign, pivot, arm, railU, railL, seat, rod, armAttach, seatAttach,
      L: 1, alpha: 0, lift: 0, pull: 0
    };
  }

  const sides = [buildLPSide('R', 1), buildLPSide('L', -1)];
  return { baseNode, concreteBase, mainFrame, sides };
}
