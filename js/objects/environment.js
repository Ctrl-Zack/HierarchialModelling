'use strict';

/**
 * Urban Green Park Scenery Builder for Outdoor Fitness Area
 *
 * Elemen:
 * 1. Zona Landasan Kebugaran: Lantai Karet Merah Bata (EPDM Tartan Mat) dengan garis pembatas
 * 2. Paving Track Melingkar: Jogging/Walking track melingkar mengelilingi seluruh area alat
 * 3. Jalur Akses Paving: Menghubungkan jogging track dengan matras karet
 * 4. 6 Pohon Peneduh Rimbun: Batang kayu bercabang + tajuk daun berlapis (multi-sphere crown)
 * 5. 3 Bangku Taman Kayu: Rangka besi hitam + papan kayu jati + sandaran tangan
 * 6. 4 Lampu Tiang Taman: Tiang lentera klasik dengan bohlam hangat menyala (unlit warm glow)
 * 7. Semak-semak & Lanskap: Semak hijau rimbun di tepi jalur dan kaki pohon
 * 8. Papan Informasi Taman & Tempat Sampah Pilah
 */

function buildUrbanParkEnvironment(envNode, meshes) {
  // 1. Zona Landasan Karet Merah Bata (EPDM Rubber Mat) di bawah 3 mesin
  buildFitnessPad(envNode, meshes);

  // 2. Paving Track Melingkar (Jogging / Walking Track)
  buildJoggingTrack(envNode, meshes);

  // 3. Jalur Akses Paving (Connectors)
  buildPavingAccessPaths(envNode, meshes);

  // 4. 6 Pohon Peneduh Rimbun
  buildShadeTrees(envNode, meshes);

  // 5. 3 Bangku Taman Kayu
  buildParkBenches(envNode, meshes);

  // 6. 4 Lampu Tiang Taman
  buildStreetlamps(envNode, meshes);

  // 7. Semak-semak & Lanskap Asri
  buildParkBushes(envNode, meshes);

  // 8. Fasilitas Tambahan: Papan Informasi & Tempat Sampah
  buildParkAmenities(envNode, meshes);

  return envNode;
}

/**
 * 1. Zona Landasan Karet Merah Bata (EPDM Tartan Mat)
 */
function buildFitnessPad(parent, meshes) {
  const pad = parent.add(createNode('FitnessRubberPad', meshes));

  // Tepi pembatas gelap (Curb/border)
  pad.addBox([10.70, 0.016, 5.10], [0, 0.008, 0], MAT.rubberBorder);

  // Matras utama karet merah bata
  pad.addBox([10.40, 0.024, 4.80], [0, 0.012, 0], MAT.rubberMat);

  // Garis pembatas zona antar mesin (bay dividers)
  pad.addBox([0.08, 0.002, 4.70], [-1.35, 0.025, 0], MAT.rubberBorder);
  pad.addBox([0.08, 0.002, 4.70], [ 1.85, 0.025, 0], MAT.rubberBorder);

  // Aksen garis perimeter dalam yang tipis dan rapi
  pad.addBox([10.20, 0.002, 0.05], [0, 0.025,  2.32], MAT.rubberBorder);
  pad.addBox([10.20, 0.002, 0.05], [0, 0.025, -2.32], MAT.rubberBorder);
  pad.addBox([0.05, 0.002, 4.60], [-5.12, 0.025, 0], MAT.rubberBorder);
  pad.addBox([0.05, 0.002, 4.60], [ 5.12, 0.025, 0], MAT.rubberBorder);
}

/**
 * 2. Paving Track Melingkar (Jogging / Walking Track mengelilingi gym)
 */
