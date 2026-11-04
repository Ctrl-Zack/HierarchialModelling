'use strict';

function buildUrbanParkEnvironment(envNode, meshes) {
  buildFigure8Lake(envNode, meshes);
  buildFigure8JoggingTrack(envNode, meshes);
  buildFitnessPad(envNode, meshes);
  buildShadeTrees(envNode, meshes);
  buildParkBenches(envNode, meshes);
  buildStreetlamps(envNode, meshes);
  buildParkBushes(envNode, meshes);
  buildParkAmenities(envNode, meshes);
  buildLakeEcosystem(envNode, meshes);

  return envNode;
}

const LAKE8 = {
  topCx: 0, topCz: -3.5,
  topRx: 5.2, topRz: 4.2,

  botCx: 0, botCz: 3.5,
  botRx: 5.2, botRz: 4.2,

  midCx: 0, midCz: 0,
  midRx: 4.0, midRz: 2.6,

  sandExtra: 0.85,
  shallowExtra: 0.35,
};

function buildFigure8Lake(parent, meshes) {
  const lakeRoot = parent.add(createNode('Figure8Lake', meshes));

  const {
    topCx, topCz, topRx, topRz,
    botCx, botCz, botRx, botRz,
    midCx, midCz, midRx, midRz,
    sandExtra, shallowExtra
  } = LAKE8;


  lakeRoot.addCylinder([topRx + sandExtra, topRz + sandExtra], 0.014,
    [topCx, 0.007, topCz], MAT.lakeSand);
  lakeRoot.addCylinder([botRx + sandExtra, botRz + sandExtra], 0.014,
    [botCx, 0.007, botCz], MAT.lakeSand);
  lakeRoot.addCylinder([midRx + sandExtra, midRz + sandExtra], 0.014,
    [midCx, 0.007, midCz], MAT.lakeSand);

  lakeRoot.addCylinder([topRx + shallowExtra, topRz + shallowExtra], 0.018,
    [topCx, 0.011, topCz], MAT.waterShallow);
  lakeRoot.addCylinder([botRx + shallowExtra, botRz + shallowExtra], 0.018,
    [botCx, 0.011, botCz], MAT.waterShallow);
  lakeRoot.addCylinder([midRx + shallowExtra, midRz + shallowExtra], 0.018,
    [midCx, 0.011, midCz], MAT.waterShallow);

  lakeRoot.addCylinder([topRx, topRz], 0.022,
    [topCx, 0.016, topCz], MAT.waterDeep);
  lakeRoot.addCylinder([botRx, botRz], 0.022,
    [botCx, 0.016, botCz], MAT.waterDeep);
  lakeRoot.addCylinder([midRx, midRz], 0.022,
    [midCx, 0.016, midCz], MAT.waterDeep);

  [1.4, 2.4, 3.4].forEach((r, idx) => {
    lakeRoot.addCylinder([r, r], 0.003 - idx * 0.0008,
      [topCx, 0.020, topCz], MAT.waterShallow);
  });
  [1.4, 2.4, 3.4].forEach((r, idx) => {
    lakeRoot.addCylinder([r, r], 0.003 - idx * 0.0008,
      [botCx, 0.020, botCz], MAT.waterShallow);
  });

  const rockConfigs = [

    { pos: [-4.8, 0.10, -5.8], s: [0.52, 0.26, 0.46], rot:  25, dark: true },
    { pos: [-3.2, 0.08, -7.2], s: [0.44, 0.22, 0.40], rot: -15, dark: false },
    { pos: [ 0.0, 0.12, -7.6], s: [0.58, 0.28, 0.52], rot:  40, dark: true },
    { pos: [ 3.2, 0.08, -7.2], s: [0.42, 0.22, 0.38], rot: -30, dark: false },
    { pos: [ 4.8, 0.10, -5.8], s: [0.50, 0.25, 0.45], rot:  55, dark: true },
    { pos: [-5.4, 0.09, -3.5], s: [0.46, 0.24, 0.42], rot: -20, dark: false },
    { pos: [ 5.4, 0.09, -3.5], s: [0.46, 0.24, 0.42], rot:  20, dark: false },


    { pos: [-4.2, 0.11, -1.2], s: [0.48, 0.24, 0.44], rot:  15, dark: true },
    { pos: [-4.2, 0.11,  1.2], s: [0.48, 0.24, 0.44], rot: -15, dark: true },
    { pos: [ 4.2, 0.11, -1.2], s: [0.46, 0.24, 0.42], rot: -25, dark: false },
    { pos: [ 4.2, 0.11,  1.2], s: [0.46, 0.24, 0.42], rot:  25, dark: false },


    { pos: [-5.4, 0.09,  3.5], s: [0.46, 0.24, 0.42], rot:  20, dark: false },
    { pos: [ 5.4, 0.09,  3.5], s: [0.46, 0.24, 0.42], rot: -20, dark: false },
    { pos: [-4.8, 0.10,  5.8], s: [0.52, 0.26, 0.46], rot: -25, dark: true },
    { pos: [-3.2, 0.08,  7.2], s: [0.44, 0.22, 0.40], rot:  15, dark: false },
    { pos: [ 0.0, 0.12,  7.6], s: [0.58, 0.28, 0.52], rot: -40, dark: true },
    { pos: [ 3.2, 0.08,  7.2], s: [0.42, 0.22, 0.38], rot:  30, dark: false },
    { pos: [ 4.8, 0.10,  5.8], s: [0.50, 0.25, 0.45], rot: -55, dark: true },


    { pos: [-2.6, 0.04,  0.0], s: [0.30, 0.14, 0.26], rot:  35, dark: true },
    { pos: [ 2.6, 0.04,  0.0], s: [0.28, 0.13, 0.25], rot: -45, dark: true },
    { pos: [ 0.0, 0.03, -1.8], s: [0.24, 0.11, 0.22], rot:  10, dark: true },
    { pos: [ 0.0, 0.03,  1.8], s: [0.24, 0.11, 0.22], rot: -10, dark: true },
  ];

  rockConfigs.forEach((rc, i) => {
    const rock = lakeRoot.add(createNode(`ShoreRock_${i + 1}`, meshes));
    rock.translation = [...rc.pos];
    rock.rotation = [0, rc.rot, 0];
    rock.addSphere([0, rc.s[1] * 0.7, 0], rc.s, rc.dark ? MAT.lakeRockDark : MAT.lakeRock);
  });
}

