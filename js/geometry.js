'use strict';

/**
 * Procedural 3D Mesh Generation (Interleaved buffer: Position [vec3] + Normal [vec3])
 */

function createMesh(gl, vertices, indices) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Layout 0: Position (3 floats)
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);

  // Layout 1: Normal (3 floats)
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

  let count;
  if (indices) {
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    count = indices.length;
  } else {
    count = vertices.length / 6;
  }

  gl.bindVertexArray(null);
  return { vao, count, indexed: !!indices };
}

// Silinder / pipa unit: radius 1, tinggi 1 (y dari -0.5 s/d +0.5), sumbu = Y
function makeCylinder(gl, seg = 36) {
  const v = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
    v.push(cx, 0.5, sz,  cx, 0, sz);
    v.push(cx, -0.5, sz, cx, 0, sz);
  }
  for (let i = 0; i < seg; i++) {
    const ti = 2 * i, bi = 2 * i + 1, tn = 2 * (i + 1), bn = 2 * (i + 1) + 1;
    idx.push(ti, bi, tn,  tn, bi, bn);
  }
  for (const [y, ny] of [[0.5, 1], [-0.5, -1]]) {      // tutup atas & bawah
    const center = v.length / 6;
    v.push(0, y, 0,  0, ny, 0);
    const ring = v.length / 6;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      v.push(Math.cos(a), y, Math.sin(a),  0, ny, 0);
    }
    for (let i = 0; i < seg; i++) idx.push(center, ring + i, ring + i + 1);
  }
  return createMesh(gl, v, idx);
}

// Kotak unit: sisi 1, berpusat di origin
function makeBox(gl) {
  const faces = [
    { n: [ 1, 0, 0], u: [0, 0, -1], w: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 0,  1], w: [0, 1, 0] },
    { n: [ 0, 1, 0], u: [1, 0,  0], w: [0, 0, -1] },
    { n: [ 0,-1, 0], u: [1, 0,  0], w: [0, 0,  1] },
    { n: [ 0, 0, 1], u: [1, 0,  0], w: [0, 1,  0] },
    { n: [ 0, 0,-1], u: [-1, 0, 0], w: [0, 1,  0] }
  ];
  const v = [], idx = [];
  faces.forEach((f, fi) => {
    for (const [su, sw] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      v.push(
        0.5 * f.n[0] + 0.5 * su * f.u[0] + 0.5 * sw * f.w[0],
        0.5 * f.n[1] + 0.5 * su * f.u[1] + 0.5 * sw * f.w[1],
        0.5 * f.n[2] + 0.5 * su * f.u[2] + 0.5 * sw * f.w[2],
        f.n[0], f.n[1], f.n[2]
      );
    }
    const b = fi * 4;
    idx.push(b, b + 1, b + 2,  b, b + 2, b + 3);
  });
  return createMesh(gl, v, idx);
}

// Bola unit (radius 1) - dipakai untuk sambungan pipa, baut, dan tutup kolom
function makeSphere(gl, stacks = 14, slices = 24) {
  const v = [], idx = [];
  for (let i = 0; i <= stacks; i++) {
    const phi = Math.PI * i / stacks, y = Math.cos(phi), r = Math.sin(phi);
    for (let j = 0; j <= slices; j++) {
      const th = 2 * Math.PI * j / slices, x = r * Math.cos(th), z = r * Math.sin(th);
      v.push(x, y, z,  x, y, z);
    }
  }
  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const a = i * (slices + 1) + j, b = a + slices + 1;
      idx.push(a, b, a + 1,  a + 1, b, b + 1);
    }
  }
  return createMesh(gl, v, idx);
}

// Prisma segitiga unit: segitiga siku-siku di bidang XY, diekstrusi sepanjang Z.
// Sudut siku-siku di origin, kaki sepanjang +X (1) dan +Y (1), z dari -0.5 s/d +0.5.
function makeTriangularPrism(gl) {
  const v = [], idx = [];
  // Tiga titik segitiga di z = +0.5 dan z = -0.5
  //  v0 = (0,0)  v1 = (1,0)  v2 = (0,1)
  const tri = [[0, 0], [1, 0], [0, 1]];
  const zH = 0.5;

  // --- Dua tutup segitiga (front z=+0.5 dan back z=-0.5) ---
  // Front face (normal +Z)
  for (const [x, y] of tri) v.push(x, y, zH, 0, 0, 1);
  idx.push(0, 1, 2);
  // Back face (normal -Z) — winding terbalik
  for (const [x, y] of tri) v.push(x, y, -zH, 0, 0, -1);
  idx.push(5, 4, 3);

  // --- Tiga sisi persegi panjang ---
  // Sisi 0: v0→v1  (bottom, normal -Y)
  let b = v.length / 6;
  v.push(0, 0, -zH, 0, -1, 0);
  v.push(1, 0, -zH, 0, -1, 0);
  v.push(1, 0,  zH, 0, -1, 0);
  v.push(0, 0,  zH, 0, -1, 0);
  idx.push(b, b+1, b+2, b, b+2, b+3);

  // Sisi 1: v1→v2  (hypotenuse, normal = normalize(1,1,0))
  b = v.length / 6;
  const hn = 1 / Math.SQRT2;
  v.push(1, 0, -zH, hn, hn, 0);
  v.push(0, 1, -zH, hn, hn, 0);
  v.push(0, 1,  zH, hn, hn, 0);
  v.push(1, 0,  zH, hn, hn, 0);
  idx.push(b, b+1, b+2, b, b+2, b+3);

  // Sisi 2: v2→v0  (left, normal -X)
  b = v.length / 6;
  v.push(0, 1, -zH, -1, 0, 0);
  v.push(0, 0, -zH, -1, 0, 0);
  v.push(0, 0,  zH, -1, 0, 0);
  v.push(0, 1,  zH, -1, 0, 0);
  idx.push(b, b+1, b+2, b, b+2, b+3);

  return createMesh(gl, v, idx);
}

// Grid lantai (GL_LINES), digambar unlit
function makeGrid(gl, half = 7, step = 1) {
  const v = [];
  for (let i = -half; i <= half; i += step) {
    v.push(i, 0, -half, 0, 1, 0,  i, 0, half, 0, 1, 0);
    v.push(-half, 0, i, 0, 1, 0,  half, 0, i, 0, 1, 0);
  }
  return createMesh(gl, v, null);
}

function initMeshes(gl) {
  return {
    cylinder: makeCylinder(gl),
    box: makeBox(gl),
    sphere: makeSphere(gl),
    prism: makeTriangularPrism(gl),
    grid: makeGrid(gl)
  };
}