function buildJoggingTrack(parent, meshes) {
  const track = parent.add(createNode('JoggingTrackLoop', meshes));

  const Rx = 9.4; // Jari-jari sumbu X (melebar ke samping)
  const Rz = 6.6; // Jari-jari sumbu Z (kedalaman depan-belakang)
  const trackWidth = 1.45;
  const numSegments = 48;

  for (let i = 0; i < numSegments; i++) {
    const th1 = (i / numSegments) * Math.PI * 2;
    const th2 = ((i + 1) / numSegments) * Math.PI * 2;

    const x1 = Rx * Math.cos(th1), z1 = Rz * Math.sin(th1);
    const x2 = Rx * Math.cos(th2), z2 = Rz * Math.sin(th2);

    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;

    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz) * 1.05; // Sedikit tumpang tindih agar tidak ada celah
    const rotYDeg = (-Math.atan2(dz, dx) * 180) / Math.PI;

    // Segmen paving utama
    track.addBox([len, 0.020, trackWidth], [mx, 0.011, mz], MAT.pavingTrack, [0, rotYDeg, 0]);

    // Kerb batu pembatas sisi luar dan sisi dalam
    const perpX = -dz / Math.hypot(dx, dz);
    const perpZ = dx / Math.hypot(dx, dz);
    const halfW = trackWidth / 2;

    // Pembatas luar
    track.addBox([len, 0.026, 0.07], [mx + perpX * halfW, 0.014, mz + perpZ * halfW], MAT.pavingBorder, [0, rotYDeg, 0]);
    // Pembatas dalam
    track.addBox([len, 0.026, 0.07], [mx - perpX * halfW, 0.014, mz - perpZ * halfW], MAT.pavingBorder, [0, rotYDeg, 0]);
  }
}

/**
 * 3. Jalur Akses Paving (Menghubungkan matras karet ke jogging track)
 */
function buildPavingAccessPaths(parent, meshes) {
  const paths = parent.add(createNode('AccessPaths', meshes));

  // Jalur Depan (Selatan, Z: 2.4 -> 6.6)
  paths.addBox([1.60, 0.020, 3.40], [0, 0.011, 4.40], MAT.pavingTrack);
  paths.addBox([0.07, 0.026, 3.40], [-0.80, 0.014, 4.40], MAT.pavingBorder);
  paths.addBox([0.07, 0.026, 3.40], [ 0.80, 0.014, 4.40], MAT.pavingBorder);

  // Jalur Belakang (Utara, Z: -2.4 -> -6.6)
  paths.addBox([1.60, 0.020, 3.40], [0, 0.011, -4.40], MAT.pavingTrack);
  paths.addBox([0.07, 0.026, 3.40], [-0.80, 0.014, -4.40], MAT.pavingBorder);
  paths.addBox([0.07, 0.026, 3.40], [ 0.80, 0.014, -4.40], MAT.pavingBorder);

  // Jalur Samping Barat (Kiri, X: -5.2 -> -9.4)
  paths.addBox([3.50, 0.020, 1.40], [-7.20, 0.011, 0], MAT.pavingTrack);
  paths.addBox([3.50, 0.026, 0.07], [-7.20, 0.014,  0.70], MAT.pavingBorder);
  paths.addBox([3.50, 0.026, 0.07], [-7.20, 0.014, -0.70], MAT.pavingBorder);

  // Jalur Samping Timur (Kanan, X: 5.2 -> 9.4)
  paths.addBox([3.50, 0.020, 1.40], [ 7.20, 0.011, 0], MAT.pavingTrack);
  paths.addBox([3.50, 0.026, 0.07], [ 7.20, 0.014,  0.70], MAT.pavingBorder);
  paths.addBox([3.50, 0.026, 0.07], [ 7.20, 0.014, -0.70], MAT.pavingBorder);
}

/**
 * 4. 6 Pohon Peneduh Rimbun (Lush Shade Trees)
 */
