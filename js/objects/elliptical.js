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