function buildFigure8JoggingTrack(parent, meshes) {
  const track = parent.add(createNode('Figure8JoggingTrack', meshes));

  const trackWidth = 1.45;

  const Rx = 7.7;
  const Rz = 6.4;
  const Cz = 3.5;

  const phi0 = Math.asin(Math.min(0.99, Cz / Rz))

  const rawPoints = [];
  const segPerLobe = 36;

  const phiStartTop = phi0;
  const phiEndTop = -Math.PI - phi0;
  for (let i = 0; i <= segPerLobe; i++) {
    const phi = phiStartTop + (i / segPerLobe) * (phiEndTop - phiStartTop);
    const x = Rx * Math.cos(phi);
    const z = -Cz + Rz * Math.sin(phi);
    rawPoints.push({ x, z });
  }
  const psiStartBot = Math.PI + phi0;
  const psiEndBot = -phi0;
  for (let i = 1; i < segPerLobe; i++) {
    const psi = psiStartBot + (i / segPerLobe) * (psiEndBot - psiStartBot);
    const x = Rx * Math.cos(psi);
    const z = Cz + Rz * Math.sin(psi);
    rawPoints.push({ x, z });
  }

  const numPts = rawPoints.length;
  let pts = rawPoints.map(p => ({ x: p.x, z: p.z }));

  for (let pass = 0; pass < 3; pass++) {
    const smoothed = [];
    for (let i = 0; i < numPts; i++) {
      const prev = pts[(i - 1 + numPts) % numPts];
      const curr = pts[i];
      const next = pts[(i + 1) % numPts];
      smoothed.push({
        x: 0.25 * prev.x + 0.50 * curr.x + 0.25 * next.x,
        z: 0.25 * prev.z + 0.50 * curr.z + 0.25 * next.z
      });
    }
    pts = smoothed;
  }

  for (let i = 0; i < numPts; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % numPts]

    const mx = (p1.x + p2.x) / 2;
    const mz = (p1.z + p2.z) / 2;
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const segLen = Math.hypot(dx, dz) * 1.06
    const rotYDeg = (-Math.atan2(dz, dx) * 180) / Math.PI;


    track.addBox([segLen, 0.020, trackWidth], [mx, 0.011, mz], MAT.pavingTrack, [0, rotYDeg, 0]);


    const perpX = -dz / Math.hypot(dx, dz);
    const perpZ = dx / Math.hypot(dx, dz);
    const halfW = trackWidth / 2;


    track.addBox([segLen, 0.026, 0.07],
      [mx + perpX * halfW, 0.014, mz + perpZ * halfW], MAT.pavingBorder, [0, rotYDeg, 0]);

    track.addBox([segLen, 0.026, 0.07],
      [mx - perpX * halfW, 0.014, mz - perpZ * halfW], MAT.pavingBorder, [0, rotYDeg, 0]);
  }
}