function buildShadeTrees(parent, meshes) {
  const treesGroup = parent.add(createNode('ShadeTreesGroup', meshes));

  // Posisi 6 pohon di sekeliling area luar jogging track
  const treeConfigs = [
    { pos: [-7.8, 0, -4.8], s: 1.15, rot: 15 },
    { pos: [-1.6, 0, -7.8], s: 1.28, rot: 45 },
    { pos: [ 6.6, 0, -5.6], s: 1.10, rot: -30 },
    { pos: [-8.4, 0,  4.4], s: 1.18, rot: 60 },
    { pos: [ 7.8, 0,  4.8], s: 1.22, rot: -40 },
    { pos: [10.4, 0, -0.8], s: 1.05, rot: 110 }
  ];

  treeConfigs.forEach((cfg, idx) => {
    const treeNode = treesGroup.add(createNode(`Tree_${idx + 1}`, meshes));
    treeNode.translation = [...cfg.pos];
    treeNode.rotation = [0, cfg.rot, 0];

    const s = cfg.s;

    // Pangkal batang pohon (Root flare)
    treeNode.addPipe([0, 0, 0], [0, 0.45 * s, 0], 0.22 * s, MAT.treeTrunk);

    // Batang utama
    treeNode.addPipe([0, 0.35 * s, 0], [0, 2.30 * s, 0], 0.14 * s, MAT.treeTrunk);

    // Dahan cabang samping 1
    treeNode.addPipe([0, 1.65 * s, 0], [0.45 * s, 2.45 * s, 0.35 * s], 0.075 * s, MAT.treeTrunk);

    // Dahan cabang samping 2
    treeNode.addPipe([0, 1.85 * s, 0], [-0.40 * s, 2.55 * s, -0.30 * s], 0.070 * s, MAT.treeTrunk);

    // Tajuk Daun Rimbun (Kombinasi 6 bola bertumpuk dengan 2 warna hijau yang asri)
    // 1. Bola pusat kanopi
    treeNode.addSphere([0, 2.75 * s, 0], [1.15 * s, 1.05 * s, 1.15 * s], MAT.treeCrownDark);
    // 2. Kubah atas tajuk (hijau cerah bermandikan cahaya)
    treeNode.addSphere([0, 3.55 * s, 0], [0.85 * s, 0.85 * s, 0.85 * s], MAT.treeCrownLight);
    // 3. Sayap daun kiri
    treeNode.addSphere([-0.65 * s, 2.75 * s, 0.25 * s], [0.82 * s, 0.78 * s, 0.82 * s], MAT.treeCrownDark);
    // 4. Sayap daun kanan
    treeNode.addSphere([0.70 * s, 2.85 * s, -0.20 * s], [0.85 * s, 0.80 * s, 0.85 * s], MAT.treeCrownLight);
    // 5. Gumpalan daun depan
    treeNode.addSphere([0.15 * s, 2.65 * s, 0.65 * s], [0.75 * s, 0.72 * s, 0.75 * s], MAT.treeCrownDark);
    // 6. Gumpalan daun belakang
    treeNode.addSphere([-0.20 * s, 3.05 * s, -0.60 * s], [0.78 * s, 0.75 * s, 0.78 * s], MAT.treeCrownLight);
  });
}

/**
 * 5. 3 Bangku Taman Kayu (Park Benches)
 */
function buildParkBenches(parent, meshes) {
  const benchesGroup = parent.add(createNode('ParkBenchesGroup', meshes));

  const benchConfigs = [
    { pos: [-4.6, 0,  3.5], rotY: -22 }, // Depan Kiri menghadap ke area gym
    { pos: [ 4.6, 0,  3.5], rotY:  22 }, // Depan Kanan menghadap ke area gym
    { pos: [ 0.0, 0, -3.5], rotY: 180 }  // Belakang Tengah menghadap ke depan
  ];

  benchConfigs.forEach((cfg, idx) => {
    const bench = benchesGroup.add(createNode(`Bench_${idx + 1}`, meshes));
    bench.translation = [...cfg.pos];
    bench.rotation = [0, cfg.rotY, 0];

    const benchWidth = 1.36; // Panjang dudukan bangku
    const legX = benchWidth / 2 - 0.06;

    // Rangka Kaki Besi Hitam (Kiri & Kanan)
    for (const sx of [-legX, legX]) {
      // Kaki vertikal depan & belakang
      bench.addPipe([sx, 0, 0.16], [sx, 0.44, 0.16], 0.022, MAT.lampMetal);
      bench.addPipe([sx, 0, -0.16], [sx, 0.44, -0.16], 0.022, MAT.lampMetal);
      // Palang horizontal bawah kaki
      bench.addPipe([sx, 0.06, -0.20], [sx, 0.06, 0.20], 0.020, MAT.lampMetal);
      // Palang horizontal dudukan
      bench.addPipe([sx, 0.42, -0.18], [sx, 0.42, 0.18], 0.020, MAT.lampMetal);
      // Tiang sandaran punggung
      bench.addPipe([sx, 0.42, -0.16], [sx, 0.82, -0.24], 0.022, MAT.lampMetal);
      // Sandaran tangan (Armrest)
      bench.addPipe([sx, 0.44, 0.16], [sx, 0.58, 0.14], 0.018, MAT.lampMetal);
      bench.addPipe([sx, 0.58, 0.14], [sx, 0.58, -0.18], 0.018, MAT.lampMetal);
    }

    // Pipa pengikat horizontal melintang antar kedua kaki di bawah
    bench.addPipe([-legX, 0.14, 0], [legX, 0.14, 0], 0.018, MAT.lampMetal);

    // 4 Papan Kayu Dudukan (Seat Slats)
    const seatZ = [0.14, 0.04, -0.06, -0.15];
    seatZ.forEach(sz => {
      bench.addBox([benchWidth, 0.024, 0.082], [0, 0.44, sz], MAT.woodBench);
    });

    // 3 Papan Kayu Sandaran Punggung (Backrest Slats)
    const backY = [0.55, 0.65, 0.76];
    const backZ = [-0.19, -0.21, -0.23];
    backY.forEach((by, i) => {
      bench.addBox([benchWidth, 0.075, 0.022], [0, by, backZ[i]], MAT.woodBench, [-8, 0, 0]);
    });
  });
}

