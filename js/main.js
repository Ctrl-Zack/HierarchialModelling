'use strict';

/**
 * Application Entry Point & Main Render Loop for 3 Outdoor Fitness Machines + Urban Park Scenery
 */

async function main() {
  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true });

  if (!gl) {
    const e = document.getElementById('error');
    if (e) {
      e.style.display = 'block';
      e.textContent = 'WebGL2 tidak didukung oleh browser/perangkat ini.';
    }
    throw new Error('WebGL2 not supported');
  }

  // 1. Shaders & Program (Dimuat langsung dari file .glsl)
  let shaderInit;
  try {
    shaderInit = await initShaders(gl);
  } catch (err) {
    console.error('Error saat inisialisasi shader:', err);
    return;
  }
  const { program, U } = shaderInit;

  // 2. Procedural Meshes
  const meshes = initMeshes(gl);

  // 3. Scene Graph & Hierarchy (3 Mesin Bersebelahan + Urban Park Scenery di Bawah Root)
  const sceneData = buildSceneHierarchy(meshes);
  const { root, latPull, elliptical, airWalker, environmentNode } = sceneData;

  // 4. Inisialisasi Kinematika Awal
  latPull.sides.forEach(S => initSide(S, latPull.mainFrame));
  elliptical.sides.forEach(S => initEllipticalSide(S));

  // 5. State Aplikasi (Default: belum ada alat yang dipilih)
  const state = {
    selectedMachine: null, // null | 'latPull' | 'elliptical' | 'airWalker'

    // Mesin 1: Lat Pull Down
    latPullPos: [...DEFAULT_BASES.latPull.pos],
    latPullRotY: DEFAULT_BASES.latPull.rotY,
    latPullAngle: 0,

    // Mesin 2: Elliptical Trainer
    ellipticalPos: [...DEFAULT_BASES.elliptical.pos],
    ellipticalRotY: DEFAULT_BASES.elliptical.rotY,
    ellipticalStride: 0,

    // Mesin 3: Outdoor Air Walker (Pendulum Leg Swing)
    airWalkerPos: [...DEFAULT_BASES.airWalker.pos],
    airWalkerRotY: DEFAULT_BASES.airWalker.rotY,
    airWalkerSwing: 0,

    // Animasi Global
    auto: false,
    phase: -Math.PI / 2,
    speed: 2,
    alt: true,

    // Tampilan
    showHighlight: true,
    showAxes: false,
    showGrid: false,
    showScenery: true
  };

  const cam = { yaw: 35, pitch: 25, dist: 22.0, target: [-3.0, 1.0, 0] };

  // 6. UI & Keyboard Input Setup
  const { elPullAngle, elStrideAngle, elAirWalkerAngle, processKeyboardInput, updateUI } = setupUI(state, cam, sceneData, canvas);

  // 7. Viewport Resize Helper
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // 8. Main Render Loop
  let lastTime = performance.now();

  function frame(now) {
    if (!now) now = performance.now();
    const dt = Math.min(Math.max((now - lastTime) / 1000, 0.0), 0.05) || 0.016;
    lastTime = now;

    // ---- Pemrosesan Input Keyboard WASD Real-Time ----
    processKeyboardInput(dt);

    // ---- Animasi otomatis ----
    if (state.auto) {
      state.phase += dt * state.speed;

      // 1. Lat Pull Down: 0 s/d 45 derajat
      state.latPullAngle = 22.5 + 22.5 * Math.sin(state.phase);
      elPullAngle.value = state.latPullAngle;

      // 2. Elliptical: -12 s/d +12 derajat (dicap agar tidak melebihi zona stabil linkage)
      state.ellipticalStride = 12 * Math.sin(state.phase);
      elStrideAngle.value = state.ellipticalStride;

      // 3. Air Walker: -22 s/d +22 derajat
      state.airWalkerSwing = 22 * Math.sin(state.phase);
      elAirWalkerAngle.value = state.airWalkerSwing;
    }

    // ---- 1. Terapkan Transformasi Base ke Parent Nodes (Hierarchical Matrix Stack) ----
    latPull.baseNode.translation = [state.latPullPos[0], state.latPullPos[1], state.latPullPos[2]];
    latPull.baseNode.rotation = [0, state.latPullRotY, 0];

    elliptical.baseNode.translation = [state.ellipticalPos[0], state.ellipticalPos[1], state.ellipticalPos[2]];
    elliptical.baseNode.rotation = [0, state.ellipticalRotY, 0];

    airWalker.baseNode.translation = [state.airWalkerPos[0], state.airWalkerPos[1], state.airWalkerPos[2]];
    airWalker.baseNode.rotation = [0, state.airWalkerRotY, 0];

    // ---- 2. Selesaikan Kinematika Ketiga Mesin ----
    // Mesin 1: Lat Pull Down
    solveSide(latPull.sides[0], state.latPullAngle, latPull.mainFrame);
    solveSide(latPull.sides[1], state.alt ? 45 - state.latPullAngle : state.latPullAngle, latPull.mainFrame);

    // Mesin 2: Elliptical Trainer (Four-Bar Linkage)
    solveEllipticalSide(elliptical.sides[0], state.ellipticalStride);
    solveEllipticalSide(elliptical.sides[1], state.alt ? -state.ellipticalStride : state.ellipticalStride);

    // Mesin 3: Air Walker (Pendulum Leg Swing)
    solveAirWalkerSide(airWalker.sides[0], state.airWalkerSwing);
    solveAirWalkerSide(airWalker.sides[1], state.alt ? -state.airWalkerSwing : state.airWalkerSwing);

    // ---- 3. Render Pipeline ----
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Kamera Orbit (Dibatasi di atas permukaan tanah agar tidak tembus ke bawah tanah)
    const yaw = cam.yaw * DEG, pitch = cam.pitch * DEG;
    const eyeY = Math.max(cam.target[1] + cam.dist * Math.sin(pitch), 0.20);
    const eye = [
      cam.target[0] + cam.dist * Math.cos(pitch) * Math.sin(yaw),
      eyeY,
      cam.target[2] + cam.dist * Math.cos(pitch) * Math.cos(yaw)
    ];
    const view = Mat4.lookAt(eye, cam.target, [0, 1, 0]);
    const proj = Mat4.perspective(45 * DEG, canvas.width / canvas.height, 0.1, 150);

    gl.useProgram(program);
    gl.uniformMatrix4fv(U.u_ViewMatrix, false, view);
    gl.uniformMatrix4fv(U.u_ProjectionMatrix, false, proj);
    gl.uniform3fv(U.u_CameraPos, eye);
    gl.uniform3fv(U.u_LightDir, [0.45, 0.85, 0.55]); // Sinar matahari keemasan dari atas-kanan
    gl.uniform3fv(U.u_FogColor, [0.80, 0.88, 0.94]); // Kabut atmosferik horizon langit
    gl.uniform1f(U.u_Time, (now || performance.now()) * 0.001); // Waktu untuk riak air & caustics

    // Lantai Rumput Hijau (World Ground)
    drawMesh(gl, U, meshes.box, Mat4.multiply(Mat4.translation(0, -0.02, 0), Mat4.scaling(160, 0.04, 160)), MAT.grass);
    if (state.showGrid) {
      drawMesh(gl, U, meshes.grid, Mat4.translation(0, 0.006, 0), { color: [0.24, 0.40, 0.17] }, 1);
    }

    // Toggle visibilitas scenery taman
    if (environmentNode) {
      environmentNode.visible = state.showScenery;
    }

    // Traversal Seluruh Pohon Hierarki Mulai dari Root (Matrix Stack)
    drawNode(gl, U, root, Mat4.identity());

    // Highlight Kotak Seleksi Base: HANYA jika ada alat yang sedang dipilih
    if (state.showHighlight && state.selectedMachine) {
      if (state.selectedMachine === 'latPull') {
        drawSelectionBox(gl, U, meshes, latPull.baseNode.world, 1.95, 0.95);
      } else if (state.selectedMachine === 'elliptical') {
        drawSelectionBox(gl, U, meshes, elliptical.baseNode.world, 0.82, 1.30);
      } else if (state.selectedMachine === 'airWalker') {
        drawSelectionBox(gl, U, meshes, airWalker.baseNode.world, 0.80, 0.95);
      }
    }

    // Visualisasi Sumbu Lokal Pivot
    if (state.showAxes) {
      latPull.sides.forEach(S => drawAxes(gl, U, meshes, S.pivot.world, 0.22));
      elliptical.sides.forEach(S => drawAxes(gl, U, meshes, S.frontPivot.world, 0.22));
      airWalker.sides.forEach(S => drawAxes(gl, U, meshes, S.pivot.world, 0.22));
    }

    updateUI();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', main);