function buildFitnessPad(parent, meshes) {
  const pad = parent.add(createNode('FitnessPad', meshes));
  pad.translation = [11.5, 0, 0];

  pad.addBox([8.70, 0.016, 5.10], [1, 0.008, 0], MAT.pavingBorder);

  pad.addBox([8.40, 0.024, 4.80], [1, 0.012, 0], MAT.pavingTrack);

  pad.addBox([0.08, 0.002, 4.70], [-0.80, 0.025, 0], MAT.pavingBorder);
  pad.addBox([0.08, 0.002, 4.70], [ 2.80, 0.025, 0], MAT.pavingBorder);
}

function buildShadeTrees(parent, meshes) {
  const treesGroup = parent.add(createNode('ShadeTreesGroup', meshes));

  const treeConfigs = [

    { pos: [-5.8, 0, -10.2], s: 1.25, rot:  20 },
    { pos: [ 0.0, 0, -11.6], s: 1.30, rot:  45 },
    { pos: [ 5.8, 0, -10.2], s: 1.20, rot: -30 },


    { pos: [-9.8, 0, -4.2],  s: 1.15, rot:  60 },
    { pos: [-9.2, 0,  0.0],  s: 1.28, rot:  10 },
    { pos: [-9.8, 0,  4.2],  s: 1.18, rot: -40 },


    { pos: [-5.8, 0,  10.2], s: 1.22, rot:  80 },
    { pos: [ 0.0, 0,  11.6], s: 1.30, rot: -50 },
    { pos: [ 5.8, 0,  10.2], s: 1.20, rot:  35 },


    { pos: [17.4, 0, -4.2],  s: 1.15, rot: -25 },
    { pos: [17.4, 0,  4.2],  s: 1.18, rot:  55 },
    { pos: [11.5, 0, -6.6],  s: 1.10, rot: -70 },
    { pos: [11.5, 0,  6.6],  s: 1.12, rot:  65 },
  ];

  treeConfigs.forEach((cfg, idx) => {
    const treeNode = treesGroup.add(createNode(`Tree_${idx + 1}`, meshes));
    treeNode.translation = [...cfg.pos];
    treeNode.rotation = [0, cfg.rot, 0];

    const s = cfg.s;


    treeNode.addPipe([0, 0, 0], [0, 0.45 * s, 0], 0.22 * s, MAT.treeTrunk);
    treeNode.addPipe([0, 0.35 * s, 0], [0, 2.30 * s, 0], 0.14 * s, MAT.treeTrunk);
    treeNode.addPipe([0, 1.65 * s, 0], [0.45 * s, 2.45 * s, 0.35 * s], 0.075 * s, MAT.treeTrunk);
    treeNode.addPipe([0, 1.85 * s, 0], [-0.40 * s, 2.55 * s, -0.30 * s], 0.070 * s, MAT.treeTrunk);


    treeNode.addSphere([0, 2.75 * s, 0], [1.15 * s, 1.05 * s, 1.15 * s], MAT.treeCrownDark);
    treeNode.addSphere([0, 3.55 * s, 0], [0.85 * s, 0.85 * s, 0.85 * s], MAT.treeCrownLight);
    treeNode.addSphere([-0.65 * s, 2.75 * s, 0.25 * s], [0.82 * s, 0.78 * s, 0.82 * s], MAT.treeCrownDark);
    treeNode.addSphere([0.70 * s, 2.85 * s, -0.20 * s], [0.85 * s, 0.80 * s, 0.85 * s], MAT.treeCrownLight);
    treeNode.addSphere([0.15 * s, 2.65 * s, 0.65 * s], [0.75 * s, 0.72 * s, 0.75 * s], MAT.treeCrownDark);
    treeNode.addSphere([-0.20 * s, 3.05 * s, -0.60 * s], [0.78 * s, 0.75 * s, 0.78 * s], MAT.treeCrownLight);
  });
}

