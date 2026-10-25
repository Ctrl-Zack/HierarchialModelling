'use strict';

/**
 * Application Entry Point & Main Render Loop
 */

function main() {
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

  // 1. Shaders & Program
  const { program, U } = initShaders(gl);

  // 2. Procedural Meshes
  const meshes = initMeshes(gl);

  // 3. Scene Graph & Hierarchy
  const { root, mainFrame, sides } = buildSceneHierarchy(meshes);

  // 4. Initial Kinematics Setup
  sides.forEach(S => initSide(S, mainFrame));

  // 5. State & Camera
  const state = {
    angle: 0,            // derajat Pull Angle (0..45)
    auto: false,
    phase: -Math.PI / 2, // fase gelombang sinus
    speed: 2,
    alt: false,
    showAxes: true,
    showGrid: true
  };

  const cam = { yaw: 28, pitch: 13, dist: 8.2, target: [0, 1.3, 0] };

  // 6. UI & Controls Setup
  const { elAngle, elAngleVal, updateUI } = setupUI(state, cam, sides, canvas);

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
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // ---- Animasi otomatis: gelombang sinus 0..45° ----
    if (state.auto) {
      state.phase += dt * state.speed;
      state.angle = 22.5 + 22.5 * Math.sin(state.phase);
      elAngle.value = state.angle;
    }
    elAngleVal.textContent = state.angle.toFixed(1) + '°';

    // ---- Terapkan sudut ke kedua engsel + selesaikan kinematika dudukan ----
    solveSide(sides[0], state.angle, mainFrame);                                  // kanan
    solveSide(sides[1], state.alt ? 45 - state.angle : state.angle, mainFrame);   // kiri

    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // ---- Kamera orbit ----
    const yaw = cam.yaw * DEG, pitch = cam.pitch * DEG;
    const eye = [
      cam.target[0] + cam.dist * Math.cos(pitch) * Math.sin(yaw),
      cam.target[1] + cam.dist * Math.sin(pitch),
      cam.target[2] + cam.dist * Math.cos(pitch) * Math.cos(yaw)
    ];
    const view = Mat4.lookAt(eye, cam.target, [0, 1, 0]);
    const proj = Mat4.perspective(45 * DEG, canvas.width / canvas.height, 0.1, 150);

    gl.useProgram(program);
    gl.uniformMatrix4fv(U.u_ViewMatrix, false, view);
    gl.uniformMatrix4fv(U.u_ProjectionMatrix, false, proj);
    gl.uniform3fv(U.u_CameraPos, eye);
    gl.uniform3fv(U.u_LightDir, [0.5, 0.9, 0.6]);
    gl.uniform3fv(U.u_FogColor, [0.81, 0.90, 0.95]);

    // Lantai rumput
    drawMesh(gl, U, meshes.box, Mat4.multiply(Mat4.translation(0, -0.02, 0), Mat4.scaling(140, 0.04, 140)), MAT.grass);
    if (state.showGrid) {
      drawMesh(gl, U, meshes.grid, Mat4.translation(0, 0.006, 0), { color: [0.24, 0.40, 0.17] }, 1);
    }

    // Seluruh pohon hierarki mulai dari Root (matriks identitas)
    drawNode(gl, U, root, Mat4.identity());

    // Sumbu lokal tiap pivot (memakai world matrix hasil traversal)
    if (state.showAxes) {
      sides.forEach(S => drawAxes(gl, U, meshes, S.pivot.world));
    }

    updateUI();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// Start application once DOM is loaded
window.addEventListener('DOMContentLoaded', main);
