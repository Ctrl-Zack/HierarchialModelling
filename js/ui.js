'use strict';

/**
 * UI Controls, Interaction Listeners & Orbit Camera
 */

function setupUI(state, cam, sides, canvas) {
  const elAngle = document.getElementById('pullAngle');
  const elAngleVal = document.getElementById('angleVal');
  const elAuto = document.getElementById('btnAuto');
  const elSpeed = document.getElementById('speed');
  const elSpeedVal = document.getElementById('speedVal');
  const elTree = document.getElementById('tree');
  const elReadout = document.getElementById('readout');

  function setAuto(on) {
    state.auto = on;
    if (on) {
      const s = clamp((state.angle - 22.5) / 22.5, -1, 1);
      state.phase = Math.asin(s);
    }
    elAuto.textContent = on ? '⏸ Hentikan Auto Animation' : '▶ Mulai Auto Animation';
    elAuto.classList.toggle('on', on);
  }

  elAngle.addEventListener('input', () => {
    if (state.auto) setAuto(false);
    state.angle = parseFloat(elAngle.value);
  });

  elAuto.addEventListener('click', () => setAuto(!state.auto));

  elSpeed.addEventListener('input', () => {
    state.speed = parseFloat(elSpeed.value);
    elSpeedVal.textContent = state.speed.toFixed(1);
  });

  document.getElementById('chkAlt').addEventListener('change', e => {
    state.alt = e.target.checked;
  });

  document.getElementById('chkAxes').addEventListener('change', e => {
    state.showAxes = e.target.checked;
  });

  document.getElementById('chkGrid').addEventListener('change', e => {
    state.showGrid = e.target.checked;
  });

  // Orbit kamera: pointer drag
  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
  });

  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    cam.yaw   -= (e.clientX - lastX) * 0.4;
    cam.pitch += (e.clientY - lastY) * 0.4;
    cam.pitch = clamp(cam.pitch, -5, 85);
    lastX = e.clientX;
    lastY = e.clientY;
  });

  const endDrag = () => {
    dragging = false;
    canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // Zoom: wheel
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.001), 3, 18);
  }, { passive: false });

  function updateUI() {
    const [R, L] = sides;
    const cm = s => (s.lift * 100).toFixed(1);
    elTree.innerHTML =
`Root
 └ MainFrame
    ├ <b>UpperPivotNode</b> R/L  rotZ
    │    = <b>${(REST_DEG - R.pull).toFixed(1)}° / ${(REST_DEG - L.pull).toFixed(1)}°</b>
    │  └ MovingArm
    │     ├ GripNode 1
    │     └ GripNode 2
    ├ LinkRod R/L  (constraint)
    ├ <b>RailUpper</b> R/L  pivot α
    │    = <b>${R.alpha.toFixed(1)}° / ${L.alpha.toFixed(1)}°</b>
    │  └ <b>SeatNode</b> R/L  pivot −α
    │       kaki tegak  <b>↑ ${cm(R)} / ${cm(L)} cm</b>
    └ RailLower R/L  (sejajar RailUpper)`;

    const w = R.arm.children[0].world;
    elReadout.textContent =
      `Pull  R ${R.pull.toFixed(1)}°  L ${L.pull.toFixed(1)}°\n` +
      `Grip kanan (world)\n x=${w[12].toFixed(2)}  y=${w[13].toFixed(2)}  z=${w[14].toFixed(2)}`;
  }

  return { elAngle, elAngleVal, updateUI };
}
