'use strict';

/**
 * UI Controls, Interaction Listeners, WASD Keyboard Navigation,
 * 3D Raycasting Object Picking (Click to Select / Deselect) & Orbit Camera
 */

function setupUI(state, cam, sceneData, canvas) {
  const { latPull, elliptical, airWalker } = sceneData;

  // Navigasi Tab (Kontrol | Hierarki | Opsi)
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      clearAllKeys();
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // Pemilih Objek Mesin (3 Tombol: Lat Pull, Elliptical, Air Walker)
  const btnSelLP = document.getElementById('btnSelectLatPull');
  const btnSelEL = document.getElementById('btnSelectElliptical');
  const btnSelAW = document.getElementById('btnSelectAirWalker');
  const baseStatusText = document.getElementById('baseStatusText');
  const btnResetBase = document.getElementById('btnResetBase');

  // Sliders Base
  const elBaseX = document.getElementById('basePosX');
  const elBaseXVal = document.getElementById('basePosXVal');
  const elBaseZ = document.getElementById('basePosZ');
  const elBaseZVal = document.getElementById('basePosZVal');
  const elBaseRotY = document.getElementById('baseRotY');
  const elBaseRotYVal = document.getElementById('baseRotYVal');

  // Sliders Artikulasi Gerak Sendi
  const elPullAngle = document.getElementById('pullAngle');
  const elPullVal = document.getElementById('angleVal');
  const elStrideAngle = document.getElementById('strideAngle');
  const elStrideVal = document.getElementById('strideVal');
  const elAirWalkerAngle = document.getElementById('airWalkerAngle');
  const elAirWalkerVal = document.getElementById('airWalkerVal');

  // Animasi & Tampilan
  const elAuto = document.getElementById('btnAuto');
  const elSpeed = document.getElementById('speed');
  const elSpeedVal = document.getElementById('speedVal');
  const elTree = document.getElementById('tree');
  const elReadout = document.getElementById('readout');

  function getActivePosAndRot() {
    if (state.selectedMachine === 'latPull') {
      return { name: 'LatPull', pos: state.latPullPos, rot: state.latPullRotY };
    } else if (state.selectedMachine === 'elliptical') {
      return { name: 'Elliptical', pos: state.ellipticalPos, rot: state.ellipticalRotY };
    } else if (state.selectedMachine === 'airWalker') {
      return { name: 'AirWalker', pos: state.airWalkerPos, rot: state.airWalkerRotY };
    }
    return null;
  }

  function syncBaseSliders() {
    btnSelLP.classList.toggle('active', state.selectedMachine === 'latPull');
    btnSelEL.classList.toggle('active', state.selectedMachine === 'elliptical');
    btnSelAW.classList.toggle('active', state.selectedMachine === 'airWalker');

    const active = getActivePosAndRot();
    if (active) {
      elBaseX.value = active.pos[0];
      elBaseZ.value = active.pos[2];
      elBaseRotY.value = active.rot;
    }
    updateBaseLabels();
  }

  function updateBaseLabels() {
    const active = getActivePosAndRot();
    if (active) {
      elBaseXVal.textContent = active.pos[0].toFixed(1) + 'm';
      elBaseZVal.textContent = active.pos[2].toFixed(1) + 'm';
      elBaseRotYVal.textContent = active.rot.toFixed(0) + '°';
      baseStatusText.textContent = `${active.name} | X: ${active.pos[0].toFixed(1)}m, Z: ${active.pos[2].toFixed(1)}m`;
      elBaseX.disabled = false;
      elBaseZ.disabled = false;
      elBaseRotY.disabled = false;
      btnResetBase.disabled = false;
    } else {
      elBaseXVal.textContent = '-';
      elBaseZVal.textContent = '-';
      elBaseRotYVal.textContent = '-';
      baseStatusText.textContent = 'Belum ada alat dipilih (Klik alat)';
      elBaseX.disabled = true;
      elBaseZ.disabled = true;
      elBaseRotY.disabled = true;
      btnResetBase.disabled = true;
    }
  }

  // Klik tombol tab pemilih alat di panel
  btnSelLP.addEventListener('click', () => {
    clearAllKeys();
    state.selectedMachine = state.selectedMachine === 'latPull' ? null : 'latPull';
    syncBaseSliders();
  });

  btnSelEL.addEventListener('click', () => {
    clearAllKeys();
    state.selectedMachine = state.selectedMachine === 'elliptical' ? null : 'elliptical';
    syncBaseSliders();
  });

  btnSelAW.addEventListener('click', () => {
    clearAllKeys();
    state.selectedMachine = state.selectedMachine === 'airWalker' ? null : 'airWalker';
    syncBaseSliders();
  });

  elBaseX.addEventListener('input', () => {
    clearAllKeys();
    const active = getActivePosAndRot();
    if (!active) return;
    active.pos[0] = parseFloat(elBaseX.value);
    updateBaseLabels();
  });

  elBaseZ.addEventListener('input', () => {
    clearAllKeys();
    const active = getActivePosAndRot();
    if (!active) return;
    active.pos[2] = parseFloat(elBaseZ.value);
    updateBaseLabels();
  });

  elBaseRotY.addEventListener('input', () => {
    clearAllKeys();
    if (state.selectedMachine === 'latPull') state.latPullRotY = parseFloat(elBaseRotY.value);
    else if (state.selectedMachine === 'elliptical') state.ellipticalRotY = parseFloat(elBaseRotY.value);
    else if (state.selectedMachine === 'airWalker') state.airWalkerRotY = parseFloat(elBaseRotY.value);
    updateBaseLabels();
  });

  function resetActiveBase() {
    clearAllKeys();
    if (state.selectedMachine && DEFAULT_BASES[state.selectedMachine]) {
      const def = DEFAULT_BASES[state.selectedMachine];
      if (state.selectedMachine === 'latPull') {
        state.latPullPos = [...def.pos];
        state.latPullRotY = def.rotY;
      } else if (state.selectedMachine === 'elliptical') {
        state.ellipticalPos = [...def.pos];
        state.ellipticalRotY = def.rotY;
      } else if (state.selectedMachine === 'airWalker') {
        state.airWalkerPos = [...def.pos];
        state.airWalkerRotY = def.rotY;
      }
    }
    syncBaseSliders();
  }
  btnResetBase.addEventListener('click', resetActiveBase);

  function setAuto(on) {
    state.auto = on;
    if (on) {
      const s = clamp((state.latPullAngle - 22.5) / 22.5, -1, 1);
      state.phase = Math.asin(s);
    }
    elAuto.textContent = on ? '⏸' : '▶';
    elAuto.classList.toggle('on', on);
  }

  elPullAngle.addEventListener('input', () => {
    if (state.auto) setAuto(false);
    state.latPullAngle = parseFloat(elPullAngle.value);
  });

  elStrideAngle.addEventListener('input', () => {
    if (state.auto) setAuto(false);
    // Clamp agar tidak melebihi zona stabil four-bar linkage elliptical
    state.ellipticalStride = clamp(parseFloat(elStrideAngle.value), -12, 12);
  });

  elAirWalkerAngle.addEventListener('input', () => {
    if (state.auto) setAuto(false);
    state.airWalkerSwing = parseFloat(elAirWalkerAngle.value);
  });

  elAuto.addEventListener('click', () => setAuto(!state.auto));

  elSpeed.addEventListener('input', () => {
    state.speed = parseFloat(elSpeed.value);
    elSpeedVal.textContent = state.speed.toFixed(1);
  });

  document.getElementById('chkAlt').addEventListener('change', e => {
    state.alt = e.target.checked;
  });

  document.getElementById('chkHighlight').addEventListener('change', e => {
    state.showHighlight = e.target.checked;
  });

  document.getElementById('chkAxes').addEventListener('change', e => {
    state.showAxes = e.target.checked;
  });

  document.getElementById('chkGrid').addEventListener('change', e => {
    state.showGrid = e.target.checked;
  });

  document.getElementById('chkScenery')?.addEventListener('change', e => {
      state.showScenery = e.target.checked;
    });

  // =========================================================================
  // SISTEM KONTROL KEYBOARD WASD
  // =========================================================================
  const keysDown = new Set();
  let lastKeyTimestamp = 0;

  function clearAllKeys() {
    keysDown.clear();
  }

  window.addEventListener('blur', clearAllKeys);
  window.addEventListener('focus', clearAllKeys);
  document.addEventListener('visibilitychange', clearAllKeys);

  window.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Digit1') {
      clearAllKeys();
      state.selectedMachine = state.selectedMachine === 'latPull' ? null : 'latPull';
      syncBaseSliders();
      return;
    }
    if (e.code === 'Digit2') {
      clearAllKeys();
      state.selectedMachine = state.selectedMachine === 'elliptical' ? null : 'elliptical';
      syncBaseSliders();
      return;
    }
    if (e.code === 'Digit3') {
      clearAllKeys();
      state.selectedMachine = state.selectedMachine === 'airWalker' ? null : 'airWalker';
      syncBaseSliders();
      return;
    }
    if (e.code === 'KeyR') {
      if (state.selectedMachine) {
        resetActiveBase();
      } else {
        resetCamera();
      }
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      setAuto(!state.auto);
      return;
    }

    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'].includes(e.code)) {
      e.preventDefault();
      keysDown.add(e.code);
      lastKeyTimestamp = performance.now();
    }
  });

  window.addEventListener('keyup', e => {
    keysDown.delete(e.code);
  });

  function processKeyboardInput(dt) {
    if (keysDown.size === 0 || !state.selectedMachine) return;

    if (performance.now() - lastKeyTimestamp > 300) {
      clearAllKeys();
      return;
    }

    const moveSpeed = 3.6;
    const rotSpeed = 75;

    const active = getActivePosAndRot();
    if (!active) return;
    let changed = false;

    // W = Maju (-Z), S = Mundur (+Z)
    if (keysDown.has('KeyW')) {
      active.pos[2] = clamp(active.pos[2] - moveSpeed * dt, -6.5, 6.5);
      changed = true;
    }
    if (keysDown.has('KeyS')) {
      active.pos[2] = clamp(active.pos[2] + moveSpeed * dt, -6.5, 6.5);
      changed = true;
    }

    // A = Geser Kiri (-X), D = Geser Kanan (+X)
    if (keysDown.has('KeyA')) {
      active.pos[0] = clamp(active.pos[0] - moveSpeed * dt, -6.5, 6.5);
      changed = true;
    }
    if (keysDown.has('KeyD')) {
      active.pos[0] = clamp(active.pos[0] + moveSpeed * dt, -6.5, 6.5);
      changed = true;
    }

    // Q = Putar Kiri, E = Putar Kanan
    if (keysDown.has('KeyQ')) {
      if (state.selectedMachine === 'latPull') state.latPullRotY = (state.latPullRotY + rotSpeed * dt) % 360;
      else if (state.selectedMachine === 'elliptical') state.ellipticalRotY = (state.ellipticalRotY + rotSpeed * dt) % 360;
      else if (state.selectedMachine === 'airWalker') state.airWalkerRotY = (state.airWalkerRotY + rotSpeed * dt) % 360;
      changed = true;
    }
    if (keysDown.has('KeyE')) {
      if (state.selectedMachine === 'latPull') state.latPullRotY = (state.latPullRotY - rotSpeed * dt + 360) % 360;
      else if (state.selectedMachine === 'elliptical') state.ellipticalRotY = (state.ellipticalRotY - rotSpeed * dt + 360) % 360;
      else if (state.selectedMachine === 'airWalker') state.airWalkerRotY = (state.airWalkerRotY - rotSpeed * dt + 360) % 360;
      changed = true;
    }

    if (changed) {
      syncBaseSliders();
    }
  }

  // =========================================================================
  // SISTEM RAYCASTING 3D: KLIK PADA OBJEK = SELECT, KLIK DI LUAR = UNSELECT
  // =========================================================================
  function getPickRay(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ndcX = (x / canvas.clientWidth) * 2 - 1;
    const ndcY = 1 - (y / canvas.clientHeight) * 2;

    const yaw = cam.yaw * DEG, pitch = cam.pitch * DEG;
    const eyeY = Math.max(cam.target[1] + cam.dist * Math.sin(pitch), 0.20);
    const eye = [
      cam.target[0] + cam.dist * Math.cos(pitch) * Math.sin(yaw),
      eyeY,
      cam.target[2] + cam.dist * Math.cos(pitch) * Math.cos(yaw)
    ];

    let fx = cam.target[0] - eye[0];
    let fy = cam.target[1] - eye[1];
    let fz = cam.target[2] - eye[2];
    let fl = Math.hypot(fx, fy, fz);
    fx /= fl; fy /= fl; fz /= fl;

    const up = [0, 1, 0];
    // Sumbu X kamera (Right vector) = cross(f, up)
    // Sesuai dengan pembentukan sumbu X di Mat4.lookAt agar orientasi horizontal tidak terbalik
    let rx = fy * up[2] - fz * up[1];
    let ry = fz * up[0] - fx * up[2];
    let rz = fx * up[1] - fy * up[0];
    let rl = Math.hypot(rx, ry, rz);
    rx /= rl; ry /= rl; rz /= rl;

    // Sumbu Y kamera (Up vector) = cross(r, f)
    const ux = ry * fz - rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy - ry * fx;

    const fovy = 45 * DEG;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const halfH = Math.tan(fovy / 2);
    const halfW = halfH * aspect;

    let dx = fx + ndcX * halfW * rx + ndcY * halfH * ux;
    let dy = fy + ndcX * halfW * ry + ndcY * halfH * uy;
    let dz = fz + ndcX * halfW * rz + ndcY * halfH * uz;
    let dl = Math.hypot(dx, dy, dz);
    dx /= dl; dy /= dl; dz /= dl;

    return { origin: eye, dir: [dx, dy, dz] };
  }

  function rayAABB(O, D, min, max) {
    let tmin = -Infinity, tmax = Infinity;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(D[i]) < 1e-6) {
        if (O[i] < min[i] || O[i] > max[i]) return null;
      } else {
        let t1 = (min[i] - O[i]) / D[i];
        let t2 = (max[i] - O[i]) / D[i];
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax || tmax < 0) return null;
      }
    }
    return tmin > 0 ? tmin : tmax;
  }

  function testMachineHit(ray, pos, rotYDeg, min, max) {
    const theta = -rotYDeg * DEG;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);

    const dx = ray.origin[0] - pos[0];
    const dy = ray.origin[1] - pos[1];
    const dz = ray.origin[2] - pos[2];

    const oLocal = [
      dx * cosT - dz * sinT,
      dy,
      dx * sinT + dz * cosT
    ];

    const dLocal = [
      ray.dir[0] * cosT - ray.dir[2] * sinT,
      ray.dir[1],
      ray.dir[0] * sinT + ray.dir[2] * cosT
    ];

    return rayAABB(oLocal, dLocal, min, max);
  }

  function handleSceneClick(clientX, clientY) {
    const ray = getPickRay(clientX, clientY);

    // Hit testing untuk ketiga mesin dengan bounding box lokal
    const hits = [
      { key: 'latPull',    t: testMachineHit(ray, state.latPullPos, state.latPullRotY, [-2.0, 0, -1.0], [2.0, 2.6, 1.0]) },
      { key: 'elliptical', t: testMachineHit(ray, state.ellipticalPos, state.ellipticalRotY, [-0.85, 0, -0.9], [0.85, 2.1, 1.2]) },
      { key: 'airWalker',  t: testMachineHit(ray, state.airWalkerPos, state.airWalkerRotY, [-0.85, 0, -0.85], [0.85, 2.0, 0.85]) }
    ].filter(h => h.t !== null && h.t > 0);

    if (hits.length > 0) {
      hits.sort((a, b) => a.t - b.t);
      // Klik pada objek -> Select objek tersebut
      state.selectedMachine = hits[0].key;
    } else {
      // Klik di luar objek (tanah rumput / langit kosong) -> Unselect / Tidak ada yang terpilih
      state.selectedMachine = null;
    }
    syncBaseSliders();
  }

  // =========================================================================
  // ORBIT KAMERA (Drag) vs KLIK SELEKSI (Tap)
  // =========================================================================
  let dragging = false, lastX = 0, lastY = 0;
  let pointerDownX = 0, pointerDownY = 0;

  canvas.addEventListener('pointerdown', e => {
    clearAllKeys();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
  });

  function getMinPitch() {
    // Sudut pitch minimum dinamis agar kamera selalu berada minimal 20cm di atas permukaan tanah (eye.y >= 0.20m)
    const safeHeight = 0.20;
    const sinMin = (safeHeight - cam.target[1]) / cam.dist;
    return Math.asin(clamp(sinMin, -0.99, 0.99)) * (180 / Math.PI);
  }

  function resetCamera() {
    cam.yaw = 24;
    cam.pitch = 18;
    cam.dist = 11.2;
    cam.target[0] = 0;
    cam.target[1] = 1.1;
    cam.target[2] = 0;
  }
  function viewLakeCamera() {
    cam.yaw = 52;
    cam.pitch = 22;
    cam.dist = 18.0;
    cam.target[0] = -12.5;
    cam.target[1] = 1.0;
    cam.target[2] = 0.5;
  }
  function viewOverviewCamera() {
    cam.yaw = 35;
    cam.pitch = 30;
    cam.dist = 28.0;
    cam.target[0] = -6.0;
    cam.target[1] = 0.8;
    cam.target[2] = 0.0;
  }
  document.getElementById('btnResetCamera')?.addEventListener('click', resetCamera);
  document.getElementById('btnViewLake')?.addEventListener('click', viewLakeCamera);
  document.getElementById('btnViewOverview')?.addEventListener('click', viewOverviewCamera);

  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    cam.yaw   -= (e.clientX - lastX) * 0.35;
    cam.pitch += (e.clientY - lastY) * 0.35;
    cam.pitch = clamp(cam.pitch, getMinPitch(), 85);
    lastX = e.clientX;
    lastY = e.clientY;
  });

  const endDrag = e => {
    if (dragging) {
      dragging = false;
      canvas.classList.remove('dragging');

      // Deteksi Klik: Jika kursor berpindah kurang dari 6px, anggap sebagai KLIK (bukan drag putar kamera)
      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (dist < 6) {
        handleSceneClick(e.clientX, e.clientY);
      }
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.001), 3, 45);
    const minP = getMinPitch();
    if (cam.pitch < minP) cam.pitch = minP;
  }, { passive: false });

  // Update Tampilan Nilai Setiap Frame
  function updateUI() {
    const [lpR] = latPull.sides;
    const [elR] = elliptical.sides;
    const [awR] = airWalker.sides;

    elPullVal.textContent = state.latPullAngle.toFixed(1) + '°';
    elStrideVal.textContent = state.ellipticalStride.toFixed(1) + '°';
    elAirWalkerVal.textContent = state.airWalkerSwing.toFixed(1) + '°';

    const lpTag = state.selectedMachine === 'latPull' ? '<span class="hl">► [TERPILIH] LatPullBaseNode</span>' : 'LatPullBaseNode';
    const elTag = state.selectedMachine === 'elliptical' ? '<span class="hl">► [TERPILIH] EllipticalBaseNode</span>' : 'EllipticalBaseNode';
    const awTag = state.selectedMachine === 'airWalker' ? '<span class="hl">► [TERPILIH] AirWalkerBaseNode</span>' : 'AirWalkerBaseNode';

    elTree.innerHTML =
`Root (World Space)
├─ UrbanParkEnvironmentNode (Scenery Taman & Danau)
│   ├─ FitnessPad (Lantai Karet Merah Bata)
│   ├─ JoggingTrackLoop (Paving Melingkar)
│   ├─ ShadeTreesGroup (6 Pohon Peneduh)
│   ├─ ParkBenchesGroup (3 Bangku Kayu)
│   ├─ StreetlampsGroup (4 Lampu Tiang)
│   └─ LakeScenicArea (Kawasan Danau Berkilau)
│       ├─ LakeBasinAndWater (Cekungan & Air Biru Toska)
│       ├─ LakesidePromenade (Jalur Paving & Bebatuan)
│       ├─ LakesidePier (Dermaga Kayu & Perahu Dayung)
│       └─ LakeFloraFauna (Teratai, Gelagah, Angsa & Air Mancur)
│
├─ ${lpTag} (X=${state.latPullPos[0].toFixed(1)})
│   ├─ <b>ConcreteBase</b>
│   └─ <b>MainFrame</b> (Tiang Biru)
│       ├─ <b>UpperPivot</b> rotZ = <b>${(LP_REST_DEG - lpR.pull).toFixed(1)}°</b>
│       ├─ <b>RailUpper</b> α = <b>${lpR.alpha.toFixed(1)}°</b> (Kursi ↑ ${(lpR.lift * 100).toFixed(1)}cm)
│       └─ <b>LinkRod</b> (Constraint)
│
├─ ${elTag} (X=${state.ellipticalPos[0].toFixed(1)})
│   ├─ <b>ConcreteBase</b>
│   └─ <b>MainFrame</b> (L-Frame Biru)
│       ├─ <b>FrontPivot</b> rotX = <b>${elR.stride.toFixed(1)}°</b>
│       ├─ <b>RearPivot</b> rotX = <b>${elR.phi.toFixed(1)}°</b>
│       └─ <b>PedalBeam</b> (Pijakan Kaki 4-Batang)
│
└─ ${awTag} (X=${state.airWalkerPos[0].toFixed(1)})
    ├─ <b>ConcreteBase</b>
    └─ <b>MainFrame</b> (U-Portal Biru & Stang Depan)
        └─ <b>AirWalkerPivot</b> rotX = <b>${awR.swing.toFixed(1)}°</b>
            └─ <b>AirWalkerLeg</b> (Bandul Kaki & Pelat)`;

    const act = getActivePosAndRot();
    elReadout.textContent = act
      ? `${act.name}: X=${act.pos[0].toFixed(2)}m  Z=${act.pos[2].toFixed(2)}m  RotY=${act.rot.toFixed(0)}°`
      : 'Klik objek di viewport 3D untuk memilih alat.';
  }

  syncBaseSliders();

  return { elPullAngle, elStrideAngle, elAirWalkerAngle, processKeyboardInput, updateUI };
}
