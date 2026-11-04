'use strict';

/**
 * WebGL2 Rendering & Matrix Stack Hierarchy Traversal
 */

function drawMesh(gl, U, mesh, model, mat, unlit = 0) {
  gl.uniformMatrix4fv(U.u_ModelMatrix, false, model);
  gl.uniformMatrix3fv(U.u_NormalMatrix, false, Mat4.normalMatrix(model));
  gl.uniform3fv(U.u_Color, mat.color);
  gl.uniform1f(U.u_Shininess, mat.shine || 32);
  gl.uniform1f(U.u_SpecStrength, mat.spec || 0);
  gl.uniform1i(U.u_Unlit, unlit);
  gl.uniform1i(U.u_IsWater, mat.isWater ? 1 : 0);

  gl.bindVertexArray(mesh.vao);
  if (mesh.indexed) {
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.drawArrays(gl.LINES, 0, mesh.count);
  }
}

function drawNode(gl, U, node, parentWorld) {
  if (node.visible === false) return;

  const world = Mat4.multiply(parentWorld, node.localMatrix());
  node.world = world;

  for (const part of node.parts) {
    drawMesh(gl, U, part.mesh, Mat4.multiply(world, part.matrix), part.mat, part.unlit || 0);
  }

  for (const child of node.children) {
    drawNode(gl, U, child, world);
  }
}

// Sumbu koordinat lokal pivot yang proporsional dan tidak menusuk pandangan
function drawAxes(gl, U, meshes, frame, L = 0.22) {
  const axes = [
    { to: [L, 0, 0], col: [1.0, 0.22, 0.22] }, // X = merah
    { to: [0, L, 0], col: [0.20, 0.85, 0.22] }, // Y = hijau
    { to: [0, 0, L], col: [0.25, 0.45, 1.00] }  // Z = biru
  ];

  gl.disable(gl.DEPTH_TEST);
  for (const a of axes) {
    drawMesh(gl, U, meshes.cylinder, Mat4.multiply(frame, pipeMatrix([0, 0, 0], a.to, 0.007)), { color: a.col }, 1);
    const tip = Mat4.scale(Mat4.translation(a.to[0], a.to[1], a.to[2]), 0.024, 0.024, 0.024);
    drawMesh(gl, U, meshes.box, Mat4.multiply(frame, tip), { color: a.col }, 1);
  }
  gl.enable(gl.DEPTH_TEST);
}

// Cincin seleksi kotak base di atas lantai (RTS-style placement box)
function drawSelectionBox(gl, U, meshes, baseWorld, halfW = 1.8, halfD = 1.0) {
  const y = 0.045;
  const c = [0.10, 1.00, 0.32];
  const r = 0.022;

  gl.disable(gl.DEPTH_TEST);
  const p1 = [-halfW, y, -halfD];
  const p2 = [ halfW, y, -halfD];
  const p3 = [ halfW, y,  halfD];
  const p4 = [-halfW, y,  halfD];

  const corners = [p1, p2, p3, p4];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    drawMesh(gl, U, meshes.cylinder, Mat4.multiply(baseWorld, pipeMatrix(a, b, r)), { color: c }, 1);
    const cornerBox = Mat4.scale(Mat4.translation(a[0], a[1], a[2]), 0.04, 0.04, 0.04);
    drawMesh(gl, U, meshes.box, Mat4.multiply(baseWorld, cornerBox), { color: c }, 1);
  }
  gl.enable(gl.DEPTH_TEST);
}
