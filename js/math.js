'use strict';

/**
 * Math & Matrix Utilities for 3D Graphics
 * Column-major 4x4 matrix implementation matching WebGL specification.
 */
const Mat4 = {
  identity() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  },

  // out = a * b (transformasi b diterapkan DULU, lalu a)
  multiply(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r]      * b[c * 4]
                     + a[4 + r]  * b[c * 4 + 1]
                     + a[8 + r]  * b[c * 4 + 2]
                     + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  },

  translation(x, y, z) {
    const m = Mat4.identity();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m;
  },

  scaling(x, y, z) {
    const m = Mat4.identity();
    m[0] = x;
    m[5] = y;
    m[10] = z;
    return m;
  },

  rotationX(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return new Float32Array([
      1, 0,  0, 0,
      0, c,  s, 0,
      0, -s, c, 0,
      0, 0,  0, 1
    ]);
  },

  rotationY(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return new Float32Array([
      c, 0, -s, 0,
      0, 1,  0, 0,
      s, 0,  c, 0,
      0, 0,  0, 1
    ]);
  },

  rotationZ(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return new Float32Array([
      c,  s, 0, 0,
      -s, c, 0, 0,
      0,  0, 1, 0,
      0,  0, 0, 1
    ]);
  },

  // Rotasi mengelilingi sumbu sembarang (axis = unit vector) - rumus Rodrigues
  fromAxisAngle(x, y, z, rad) {
    const c = Math.cos(rad), s = Math.sin(rad), t = 1 - c;
    return new Float32Array([
      t*x*x + c,     t*x*y + s*z,   t*x*z - s*y,   0,
      t*x*y - s*z,   t*y*y + c,     t*y*z + s*x,   0,
      t*x*z + s*y,   t*y*z - s*x,   t*z*z + c,     0,
      0,             0,             0,             1
    ]);
  },

  // Versi "post-multiply" (m * T, m * R, m * S)
  translate(m, x, y, z) { return Mat4.multiply(m, Mat4.translation(x, y, z)); },
  rotateX(m, rad)       { return Mat4.multiply(m, Mat4.rotationX(rad)); },
  rotateY(m, rad)       { return Mat4.multiply(m, Mat4.rotationY(rad)); },
  rotateZ(m, rad)       { return Mat4.multiply(m, Mat4.rotationZ(rad)); },
  scale(m, x, y, z)     { return Mat4.multiply(m, Mat4.scaling(x, y, z)); },

  perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const m = new Float32Array(16);
    m[0]  = f / aspect;
    m[5]  = f;
    m[10] = (far + near) / (near - far);
    m[11] = -1;
    m[14] = (2 * far * near) / (near - far);
    return m;
  },

  lookAt(eye, center, up) {
    let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    let l = Math.hypot(zx, zy, zz);
    zx /= l; zy /= l; zz /= l;

    let xx = up[1]*zz - up[2]*zy, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
    l = Math.hypot(xx, xy, xz);
    xx /= l; xy /= l; xz /= l;

    const yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx*eye[0] + xy*eye[1] + xz*eye[2]),
      -(yx*eye[0] + yy*eye[1] + yz*eye[2]),
      -(zx*eye[0] + zy*eye[1] + zz*eye[2]),
      1
    ]);
  },

  // Titik 3D (x,y,z) dikali matriks 4x4 (w = 1)
  transformPoint(m, p) {
    return [
      m[0]*p[0] + m[4]*p[1] + m[8]*p[2]  + m[12],
      m[1]*p[0] + m[5]*p[1] + m[9]*p[2]  + m[13],
      m[2]*p[0] + m[6]*p[1] + m[10]*p[2] + m[14]
    ];
  },

  // Normal matrix = inverse-transpose 3x3 kiri-atas (lewat matriks kofaktor;
  // faktor determinan tidak masalah karena normal dinormalisasi di shader)
  normalMatrix(m) {
    const M = (r, c) => m[c * 4 + r];
    const out = new Float32Array(9);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const r1 = (r + 1) % 3, r2 = (r + 2) % 3;
        const c1 = (c + 1) % 3, c2 = (c + 2) % 3;
        out[c * 3 + r] = M(r1, c1) * M(r2, c2) - M(r1, c2) * M(r2, c1);
      }
    }
    return out;
  }
};

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
