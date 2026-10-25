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

  gl.bindVertexArray(mesh.vao);
  if (mesh.indexed) {
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.drawArrays(gl.LINES, 0, mesh.count);
  }
}

function drawNode(gl, U, node, parentWorld) {
  // 1) Akumulasikan transformasi: parentWorld x localMatrix
  const world = Mat4.multiply(parentWorld, node.localMatrix());
  node.world = world;

  // 2) Gambar seluruh part milik node
  for (const part of node.parts) {
    drawMesh(gl, U, part.mesh, Mat4.multiply(world, part.matrix), part.mat);
  }

  // 3) Rekursi ke anak (child nodes)
  for (const child of node.children) {
    drawNode(gl, U, child, world);
  }
}

function drawAxes(gl, U, meshes, frame) {
  const L = 0.5;
  const axes = [
    { to: [L, 0, 0], col: [1.0, 0.15, 0.15] },
    { to: [0, L, 0], col: [0.15, 0.85, 0.2] },
    { to: [0, 0, L], col: [0.2, 0.4, 1.0] }
  ];

  gl.disable(gl.DEPTH_TEST);
  for (const a of axes) {
    drawMesh(gl, U, meshes.cylinder, Mat4.multiply(frame, pipeMatrix([0, 0, 0], a.to, 0.012)), { color: a.col }, 1);
    const tip = Mat4.scale(Mat4.translation(a.to[0], a.to[1], a.to[2]), 0.045, 0.045, 0.045);
    drawMesh(gl, U, meshes.box, Mat4.multiply(frame, tip), { color: a.col }, 1);
  }
  gl.enable(gl.DEPTH_TEST);
}