/**
 * 6. 4 Lampu Tiang Taman (Park Streetlamps dengan Lentera Menyala)
 */
function buildStreetlamps(parent, meshes) {
  const lampsGroup = parent.add(createNode('StreetlampsGroup', meshes));

  const lampConfigs = [
    { pos: [-6.2, 0,  2.2], rotY:  40 }, // Tiang Depan-Kiri
    { pos: [ 6.2, 0,  2.2], rotY: -40 }, // Tiang Depan-Kanan
    { pos: [-5.2, 0, -4.8], rotY: 140 }, // Tiang Belakang-Kiri
    { pos: [ 5.2, 0, -4.8], rotY: -140 }  // Tiang Belakang-Kanan
  ];

  lampConfigs.forEach((cfg, idx) => {
    const lamp = lampsGroup.add(createNode(`Streetlamp_${idx + 1}`, meshes));
    lamp.translation = [...cfg.pos];
    lamp.rotation = [0, cfg.rotY, 0];

    // Alas pedestal bawah (Stepped base)
    lamp.addBox([0.34, 0.08, 0.34], [0, 0.04, 0], MAT.lampMetal);
    lamp.addPipe([0, 0.08, 0], [0, 0.45, 0], 0.10, MAT.lampMetal);
    lamp.addSphere([0, 0.46, 0], [0.11, 0.05, 0.11], MAT.lampMetal);

    // Tiang utama silinder ramping (Tinggi ~3.2m)
    lamp.addPipe([0, 0.46, 0], [0, 3.10, 0], 0.038, MAT.lampMetal);

    // Cincin ornamen dekoratif pada tiang
    lamp.addSphere([0, 1.40, 0], [0.065, 0.035, 0.065], MAT.lampMetal);
    lamp.addSphere([0, 2.50, 0], [0.065, 0.035, 0.065], MAT.lampMetal);

    // Kepala lentera atas (Lantern fixture)
    lamp.addPipe([0, 3.10, 0], [0, 3.25, 0], 0.055, MAT.lampMetal);

    // Rangka rumah lentera
    lamp.addBox([0.28, 0.03, 0.28], [0, 3.26, 0], MAT.lampMetal); // Pelat bawah lentera
    lamp.addBox([0.34, 0.04, 0.34], [0, 3.65, 0], MAT.lampMetal); // Atap kanopi lentera
    lamp.addPipe([0, 3.65, 0], [0, 3.76, 0], 0.035, MAT.lampMetal); // Puncak kanopi
    lamp.addSphere([0, 3.78, 0], 0.045, MAT.lampMetal);             // Bola finial ujung atas

    // 4 Tiang sudut kaca lentera
    for (const sx of [-0.11, 0.11]) {
      for (const sz of [-0.11, 0.11]) {
        lamp.addPipe([sx, 3.26, sz], [sx * 1.15, 3.65, sz * 1.15], 0.012, MAT.lampMetal);
      }
    }

    // Bohlam Lentera Hangat Menyala (Unlit = 1 agar tampak memancarkan cahaya)
    lamp.addSphere([0, 3.44, 0], 0.088, MAT.lampGlow, 1);
  });
}

