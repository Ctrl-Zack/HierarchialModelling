'use strict';

/**
 * Shader sources & compilation helpers for WebGL2.
 * The source codes mirror shaders/vertex.glsl and shaders/fragment.glsl.
 */
const VS_SOURCE = `#version 300 es
// ---------- VERTEX SHADER ----------
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat3 u_NormalMatrix;

out vec3 v_normal;
out vec3 v_worldPos;

void main() {
  vec4 worldPos = u_ModelMatrix * vec4(a_position, 1.0);
  v_worldPos = worldPos.xyz;
  v_normal = normalize(u_NormalMatrix * a_normal);
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
}
`;

const FS_SOURCE = `#version 300 es
// ---------- FRAGMENT SHADER ----------
// Pencahayaan Blinn-Phong + kabut (fog)
precision highp float;

in vec3 v_normal;
in vec3 v_worldPos;

uniform vec3  u_Color;
uniform vec3  u_LightDir;     // arah MENUJU cahaya (world space)
uniform vec3  u_CameraPos;
uniform vec3  u_FogColor;
uniform float u_Shininess;
uniform float u_SpecStrength;
uniform int   u_Unlit;        // 1 = warna polos (sumbu, grid)

out vec4 outColor;

void main() {
  vec3 result;
  if (u_Unlit == 1) {
    result = u_Color;
  } else {
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_CameraPos - v_worldPos);
    vec3 albedo = pow(u_Color, vec3(2.2));            // sRGB -> linear

    vec3 ambient = mix(vec3(0.05, 0.045, 0.04), vec3(0.22, 0.27, 0.34), N.y * 0.5 + 0.5) * albedo;

    vec3 L = normalize(u_LightDir);
    float diff = max(dot(N, L), 0.0);
    vec3 H = normalize(L + V);
    float spec = diff > 0.0 ? pow(max(dot(N, H), 0.0), u_Shininess) * u_SpecStrength : 0.0;

    vec3 L2 = normalize(vec3(-0.6, 0.25, -0.5));
    float diff2 = max(dot(N, L2), 0.0) * 0.22;

    vec3 col = ambient
             + albedo * vec3(1.0, 0.95, 0.88) * diff * 1.05
             + albedo * vec3(0.55, 0.65, 0.9) * diff2
             + vec3(1.0, 0.97, 0.9) * spec;
    result = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));  // linear -> sRGB
  }
  float fog = smoothstep(14.0, 40.0, length(u_CameraPos - v_worldPos));
  outColor = vec4(mix(result, u_FogColor, fog), 1.0);
}
`;

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src.trim());
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compilation error: ' + info);
  }
  return sh;
}

function createProgram(gl, vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error('Program link error: ' + info);
  }
  return p;
}

function initShaders(gl) {
  const program = createProgram(gl, VS_SOURCE, FS_SOURCE);
  gl.useProgram(program);

  const U = {};
  [
    'u_ModelMatrix', 'u_ViewMatrix', 'u_ProjectionMatrix', 'u_NormalMatrix',
    'u_Color', 'u_LightDir', 'u_CameraPos', 'u_FogColor',
    'u_Shininess', 'u_SpecStrength', 'u_Unlit'
  ].forEach(n => {
    U[n] = gl.getUniformLocation(program, n);
  });

  return { program, U };
}