function buildParkBenches(parent, meshes) {
  const benchesGroup = parent.add(createNode('ParkBenchesGroup', meshes));

  const benchConfigs = [

    { pos: [-6.4, 0, -7.5], rotY:   40 },

    { pos: [ 6.4, 0, -7.5], rotY:  -40 },

    { pos: [-8.2, 0,  0.0], rotY:   90 },

    { pos: [-6.4, 0,  7.5], rotY:  140 },

    { pos: [ 6.4, 0,  7.5], rotY: -140 },

    { pos: [11.5, 0,  3.2], rotY:  180 },
  ];

  benchConfigs.forEach((cfg, idx) => {
    const bench = benchesGroup.add(createNode(`Bench_${idx + 1}`, meshes));
    bench.translation = [...cfg.pos];
    bench.rotation = [0, cfg.rotY, 0];

    const benchWidth = 1.36;
    const legX = benchWidth / 2 - 0.06;


    for (const sx of [-legX, legX]) {
      bench.addPipe([sx, 0, 0.16], [sx, 0.44, 0.16], 0.022, MAT.lampMetal);
      bench.addPipe([sx, 0, -0.16], [sx, 0.44, -0.16], 0.022, MAT.lampMetal);
      bench.addPipe([sx, 0.06, -0.20], [sx, 0.06, 0.20], 0.020, MAT.lampMetal);
      bench.addPipe([sx, 0.42, -0.18], [sx, 0.42, 0.18], 0.020, MAT.lampMetal);
      bench.addPipe([sx, 0.42, -0.16], [sx, 0.82, -0.24], 0.022, MAT.lampMetal);
      bench.addPipe([sx, 0.44, 0.16], [sx, 0.58, 0.14], 0.018, MAT.lampMetal);
      bench.addPipe([sx, 0.58, 0.14], [sx, 0.58, -0.18], 0.018, MAT.lampMetal);
    }


    [0.14, 0.04, -0.06, -0.15].forEach(sz => {
      bench.addBox([benchWidth, 0.024, 0.082], [0, 0.44, sz], MAT.woodBench);
    });


    const backY = [0.55, 0.65, 0.76];
    const backZ = [-0.19, -0.21, -0.23];
    backY.forEach((by, i) => {
      bench.addBox([benchWidth, 0.075, 0.022], [0, by, backZ[i]], MAT.woodBench, [-8, 0, 0]);
    });
  });
}

