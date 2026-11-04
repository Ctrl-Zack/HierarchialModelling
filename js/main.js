'use strict';

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

  let shaderInit;
  try {
    shaderInit = await initShaders(gl);
  } catch (err) {
    console.error('Error saat inisialisasi shader:', err);
    return;
  }
  const { program, U } = shaderInit;

  const meshes = initMeshes(gl);

  const sceneData = buildSceneHierarchy(meshes);
  const { root, latPull, elliptical, airWalker, environmentNode } = sceneData;

  latPull.sides.forEach(S => initSide(S, latPull.mainFrame));
  elliptical.sides.forEach(S => initEllipticalSide(S));

  const state = {
    selectedMachine: null,

    latPullPos: [...DEFAULT_BASES.latPull.pos],
    latPullRotY: DEFAULT_BASES.latPull.rotY,
    latPullAngle: 0,

    ellipticalPos: [...DEFAULT_BASES.elliptical.pos],
    ellipticalRotY: DEFAULT_BASES.elliptical.rotY,
    ellipticalStride: 0,

    airWalkerPos: [...DEFAULT_BASES.airWalker.pos],
    airWalkerRotY: DEFAULT_BASES.airWalker.rotY,
    airWalkerSwing: 0,

    // Global Animation
    auto: false,
    phase: -Math.PI / 2,
    speed: 2,
    alt: true,

    showAxes: false,
    showGrid: false,
    showScenery: true
  };

  const cam = { yaw: 35, pitch: 25, dist: 22.0, target: [-3.0, 1.0, 0] };

  const { elPullAngle, elStrideAngle, elAirWalkerAngle, processKeyboardInput, updateUI } = setupUI(state, cam, sceneData, canvas);

  const MIN_EYE_HEIGHT = 1.5;
  const WALK_SPEED = 8;        // meter / second (arrow)
  const CAM_MOVE_SPEED = 6;    // meter / second (spasi / ctrl)
  const ROTATE_SPEED = 70;     // derajat / second (Shift + arrow)
  const camKeys = { left: false, right: false, up: false, down: false, rise: false, sink: false, shift: false };

  function isTextField(el) {
    return !!el && (el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && /^(text|number|search|email|password|url)$/i.test(el.type || 'text')));
  }

  function setCamKey(e, pressed) {
    if (isTextField(e.target)) return;
    camKeys.shift = e.shiftKey;
    let handled = true;
    switch (e.code) {
      case 'ArrowLeft':    camKeys.left  = pressed; break;
      case 'ArrowRight':   camKeys.right = pressed; break;
      case 'ArrowUp':      camKeys.up    = pressed; break;
      case 'ArrowDown':    camKeys.down  = pressed; break;
      case 'Space':        camKeys.rise  = pressed; break;
      case 'ControlLeft':
      case 'ControlRight': camKeys.sink  = pressed; break;
      case 'KeyK':
        if (pressed && !e.repeat) state.auto = !state.auto;
        break;
      default: handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  window.addEventListener('keydown', e => setCamKey(e, true), true);
  window.addEventListener('keyup', e => setCamKey(e, false), true);
  window.addEventListener('blur', () => { for (const k in camKeys) camKeys[k] = false; });

  function updateCameraControls(dt) {
    if (camKeys.shift && (camKeys.left || camKeys.right || camKeys.up || camKeys.down)) {
      const p0 = cam.pitch * DEG, y0 = cam.yaw * DEG;
      const ex = cam.target[0] + cam.dist * Math.cos(p0) * Math.sin(y0);
      const ey = cam.target[1] + cam.dist * Math.sin(p0);
      const ez = cam.target[2] + cam.dist * Math.cos(p0) * Math.cos(y0);

      if (camKeys.left)  cam.yaw   += ROTATE_SPEED * dt;
      if (camKeys.right) cam.yaw   -= ROTATE_SPEED * dt;
      if (camKeys.up)    cam.pitch -= ROTATE_SPEED * dt;
      if (camKeys.down)  cam.pitch += ROTATE_SPEED * dt;
      cam.pitch = Math.min(Math.max(cam.pitch, -80), 85);

      const p1 = cam.pitch * DEG, y1 = cam.yaw * DEG;
      cam.target[0] = ex - cam.dist * Math.cos(p1) * Math.sin(y1);
      cam.target[1] = ey - cam.dist * Math.sin(p1);
      cam.target[2] = ez - cam.dist * Math.cos(p1) * Math.cos(y1);
    }

    const yawRad = cam.yaw * DEG;
    const fwdX = -Math.sin(yawRad), fwdZ = -Math.cos(yawRad);
    const rgtX =  Math.cos(yawRad), rgtZ = -Math.sin(yawRad);
    const moveF = camKeys.shift ? 0 : (camKeys.up ? 1 : 0) - (camKeys.down ? 1 : 0);
    const moveR = camKeys.shift ? 0 : (camKeys.right ? 1 : 0) - (camKeys.left ? 1 : 0);
    if (moveF || moveR) {
      const len = Math.hypot(moveF, moveR);
      const step = WALK_SPEED * dt / len;
      cam.target[0] += (fwdX * moveF + rgtX * moveR) * step;
      cam.target[2] += (fwdZ * moveF + rgtZ * moveR) * step;
    }

    if (camKeys.rise) cam.target[1] += CAM_MOVE_SPEED * dt;
    if (camKeys.sink) cam.target[1] -= CAM_MOVE_SPEED * dt;

    const minTargetY = MIN_EYE_HEIGHT - cam.dist * Math.sin(cam.pitch * DEG);
    if (cam.target[1] < minTargetY) cam.target[1] = minTargetY;
  }

  // Viewport Resize Helper
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

  // Main Render Loop
  let lastTime = performance.now();

  function frame(now) {
    if (!now) now = performance.now();
    const dt = Math.min(Math.max((now - lastTime) / 1000, 0.0), 0.05) || 0.016;
    lastTime = now;

    processKeyboardInput(dt);
    updateCameraControls(dt);

    if (state.auto) {
      state.phase += dt * state.speed;

      state.latPullAngle = 22.5 + 22.5 * Math.sin(state.phase);
      elPullAngle.value = state.latPullAngle;

      state.ellipticalStride = 12 * Math.sin(state.phase);
      elStrideAngle.value = state.ellipticalStride;

      state.airWalkerSwing = 22 * Math.sin(state.phase);
      elAirWalkerAngle.value = state.airWalkerSwing;
    }

    latPull.baseNode.translation = [state.latPullPos[0], state.latPullPos[1], state.latPullPos[2]];
    latPull.baseNode.rotation = [0, state.latPullRotY, 0];

    elliptical.baseNode.translation = [state.ellipticalPos[0], state.ellipticalPos[1], state.ellipticalPos[2]];
    elliptical.baseNode.rotation = [0, state.ellipticalRotY, 0];

    airWalker.baseNode.translation = [state.airWalkerPos[0], state.airWalkerPos[1], state.airWalkerPos[2]];
    airWalker.baseNode.rotation = [0, state.airWalkerRotY, 0];

    solveSide(latPull.sides[0], state.latPullAngle, latPull.mainFrame);
    solveSide(latPull.sides[1], state.alt ? 45 - state.latPullAngle : state.latPullAngle, latPull.mainFrame);

    solveEllipticalSide(elliptical.sides[0], state.ellipticalStride);
    solveEllipticalSide(elliptical.sides[1], -state.ellipticalStride);

    solveAirWalkerSide(airWalker.sides[0], state.airWalkerSwing);
    solveAirWalkerSide(airWalker.sides[1], state.alt ? -state.airWalkerSwing : state.airWalkerSwing);

    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const yaw = cam.yaw * DEG, pitch = cam.pitch * DEG;
    const eyeY = Math.max(cam.target[1] + cam.dist * Math.sin(pitch), MIN_EYE_HEIGHT);
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
    gl.uniform3fv(U.u_LightDir, [0.45, 0.85, 0.55]);
    gl.uniform3fv(U.u_FogColor, [0.80, 0.88, 0.94]);
    gl.uniform1f(U.u_Time, (now || performance.now()) * 0.001);

    // World Ground
    drawMesh(gl, U, meshes.box, Mat4.multiply(Mat4.translation(0, -0.02, 0), Mat4.scaling(160, 0.04, 160)), MAT.grass);
    if (state.showGrid) {
      drawMesh(gl, U, meshes.grid, Mat4.translation(0, 0.006, 0), { color: [0.24, 0.40, 0.17] }, 1);
    }

    // == Options ==
    if (environmentNode) {
      environmentNode.visible = state.showScenery;
    }

    drawNode(gl, U, root, Mat4.identity());

    if (state.selectedMachine) {
      if (state.selectedMachine === 'latPull') {
        drawSelectionBox(gl, U, meshes, latPull.baseNode.world, 1.95, 0.95);
      } else if (state.selectedMachine === 'elliptical') {
        drawSelectionBox(gl, U, meshes, elliptical.baseNode.world, 0.82, 1.30);
      } else if (state.selectedMachine === 'airWalker') {
        drawSelectionBox(gl, U, meshes, airWalker.baseNode.world, 0.80, 0.95);
      }
    }

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