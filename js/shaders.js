'use strict';

async function loadShaderFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    const source = await response.text();
    if (!source || source.trim().length === 0) {
      throw new Error(`File ${url} kosong.`);
    }
    return source;
  } catch (err) {
    const isFileProtocol = window.location.protocol === 'file:';
    let msg = `Gagal memuat shader dari file: "${url}".\n`;
    if (isFileProtocol) {
      msg += `Penyebab: Anda membuka file secara langsung via protokol file:// (klik ganda index.html). ` +
             `Browser memblokir fetch() file lokal demi keamanan (CORS restriction).\n\n` +
             `Solusi: Jalankan proyek menggunakan Web Server lokal, misalnya:\n` +
             `• VS Code: Gunakan ekstensi "Live Server" (Klik kanan index.html -> Open with Live Server)\n` +
             `• Terminal: Jalankan "npx serve ." atau "python -m http.server 8000"`;
    } else {
      msg += `Penyebab teknis: ${err.message}`;
    }
    const errBox = document.getElementById('error');
    if (errBox) {
      errBox.style.display = 'block';
      errBox.innerText = msg;
    }
    throw new Error(msg);
  }
}

function compileShader(gl, type, src, shaderName) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src.trim());
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Kompilasi shader gagal pada [${shaderName}]:\n${info}`);
  }
  return sh;
}

function createProgram(gl, vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vsSrc, 'shaders/vertex.glsl'));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc, 'shaders/fragment.glsl'));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`Link Program WebGL gagal:\n${info}`);
  }
  return p;
}

async function initShaders(gl) {
  // Memuat langsung dari file .glsl di folder shaders/
  const [vsSource, fsSource] = await Promise.all([
    loadShaderFile('shaders/vertex.glsl'),
    loadShaderFile('shaders/fragment.glsl')
  ]);

  const program = createProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  const U = {};
  [
    'u_ModelMatrix', 'u_ViewMatrix', 'u_ProjectionMatrix', 'u_NormalMatrix',
    'u_Color', 'u_LightDir', 'u_CameraPos', 'u_FogColor',
    'u_Shininess', 'u_SpecStrength', 'u_Unlit',
    'u_IsWater', 'u_Time'
  ].forEach(n => {
    U[n] = gl.getUniformLocation(program, n);
  });

  return { program, U };
}