function buildStreetlamps(parent, meshes) {
  const lampsGroup = parent.add(createNode('StreetlampsGroup', meshes));

  const lampConfigs = [
    { pos: [-7.0, 0, -8.6], rotY:   45 },
    { pos: [ 7.0, 0, -8.6], rotY:  -45 },
    { pos: [-8.8, 0,  0.0], rotY:   90 },
    { pos: [-7.0, 0,  8.6], rotY:  135 },
    { pos: [ 7.0, 0,  8.6], rotY: -135 },
    { pos: [ 9.2, 0, -2.6], rotY:  -30 },
    { pos: [ 9.2, 0,  2.6], rotY:   30 },
  ];

  lampConfigs.forEach((cfg, idx) => {
    const lamp = lampsGroup.add(createNode(`Streetlamp_${idx + 1}`, meshes));
    lamp.translation = [...cfg.pos];
    lamp.rotation = [0, cfg.rotY, 0];


    lamp.addBox([0.34, 0.08, 0.34], [0, 0.04, 0], MAT.lampMetal);
    lamp.addPipe([0, 0.08, 0], [0, 0.45, 0], 0.10, MAT.lampMetal);
    lamp.addSphere([0, 0.46, 0], [0.11, 0.05, 0.11], MAT.lampMetal);


    lamp.addPipe([0, 0.46, 0], [0, 3.10, 0], 0.038, MAT.lampMetal);
    lamp.addSphere([0, 1.40, 0], [0.065, 0.035, 0.065], MAT.lampMetal);
    lamp.addSphere([0, 2.50, 0], [0.065, 0.035, 0.065], MAT.lampMetal);


    lamp.addPipe([0, 3.10, 0], [0, 3.25, 0], 0.055, MAT.lampMetal);
    lamp.addBox([0.28, 0.03, 0.28], [0, 3.26, 0], MAT.lampMetal);
    lamp.addBox([0.34, 0.04, 0.34], [0, 3.65, 0], MAT.lampMetal);
    lamp.addPipe([0, 3.65, 0], [0, 3.76, 0], 0.035, MAT.lampMetal);
    lamp.addSphere([0, 3.78, 0], 0.045, MAT.lampMetal);

    for (const sx of [-0.11, 0.11]) {
      for (const sz of [-0.11, 0.11]) {
        lamp.addPipe([sx, 3.26, sz], [sx * 1.15, 3.65, sz * 1.15], 0.012, MAT.lampMetal);
      }
    }

    lamp.addSphere([0, 3.44, 0], 0.088, MAT.lampGlow, 1);
  });
}

function buildParkBushes(parent, meshes) {
  const bushesGroup = parent.add(createNode('ParkBushesGroup', meshes));

  const bushConfigs = [

    { pos: [-6.8, 0, -9.6], scale: [0.42, 0.32, 0.40] },
    { pos: [-3.8, 0,-10.8], scale: [0.36, 0.28, 0.36] },
    { pos: [ 3.8, 0,-10.8], scale: [0.40, 0.30, 0.40] },
    { pos: [ 6.8, 0, -9.6], scale: [0.35, 0.26, 0.35] },


    { pos: [-9.4, 0, -2.4], scale: [0.42, 0.32, 0.42] },
    { pos: [-9.4, 0,  2.4], scale: [0.45, 0.34, 0.44] },


    { pos: [-6.8, 0,  9.6], scale: [0.44, 0.33, 0.42] },
    { pos: [-3.8, 0, 10.8], scale: [0.38, 0.28, 0.38] },
    { pos: [ 3.8, 0, 10.8], scale: [0.42, 0.31, 0.40] },
    { pos: [ 6.8, 0,  9.6], scale: [0.38, 0.28, 0.36] },


    { pos: [10.2, 0,  2.8], scale: [0.38, 0.28, 0.36] },
    { pos: [12.8, 0,  2.8], scale: [0.36, 0.26, 0.34] },
    { pos: [10.2, 0, -2.8], scale: [0.38, 0.28, 0.36] },
    { pos: [12.8, 0, -2.8], scale: [0.36, 0.26, 0.34] },
  ];

  bushConfigs.forEach((cfg, idx) => {
    const bush = bushesGroup.add(createNode(`Bush_${idx + 1}`, meshes));
    bush.translation = [...cfg.pos];
    bush.addSphere([0, cfg.scale[1] * 0.75, 0], cfg.scale, MAT.bush);
  });
}

