#version 300 es
// ---------- VERTEX SHADER ----------
// Model -> World -> View -> Clip. Normal diubah dengan u_NormalMatrix
// (inverse-transpose 3x3 model matrix) agar benar walau ada non-uniform scale.
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