/**
 * 7. Semak-semak & Lanskap Asri (Low-Poly Green Bushes)
 */
function buildParkBushes(parent, meshes) {
  const bushesGroup = parent.add(createNode('ParkBushesGroup', meshes));

  const bushConfigs = [
    { pos: [-4.6, 0,  4.2], scale: [0.42, 0.32, 0.40] },
    { pos: [-5.2, 0,  3.9], scale: [0.35, 0.28, 0.35] },
    { pos: [ 4.6, 0,  4.2], scale: [0.40, 0.30, 0.42] },
    { pos: [ 5.3, 0,  4.0], scale: [0.34, 0.26, 0.34] },
    { pos: [-0.6, 0, -3.9], scale: [0.38, 0.28, 0.38] },
    { pos: [ 0.6, 0, -3.9], scale: [0.38, 0.28, 0.38] },
    { pos: [-7.4, 0, -4.2], scale: [0.48, 0.36, 0.45] },
    { pos: [ 6.2, 0, -5.0], scale: [0.46, 0.34, 0.44] },
    { pos: [-8.0, 0,  3.8], scale: [0.45, 0.35, 0.45] },
    { pos: [ 7.4, 0,  4.2], scale: [0.44, 0.34, 0.44] }
  ];

  bushConfigs.forEach((cfg, idx) => {
    const bush = bushesGroup.add(createNode(`Bush_${idx + 1}`, meshes));
    bush.translation = [...cfg.pos];
    bush.addSphere([0, cfg.scale[1] * 0.75, 0], cfg.scale, MAT.bush);
  });
}

/**
 * 8. Fasilitas Tambahan: Papan Informasi Taman & Tempat Sampah Pilah
 */
function buildParkAmenities(parent, meshes) {
  const amenities = parent.add(createNode('ParkAmenities', meshes));

  // A. Papan Informasi Taman (Signpost di pintu masuk depan kiri)
  const signNode = amenities.add(createNode('ParkSignpost', meshes));
  signNode.translation = [-2.2, 0, 4.4];
  signNode.rotation = [0, 15, 0];

  // Dua tiang kayu penyangga
  signNode.addPipe([-0.42, 0, 0], [-0.42, 1.35, 0], 0.035, MAT.treeTrunk);
  signNode.addPipe([ 0.42, 0, 0], [ 0.42, 1.35, 0], 0.035, MAT.treeTrunk);

  // Papan plang informasi
  signNode.addBox([1.02, 0.52, 0.045], [0, 1.05, 0], MAT.signPlaque);
  // Header hijau di atas papan
  signNode.addBox([1.06, 0.12, 0.055], [0, 1.32, 0], MAT.signGreen);
  // Garis aksen bingkai
  signNode.addBox([1.04, 0.02, 0.050], [0, 0.78, 0], MAT.treeTrunk);

  // B. Tempat Sampah Taman (Twin Eco Bin di dekat bangku kanan)
  const trashNode = amenities.add(createNode('ParkTrashBin', meshes));
  trashNode.translation = [5.6, 0, 3.4];
  trashNode.rotation = [0, -25, 0];

  // Tiang penyangga
  trashNode.addPipe([0, 0, 0], [0, 0.85, 0], 0.030, MAT.lampMetal);
  trashNode.addPipe([-0.25, 0.65, 0], [0.25, 0.65, 0], 0.025, MAT.lampMetal);

  // Tabung 1: Hijau (Organik / Umum)
  trashNode.addPipe([-0.25, 0.25, 0], [-0.25, 0.75, 0], 0.16, MAT.trashCanBody);
  trashNode.addSphere([-0.25, 0.76, 0], [0.16, 0.08, 0.16], MAT.trashCanBody);

  // Tabung 2: Biru (Daur Ulang / Botol Kebugaran)
  trashNode.addPipe([0.25, 0.25, 0], [0.25, 0.75, 0], 0.16, MAT.blue);
  trashNode.addSphere([0.25, 0.76, 0], [0.16, 0.08, 0.16], MAT.blue);
}