function buildParkAmenities(parent, meshes) {
  const amenities = parent.add(createNode('ParkAmenities', meshes));

  const signWest = amenities.add(createNode('ParkSignpost_West', meshes));
  signWest.translation = [-9.5, 0, 0.0];
  signWest.rotation = [0, 90, 0];
  buildSignpost(signWest, meshes);

  const signSouth = amenities.add(createNode('ParkSignpost_South', meshes));
  signSouth.translation = [0, 0, 11.2];
  signSouth.rotation = [0, 180, 0];
  buildSignpost(signSouth, meshes);

  const trash1 = amenities.add(createNode('TrashBin_1', meshes));
  trash1.translation = [-7.6, 0, -6.8];
  trash1.rotation = [0, 45, 0];
  buildTrashBin(trash1, meshes);

  const trash2 = amenities.add(createNode('TrashBin_2', meshes));
  trash2.translation = [-7.6, 0,  6.8];
  trash2.rotation = [0, -45, 0];
  buildTrashBin(trash2, meshes);
}

function buildSignpost(signNode, meshes) {
  signNode.addPipe([-0.42, 0, 0], [-0.42, 1.35, 0], 0.035, MAT.treeTrunk);
  signNode.addPipe([ 0.42, 0, 0], [ 0.42, 1.35, 0], 0.035, MAT.treeTrunk);

  signNode.addBox([1.02, 0.52, 0.045], [0, 1.05, 0], MAT.signPlaque);
  signNode.addBox([1.06, 0.12, 0.055], [0, 1.32, 0], MAT.signGreen);
  signNode.addBox([1.04, 0.02, 0.050], [0, 0.78, 0], MAT.treeTrunk);
}

function buildTrashBin(trashNode, meshes) {
  trashNode.addPipe([0, 0, 0], [0, 0.85, 0], 0.030, MAT.lampMetal);
  trashNode.addPipe([-0.25, 0.65, 0], [0.25, 0.65, 0], 0.025, MAT.lampMetal);

  trashNode.addPipe([-0.25, 0.25, 0], [-0.25, 0.75, 0], 0.16, MAT.trashCanBody);
  trashNode.addSphere([-0.25, 0.76, 0], [0.16, 0.08, 0.16], MAT.trashCanBody);

  trashNode.addPipe([0.25, 0.25, 0], [0.25, 0.75, 0], 0.16, MAT.blue);
  trashNode.addSphere([0.25, 0.76, 0], [0.16, 0.08, 0.16], MAT.blue);
}

function buildLakeEcosystem(parent, meshes) {
  const ecoGroup = parent.add(createNode('LakeEcosystem', meshes));

  buildLotusColonies(ecoGroup, meshes);

  buildCattailReeds(ecoGroup, meshes);
}

