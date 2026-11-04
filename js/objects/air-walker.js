const AW_PIVOT_Y = 1.35;
const AW_ARM_LEN = 0.98;
const AW_SIDE_X  = 0.29;

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
    .addPipe([-0.44, 0.22, 0], [0.44, 0.22, 0], 0.065, MAT.blue)
    .addSphere([-0.44, 0.22, 0], 0.065, MAT.blue)
    .addSphere([0.44, 0.22, 0], 0.065, MAT.blue);

  for (const sgn of [1, -1]) {
    mainFrame
      .addPipe([sgn * 0.44, 0.22, 0], [sgn * 0.44, AW_PIVOT_Y + 0.18, 0], 0.065, MAT.blue)
      .addSphere([sgn * 0.44, AW_PIVOT_Y + 0.18, 0], [0.075, 0.06, 0.075], MAT.blue)
      .addPipe([sgn * 0.44, AW_PIVOT_Y, 0], [sgn * (AW_SIDE_X + 0.02), AW_PIVOT_Y, 0], 0.036, MAT.silver)
      .addSphere([sgn * (AW_SIDE_X + 0.02), AW_PIVOT_Y, 0], 0.038, MAT.silver);
  }

  const HZ = -0.16, HY = 1.6;
  mainFrame
    .addPipe([-0.38, HY, HZ], [0.38, HY, HZ], 0.028, MAT.blue)
    .addSphere([-0.38, HY, HZ], 0.032, MAT.blue)
    .addSphere([0.38, HY, HZ], 0.032, MAT.blue)
    .addPipe([-0.26, HY, HZ], [-0.08, HY, HZ], 0.033, MAT.black)
    .addPipe([0.08, HY, HZ], [0.26, HY, HZ], 0.033, MAT.black);

  for (const sgn of [1, -1]) {
    mainFrame.addPipe([sgn * 0.44, 1.4, 0], [sgn * 0.38, HY, HZ], 0.028, MAT.blue);
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

    const footPos = [-sign * 0.1, -AW_ARM_LEN + 0.025, 0];
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
