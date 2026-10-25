#version 300 es
// ---------- FRAGMENT SHADER ----------
// Pencahayaan Blinn-Phong: ambient (hemisphere) + diffuse + specular dari satu
// directional light utama, ditambah fill light lemah. Kabut tipis di kejauhan
// supaya tepi lantai menyatu dengan langit.
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