function buildLotusColonies(parent, meshes) {
  const lotusGroup = parent.add(createNode('LotusColoniesGroup', meshes));

  const { topCx, topCz, botCx, botCz } = LAKE8;

  const colonies = [

    {
      center: [topCx - 2.8, 0, topCz - 1.2],
      pads: [
        { dx:  0.0, dz:  0.0, r: 0.35 },
        { dx:  0.4, dz:  0.3, r: 0.28 },
        { dx: -0.3, dz:  0.4, r: 0.32 },
        { dx: -0.4, dz: -0.3, r: 0.26 },
      ],
      flowers: [{ dx: 0.0, dz: 0.0 }, { dx: -0.3, dz: 0.4 }]
    },

    {
      center: [topCx + 2.5, 0, topCz + 1.2],
      pads: [
        { dx:  0.0, dz:  0.0, r: 0.30 },
        { dx:  0.3, dz:  0.3, r: 0.25 },
        { dx: -0.35, dz: -0.2, r: 0.28 },
      ],
      flowers: [{ dx: 0.0, dz: 0.0 }]
    },

    {
      center: [botCx + 2.6, 0, botCz + 1.2],
      pads: [
        { dx:  0.0, dz:  0.0, r: 0.34 },
        { dx:  0.35, dz: 0.35, r: 0.28 },
        { dx: -0.4, dz:  0.2, r: 0.30 },
        { dx:  0.1, dz: -0.4, r: 0.26 },
      ],
      flowers: [{ dx: 0.0, dz: 0.0 }]
    },

    {
      center: [botCx - 2.5, 0, botCz - 1.2],
      pads: [
        { dx:  0.0, dz:  0.0, r: 0.32 },
        { dx:  0.3, dz:  0.3, r: 0.25 },
        { dx: -0.35, dz: -0.2, r: 0.28 },
      ],
      flowers: [{ dx: 0.0, dz: 0.0 }]
    },
  ];

  colonies.forEach((col, cIdx) => {
    const colNode = lotusGroup.add(createNode(`LotusColony_${cIdx + 1}`, meshes));
    colNode.translation = [...col.center];

    col.pads.forEach(p => {
      colNode.addCylinder([p.r, p.r], 0.005, [p.dx, 0.026, p.dz], MAT.lilyPad);
    });

    col.flowers.forEach(fl => {
      const fx = fl.dx, fz = fl.dz;
      colNode.addSphere([fx, 0.055, fz], 0.035, MAT.lotusCenter);

      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const px = fx + Math.cos(a) * 0.045;
        const pz = fz + Math.sin(a) * 0.045;
        colNode.addBox([0.075, 0.012, 0.038], [px, 0.045, pz], MAT.lotusPetal, [0, -a * 180 / Math.PI, 22]);
      }
    });
  });
}

function buildCattailReeds(parent, meshes) {
  const reedsGroup = parent.add(createNode('CattailReedsGroup', meshes));

  const { topCx, topCz, botCx, botCz } = LAKE8;

  const reedClusters = [
    { pos: [topCx - 4.2, 0, topCz + 1.8], count: 8 },
    { pos: [topCx + 4.0, 0, topCz - 2.0], count: 7 },
    { pos: [botCx + 4.2, 0, botCz - 1.8], count: 9 },
    { pos: [botCx - 4.0, 0, botCz + 2.0], count: 7 },
    { pos: [-3.4, 0, 0.0], count: 6 },
    { pos: [ 3.4, 0, 0.0], count: 6 },
  ];

  reedClusters.forEach((cl, cIdx) => {
    const clusterNode = reedsGroup.add(createNode(`ReedCluster_${cIdx + 1}`, meshes));
    clusterNode.translation = [...cl.pos];

    for (let i = 0; i < cl.count; i++) {
      const rx = (Math.sin(i * 1.7) * 0.45);
      const rz = (Math.cos(i * 2.3) * 0.45);
      const h = 0.75 + (i % 4) * 0.14;
      const leanX = Math.sin(i) * 0.08;
      const leanZ = Math.cos(i) * 0.08;

      clusterNode.addPipe([rx, 0, rz], [rx + leanX, h, rz + leanZ], 0.012, MAT.reedStem);

      const topX = rx + leanX, topZ = rz + leanZ;
      clusterNode.addPipe(
        [topX - leanX * 0.25, h * 0.70, topZ - leanZ * 0.25],
        [topX, h * 0.94, topZ],
        0.024,
        MAT.cattailHead
      );
    }
  });
}
