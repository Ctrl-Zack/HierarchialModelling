'use strict';

/**
 * js/ui.js
 * Kontrol antarmuka pengguna, input keyboard WASD, raycasting seleksi 3D,
 * orbit kamera, serta sinkronisasi slider artikulasi dan pergeseran base.
 */

function setupUI(state, cam, sceneData, canvas) {
  const { latPull, elliptical, airWalker } = sceneData;

  // Status & Tombol Reset
  const baseStatusText  = document.getElementById('baseStatusText');
  const btnResetBase    = document.getElementById('btnResetBase');

  // Slider Posisi Base
  const elBaseX       = document.getElementById('basePosX');
  const elBaseXVal    = document.getElementById('basePosXVal');
  const elBaseZ       = document.getElementById('basePosZ');
  const elBaseZVal    = document.getElementById('basePosZVal');
  const elBaseRotY    = document.getElementById('baseRotY');
  const elBaseRotYVal = document.getElementById('baseRotYVal');

  // Slider Artikulasi Sendi
  const elPullAngle      = document.getElementById('pullAngle');
  const elPullVal        = document.getElementById('angleVal');
  const elStrideAngle    = document.getElementById('strideAngle');
  const elStrideVal      = document.getElementById('strideVal');
  const elAirWalkerAngle = document.getElementById('airWalkerAngle');
  const elAirWalkerVal   = document.getElementById('airWalkerVal');

  // Animasi & Hierarki
  const elAuto     = document.getElementById('btnAuto');
  const elSpeed    = document.getElementById('speed');
  const elSpeedVal = document.getElementById('speedVal');
  const elTree     = document.getElementById('tree');
  const elReadout  = document.getElementById('readout');

  // ─── Helper: Data Mesin Aktif ─────────────────────────────────────────────
  function getActivePosAndRot() {
    if (state.selectedMachine === 'latPull')
      return { name: 'Lat Pull Down', pos: state.latPullPos, rot: state.latPullRotY };
    if (state.selectedMachine === 'elliptical')
      return { name: 'Elliptical Trainer', pos: state.ellipticalPos, rot: state.ellipticalRotY };
    if (state.selectedMachine === 'airWalker')
      return { name: 'Air Walker', pos: state.airWalkerPos, rot: state.airWalkerRotY };
    return null;
  }

  // ─── Sinkronisasi Seleksi Mesin & Nilai Slider ─────────────────────────────
  function syncBaseSliders() {
    document.querySelectorAll('[data-machine]').forEach(btn => {
      const m = btn.getAttribute('data-machine');
      btn.classList.toggle('active', state.selectedMachine === m);
    });

    const active = getActivePosAndRot();
    if (active) {
      elBaseX.value    = active.pos[0];
      elBaseZ.value    = active.pos[2];
      elBaseRotY.value = active.rot;
    }
    updateBaseLabels();

    if (typeof syncRefMachineFromSelection === 'function' && state.selectedMachine) {
      syncRefMachineFromSelection(state.selectedMachine);
    }
  }

  function updateBaseLabels() {
    const active = getActivePosAndRot();
    if (active) {
      elBaseXVal.textContent    = active.pos[0].toFixed(1) + 'm';
      elBaseZVal.textContent    = active.pos[2].toFixed(1) + 'm';
      elBaseRotYVal.textContent = active.rot.toFixed(0) + '°';
      baseStatusText.innerHTML  = `<strong>${active.name}</strong> · X: ${active.pos[0].toFixed(1)}m, Z: ${active.pos[2].toFixed(1)}m`;
      elBaseX.disabled    = false;
      elBaseZ.disabled    = false;
      elBaseRotY.disabled = false;
      btnResetBase.disabled = false;
    } else {
      elBaseXVal.textContent    = '—';
      elBaseZVal.textContent    = '—';
      elBaseRotYVal.textContent = '—';
      baseStatusText.textContent = 'Klik objek di kanvas 3D atau pilih tombol alat di atas';
      elBaseX.disabled    = true;
      elBaseZ.disabled    = true;
      elBaseRotY.disabled = true;
      btnResetBase.disabled = true;
    }
  }

  // Tombol pilihan mesin
  document.querySelectorAll('[data-machine]').forEach(btn => {
    btn.addEventListener('click', () => {
      clearAllKeys();
      const target = btn.getAttribute('data-machine');
      state.selectedMachine = state.selectedMachine === target ? null : target;
      // Cegah trackpad scroll memicu perubahan slider saat kursor lewat
  document.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
  });

  syncBaseSliders();
    });
  });

  // Slider Posisi Base (X, Z, RotY)
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
    if (state.selectedMachine === 'latPull')         state.latPullRotY    = parseFloat(elBaseRotY.value);
    else if (state.selectedMachine === 'elliptical') state.ellipticalRotY = parseFloat(elBaseRotY.value);
    else if (state.selectedMachine === 'airWalker')  state.airWalkerRotY  = parseFloat(elBaseRotY.value);
    updateBaseLabels();
  });

  function resetActiveBase() {
    clearAllKeys();
    if (state.selectedMachine && DEFAULT_BASES[state.selectedMachine]) {
      const def = DEFAULT_BASES[state.selectedMachine];
      if (state.selectedMachine === 'latPull') {
        state.latPullPos  = [...def.pos];
        state.latPullRotY = def.rotY;
      } else if (state.selectedMachine === 'elliptical') {
        state.ellipticalPos  = [...def.pos];
        state.ellipticalRotY = def.rotY;
      } else if (state.selectedMachine === 'airWalker') {
        state.airWalkerPos  = [...def.pos];
        state.airWalkerRotY = def.rotY;
      }
    }
    syncBaseSliders();
  }
  btnResetBase.addEventListener('click', resetActiveBase);

  // ─── Animasi & Slider Artikulasi ──────────────────────────────────────────
  function setAuto(on) {
    state.auto = on;
    if (on) {
      const s = clamp((state.latPullAngle - 22.5) / 22.5, -1, 1);
      state.phase = Math.asin(s);
    }
    if (elAuto) {
      elAuto.classList.toggle('active', on);
      elAuto.textContent = on ? 'Jeda' : 'Mulai Animasi';
    }
  }

  elPullAngle.addEventListener('input', () => {
    if (state.auto) setAuto(false);
    state.latPullAngle = parseFloat(elPullAngle.value);
  });

  elStrideAngle.addEventListener('input', () => {
    if (state.auto) setAuto(false);
    state.ellipticalStride = clamp(parseFloat(elStrideAngle.value), -12, 12);
  });

  elAirWalkerAngle.addEventListener('input', () => {
    if (state.auto) setAuto(false);
    state.airWalkerSwing = parseFloat(elAirWalkerAngle.value);
  });

  elAuto?.addEventListener('click', () => setAuto(!state.auto));

  elSpeed.addEventListener('input', () => {
    state.speed = parseFloat(elSpeed.value);
    elSpeedVal.textContent = state.speed.toFixed(1) + '×';
  });

  // Checkbox Pengaturan Tampilan
  document.getElementById('chkAlt')?.addEventListener('change', e => {
    state.alt = e.target.checked;
  });
  document.getElementById('chkHighlight')?.addEventListener('change', e => {
    state.showHighlight = e.target.checked;
  });
  document.getElementById('chkAxes')?.addEventListener('change', e => {
    state.showAxes = e.target.checked;
  });
  document.getElementById('chkGrid')?.addEventListener('change', e => {
    state.showGrid = e.target.checked;
  });
  document.getElementById('chkScenery')?.addEventListener('change', e => {
    state.showScenery = e.target.checked;
  });

  // ─── Keyboard Input (WASD / QE) ───────────────────────────────────────────
  const hudKeyMap = {
    KeyW: 'hk-w', KeyA: 'hk-a', KeyS: 'hk-s', KeyD: 'hk-d',
    KeyQ: 'hk-q', KeyE: 'hk-e'
  };

  function setHudKeyActive(code, active) {
    const id = hudKeyMap[code];
    if (id) document.getElementById(id)?.classList.toggle('active-key', active);
  }

  const keysDown = new Set();
  let lastKeyTimestamp = 0;

  function clearAllKeys() {
    keysDown.forEach(code => setHudKeyActive(code, false));
    keysDown.clear();
  }

  window.addEventListener('blur', clearAllKeys);
  window.addEventListener('focus', clearAllKeys);
  window.addEventListener('mouseleave', clearAllKeys);
  document.addEventListener('visibilitychange', clearAllKeys);

  window.addEventListener('keydown', e => {
    // Abaikan jika modifier aktif (Win/Alt/Ctrl) agar tidak tersangkut shortcut OS
    if (e.ctrlKey || e.altKey || e.metaKey) {
      clearAllKeys();
      return;
    }

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
      if (state.selectedMachine) resetActiveBase();
      else resetCamera();
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
      setHudKeyActive(e.code, true);
      lastKeyTimestamp = performance.now();
    }
  });

  window.addEventListener('keyup', e => {
    keysDown.delete(e.code);
    setHudKeyActive(e.code, false);
    if (keysDown.size === 0) clearAllKeys();
  });

  function processKeyboardInput(dt) {
    if (keysDown.size === 0 || !state.selectedMachine) return;

    // Deteksi keamanan: jika window kehilangan fokus atau jeda input > 120ms (key dilepas)
    if (typeof document.hasFocus === 'function' && !document.hasFocus()) {
      clearAllKeys();
      return;
    }

    if (performance.now() - lastKeyTimestamp > 120) {
      clearAllKeys();
      return;
    }

    const moveSpeed = 3.6;
    const rotSpeed  = 75;
    const safeDt = Math.min(Math.max(dt, 0.0), 0.05);

    const active = getActivePosAndRot();
    if (!active) return;
    let changed = false;

    if (keysDown.has('KeyW')) { active.pos[2] = clamp(active.pos[2] - moveSpeed * safeDt, -6.5, 6.5); changed = true; }
    if (keysDown.has('KeyS')) { active.pos[2] = clamp(active.pos[2] + moveSpeed * safeDt, -6.5, 6.5); changed = true; }
    if (keysDown.has('KeyA')) { active.pos[0] = clamp(active.pos[0] - moveSpeed * safeDt, -6.5, 6.5); changed = true; }
    if (keysDown.has('KeyD')) { active.pos[0] = clamp(active.pos[0] + moveSpeed * safeDt, -6.5, 6.5); changed = true; }

    if (keysDown.has('KeyQ')) {
      if (state.selectedMachine === 'latPull')         state.latPullRotY    = (state.latPullRotY    + rotSpeed * safeDt) % 360;
      else if (state.selectedMachine === 'elliptical') state.ellipticalRotY = (state.ellipticalRotY + rotSpeed * safeDt) % 360;
      else if (state.selectedMachine === 'airWalker')  state.airWalkerRotY  = (state.airWalkerRotY  + rotSpeed * safeDt) % 360;
      changed = true;
    }
    if (keysDown.has('KeyE')) {
      if (state.selectedMachine === 'latPull')         state.latPullRotY    = (state.latPullRotY    - rotSpeed * safeDt + 360) % 360;
      else if (state.selectedMachine === 'elliptical') state.ellipticalRotY = (state.ellipticalRotY - rotSpeed * safeDt + 360) % 360;
      else if (state.selectedMachine === 'airWalker')  state.airWalkerRotY  = (state.airWalkerRotY  - rotSpeed * safeDt + 360) % 360;
      changed = true;
    }

    if (changed) syncBaseSliders();
  }

  // ─── Raycasting Seleksi Objek 3D ──────────────────────────────────────────
  function getPickRay(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ndcX = (x / canvas.clientWidth)  * 2 - 1;
    const ndcY = 1 - (y / canvas.clientHeight) * 2;

    const yaw = cam.yaw * DEG, pitch = cam.pitch * DEG;
    const eyeY = Math.max(cam.target[1] + cam.dist * Math.sin(pitch), 0.20);
    const eye = [
      cam.target[0] + cam.dist * Math.cos(pitch) * Math.sin(yaw),
      eyeY,
      cam.target[2] + cam.dist * Math.cos(pitch) * Math.cos(yaw)
    ];

    let fx = cam.target[0] - eye[0], fy = cam.target[1] - eye[1], fz = cam.target[2] - eye[2];
    let fl = Math.hypot(fx, fy, fz);
    fx /= fl; fy /= fl; fz /= fl;

    const up = [0, 1, 0];
    let rx = fy * up[2] - fz * up[1], ry = fz * up[0] - fx * up[2], rz = fx * up[1] - fy * up[0];
    let rl = Math.hypot(rx, ry, rz);
    rx /= rl; ry /= rl; rz /= rl;

    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;

    const fovy  = 45 * DEG;
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
    const dx = ray.origin[0] - pos[0], dy = ray.origin[1] - pos[1], dz = ray.origin[2] - pos[2];
    const oLocal = [ dx * cosT - dz * sinT, dy, dx * sinT + dz * cosT ];
    const dLocal = [ ray.dir[0] * cosT - ray.dir[2] * sinT, ray.dir[1], ray.dir[0] * sinT + ray.dir[2] * cosT ];
    return rayAABB(oLocal, dLocal, min, max);
  }

  function handleSceneClick(clientX, clientY) {
    const ray = getPickRay(clientX, clientY);
    const hits = [
      { key: 'latPull',    t: testMachineHit(ray, state.latPullPos,    state.latPullRotY,    [-2.0, 0, -1.0], [2.0, 2.6, 1.0]) },
      { key: 'elliptical', t: testMachineHit(ray, state.ellipticalPos, state.ellipticalRotY, [-0.85, 0, -0.9], [0.85, 2.1, 1.2]) },
      { key: 'airWalker',  t: testMachineHit(ray, state.airWalkerPos,  state.airWalkerRotY,  [-0.85, 0, -0.85], [0.85, 2.0, 0.85]) }
    ].filter(h => h.t !== null && h.t > 0);

    if (hits.length > 0) {
      hits.sort((a, b) => a.t - b.t);
      state.selectedMachine = hits[0].key;
    } else {
      state.selectedMachine = null;
    }
    syncBaseSliders();
  }

  // ─── Kamera Orbit ─────────────────────────────────────────────────────────
  function getMinPitch() {
    const safeHeight = 0.20;
    const sinMin = (safeHeight - cam.target[1]) / cam.dist;
    return Math.asin(clamp(sinMin, -0.99, 0.99)) * (180 / Math.PI);
  }

  function resetCamera() {
    cam.yaw = 28; cam.pitch = 20; cam.dist = 18.0;
    cam.target[0] = 0; cam.target[1] = 1.0; cam.target[2] = 0;
  }
  function viewLakeCamera() {
    cam.yaw = 52; cam.pitch = 22; cam.dist = 18.0;
    cam.target[0] = -12.5; cam.target[1] = 1.0; cam.target[2] = 0.5;
  }
  function viewOverviewCamera() {
    cam.yaw = 35; cam.pitch = 30; cam.dist = 28.0;
    cam.target[0] = -6.0; cam.target[1] = 0.8; cam.target[2] = 0.0;
  }

  document.getElementById('btnResetCamera')?.addEventListener('click', resetCamera);
  document.getElementById('btnResetCameraTopbar')?.addEventListener('click', resetCamera);
  document.getElementById('btnViewLake')?.addEventListener('click', viewLakeCamera);
  document.getElementById('btnViewOverview')?.addEventListener('click', viewOverviewCamera);

    // ─── Kontrol Orbit Kamera (Aman dari runaway/stuck drag di laptop & trackpad) ───
  let isOrbiting = false;
  let lastX = 0, lastY = 0;
  let downX = 0, downY = 0;

  function stopOrbit() {
    isOrbiting = false;
    canvas.classList.remove('dragging');
  }

  // Mulai drag: hanya tombol klik kiri utama (button 0)
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    clearAllKeys();
    isOrbiting = true;
    lastX = e.clientX;
    lastY = e.clientY;
    downX = e.clientX;
    downY = e.clientY;
    canvas.classList.add('dragging');
  });

  // Gerak rotasi kamera saat mouse/jari aktif ditekan
  window.addEventListener('pointermove', e => {
    if (!isOrbiting) return;

    // Jika tidak ada tombol yang ditekan (e.buttons === 0), langsung hentikan drag
    if (e.buttons === 0) {
      stopOrbit();
      return;
    }

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Abaikan lonjakan kursor mendadak (misal saat kursor pindah monitor)
    if (Math.abs(dx) > 80 || Math.abs(dy) > 80) return;

    cam.yaw -= dx * 0.30;
    cam.pitch = clamp(cam.pitch + dy * 0.30, getMinPitch(), 80);
  });

  const onPointerUp = e => {
    if (isOrbiting) {
      stopOrbit();
      if (e && typeof e.clientX === 'number') {
        const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
        if (dist < 6) handleSceneClick(e.clientX, e.clientY);
      }
    }
  };

  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', stopOrbit);
  canvas.addEventListener('pointercancel', stopOrbit);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', stopOrbit);
  window.addEventListener('blur', stopOrbit);
  document.addEventListener('visibilitychange', stopOrbit);

  // Zoom kamera: Langkah bertahap, throttled, dan linear (mencegah zoom melesat ke ujung di trackpad laptop)
  let lastWheelTime = 0;
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey) return; // Abaikan pinch-zoom browser

    const now = performance.now();
    if (now - lastWheelTime < 40) return; // Throttle 40ms mencegah inersia trackpad laptop melesat
    lastWheelTime = now;

    const direction = Math.sign(e.deltaY);
    if (direction === 0) return;

    // Perubahan jarak 0.6 meter per scroll notch (terkendali dan stabil)
    cam.dist = clamp(cam.dist + direction * 0.6, 6.0, 32.0);
    const minP = getMinPitch();
    if (cam.pitch < minP) cam.pitch = minP;
  }, { passive: false });

  // ─── Update UI Frame ──────────────────────────────────────────────────────
  function updateUI() {
    const [lpR] = latPull.sides;
    const [elR] = elliptical.sides;
    const [awR] = airWalker.sides;

    elPullVal.textContent      = state.latPullAngle.toFixed(1)    + '°';
    elStrideVal.textContent    = state.ellipticalStride.toFixed(1) + '°';
    elAirWalkerVal.textContent = state.airWalkerSwing.toFixed(1)   + '°';

    updateBaseLabels();

    const lpTag = state.selectedMachine === 'latPull'
      ? '<span class="hl">► [TERPILIH] LatPullBaseNode</span>' : 'LatPullBaseNode';
    const elTag = state.selectedMachine === 'elliptical'
      ? '<span class="hl">► [TERPILIH] EllipticalBaseNode</span>' : 'EllipticalBaseNode';
    const awTag = state.selectedMachine === 'airWalker'
      ? '<span class="hl">► [TERPILIH] AirWalkerBaseNode</span>' : 'AirWalkerBaseNode';

    elTree.innerHTML =
`Root (World Space)
├─ UrbanParkEnvironmentNode (Taman)
│   ├─ FitnessRubberPad (Lantai Karet)
│   ├─ JoggingTrackLoop (Paving Track)
│   ├─ ShadeTreesGroup (Pohon Peneduh)
│   ├─ ParkBenchesGroup (Bangku Taman)
│   └─ StreetlampsGroup (Lampu Taman)
│
├─ ${lpTag} (X=${state.latPullPos[0].toFixed(1)})
│   ├─ <b>ConcreteBase</b>
│   └─ <b>MainFrame</b> (Tiang Utama)
│       ├─ <b>UpperPivot</b> rotZ = <b>${(LP_REST_DEG - lpR.pull).toFixed(1)}°</b>
│       ├─ <b>RailUpper</b> α = <b>${lpR.alpha.toFixed(1)}°</b> (Kursi ↑ ${(lpR.lift * 100).toFixed(1)}cm)
│       └─ <b>LinkRod</b> (Batang Penghubung)
│
├─ ${elTag} (X=${state.ellipticalPos[0].toFixed(1)})
│   ├─ <b>ConcreteBase</b>
│   └─ <b>MainFrame</b> (Rangka Utama)
│       ├─ <b>FrontPivot</b> rotX = <b>${elR.stride.toFixed(1)}°</b>
│       ├─ <b>RearPivot</b>  rotX = <b>${elR.phi.toFixed(1)}°</b>
│       └─ <b>PedalBeam</b> (Pijakan Kaki)
│
└─ ${awTag} (X=${state.airWalkerPos[0].toFixed(1)})
    ├─ <b>ConcreteBase</b>
    └─ <b>MainFrame</b> (Portal & Stang)
        └─ <b>AirWalkerPivot</b> rotX = <b>${awR.swing.toFixed(1)}°</b>
            └─ <b>AirWalkerLeg</b> (Bandul Kaki)`;

    const act = getActivePosAndRot();
    elReadout.textContent = act
      ? `${act.name}: X=${act.pos[0].toFixed(2)}m  Z=${act.pos[2].toFixed(2)}m  RotY=${act.rot.toFixed(0)}°`
      : 'Klik model di kanvas untuk memilih alat.';
  }

  syncBaseSliders();

  if (typeof initReferenceModule === 'function') {
    initReferenceModule();
  }

  return { elPullAngle, elStrideAngle, elAirWalkerAngle, processKeyboardInput, updateUI };
}
