/* =========================================================================
   2. OUTDOOR ELLIPTICAL TRAINER
   ========================================================================= */

const EL_FRONT_P1 = [1.16, -0.58]; // Y, Z poros stang depan
const EL_REAR_P2  = [0.36,  0.86]; // Y, Z poros belakang rendah kompak
const EL_H_UP     = 0.9;          // stang pegangan atas
const EL_H_DOWN   = 1;          // pipa stang bawah ke engsel pedal
const EL_L_REAR   = 0.2;          // engkol belakang
const EL_PEDAL_BEAM_LEN = 1.45;
const EL_SIDE_X   = 0.23;          // jarak sisi Kanan/Kiri

function beamBoxMatrix(p1, p2, w, d) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1], dz = p2[2] - p1[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return Mat4.scaling(0, 0, 0);
  const dir = [dx / len, dy / len, dz / len];
  const ax = dir[2], az = -dir[0];
  const al = Math.hypot(ax, az);
  let R;
  if (al < 1e-6) R = dir[1] > 0 ? Mat4.identity() : Mat4.rotationX(Math.PI);
  else R = Mat4.fromAxisAngle(ax / al, 0, az / al, Math.acos(clamp(dir[1], -1, 1)));
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
  return Mat4.multiply(
    Mat4.translation(mid[0], mid[1], mid[2]),
    Mat4.multiply(R, Mat4.scaling(w, len, d))
  );
}

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
    .addPipe([0, 0.14, -0.42], [0, 0.14, 0.7], 0.080, MAT.blue)
    .addSphere([0, 0.14, -0.42], 0.080, MAT.blue)
    .addSphere([0, 0.14, 0.7], 0.080, MAT.blue);

  mainFrame
    .addPipe([0, 0.14, -0.42], [0, 0.40, -0.58], 0.080, MAT.blue)
    .addSphere([0, 0.40, -0.58], 0.080, MAT.blue)
    .addPipe([0, 0.40, -0.58], [0, EL_FRONT_P1[0] + 0.08, -0.58], 0.080, MAT.blue)
    .addSphere([0, EL_FRONT_P1[0] + 0.08, -0.58], [0.092, 0.065, 0.092], MAT.blue);

  mainFrame
    .addPipe([-0.15, EL_FRONT_P1[0], EL_FRONT_P1[1]], [0.15, EL_FRONT_P1[0], EL_FRONT_P1[1]], 0.044, MAT.blue)
    .addPipe([-0.23, EL_FRONT_P1[0], EL_FRONT_P1[1]], [0.23, EL_FRONT_P1[0], EL_FRONT_P1[1]], 0.034, MAT.silver)
    .addSphere([0.23, EL_FRONT_P1[0], EL_FRONT_P1[1]], 0.034, MAT.silver)
    .addSphere([-0.23, EL_FRONT_P1[0], EL_FRONT_P1[1]], 0.034, MAT.silver);

  mainFrame
    .addPipe([0, 0.14, 0.7], [0, EL_REAR_P2[0], EL_REAR_P2[1]], 0.080, MAT.blue)
    .addPipe([-0.12, EL_REAR_P2[0], EL_REAR_P2[1]], [0.12, EL_REAR_P2[0], EL_REAR_P2[1]], 0.032, MAT.blue)
    .addSphere([0.12, EL_REAR_P2[0], EL_REAR_P2[1]], 0.034, MAT.blue)
    .addSphere([-0.12, EL_REAR_P2[0], EL_REAR_P2[1]], 0.034, MAT.blue);

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
      .addPipe([0, 0, 0], [sign * 0.05, 0.50, -0.05], 0.026, MAT.silver)
      .addSphere([sign * 0.05, 0.50, -0.05], 0.026, MAT.silver)
      .addPipe([sign * 0.05, 0.50, -0.05], [sign * 0.05, EL_H_UP, -0.015], 0.026, MAT.silver)
      .addPipe([sign * 0.05, 0.60, -0.045], [sign * 0.05, EL_H_UP, -0.015], 0.032, MAT.black)
      .addSphere([sign * 0.05, EL_H_UP, -0.015], 0.032, MAT.black);

    const rearPivot = mainFrame.add(createNode('RearPivotNode' + tag, meshes));
    rearPivot.translation = [xPos, EL_REAR_P2[0], EL_REAR_P2[1]];
    rearPivot.rotation = [0, 0, 0];

    const rearLink = rearPivot.add(createNode('RearLink' + tag, meshes));
    rearLink
      .addPipe([sign * -0.1, 0, 0], [sign * -0.1, EL_L_REAR * sign, 0], 0.022, MAT.blue)
      .addSphere([sign * -0.1, EL_L_REAR * sign, 0], 0.028, MAT.blue)
      .addPipe([sign * -0.1, EL_L_REAR * sign, 0], [0, EL_L_REAR * sign, 0], 0.024, MAT.blue)
      .addSphere([0, EL_L_REAR * sign, 0], 0.028, MAT.silver);

    const pedalBeam = mainFrame.add(createNode('PedalBeam' + tag, meshes));
    pedalBeam.override = Mat4.identity();
    pedalBeam.parts.push({ mesh: meshes.box, matrix: Mat4.identity(), mat: MAT.silver });
    pedalBeam.parts.push({ mesh: meshes.box, matrix: Mat4.identity(), mat: MAT.pedalPlate });
    pedalBeam.parts.push({ mesh: meshes.box, matrix: Mat4.identity(), mat: MAT.silver });
    pedalBeam.parts.push({ mesh: meshes.box, matrix: Mat4.identity(), mat: MAT.silver });

    return { tag, sign, xPos, frontPivot, handlebar, rearPivot, rearLink, pedalBeam, stride: 0, phi: sign > 0 ? 0 : 180 };
  }

  const sides = [
    buildEllipticalSide('R', +1),
    buildEllipticalSide('L', -1)
  ];

  return { baseNode, concreteBase, mainFrame, sides };
}
