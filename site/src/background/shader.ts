import type { Rgb } from "./math";

/**
 * The field: three passes of domain-warped fbm (gradient noise) give a slow,
 * marbled flow. Two accent fields are tinted into the background color at low
 * strength, and faint contour lines of the same scalar field give it a
 * topographic texture instead of a generic gradient blob. The pointer pinches
 * the domain toward itself, so the contours visibly gather around it.
 */
export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uPointer;      // xy: 0..1 (y up), z: presence 0..1
uniform vec3 uBg;
uniform vec3 uFg;
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uHue;         // radians, scroll-driven
uniform float uIntensity;   // how far the fields tint away from uBg
uniform float uLines;       // contour line opacity
uniform float uScale;       // feature size (higher = smaller features)
uniform float uPull;        // pointer attraction strength
uniform vec2 uSeed;

out vec4 outColor;

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const float LEVELS = 16.0;
const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * gnoise(p);
    p = ROT * p;
    a *= 0.5;
  }
  return s;
}

// Hue rotation in YIQ space; keeps luminance stable.
vec3 hueRotate(vec3 c, float a) {
  const mat3 toYiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRgb = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYiq * c;
  float s = sin(a), k = cos(a);
  yiq.yz = mat2(k, s, -s, k) * yiq.yz;
  return clamp(toRgb * yiq, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;

  // Pointer: pinch the domain toward the cursor with a soft falloff.
  vec2 d = p - (uPointer.xy - 0.5) * aspect;
  float falloff = exp(-dot(d, d) * 7.0) * uPointer.z;
  p -= d * uPull * falloff;

  p = p * uScale + uSeed;
  float t = uTime;

  // Incommensurate drift speeds keep the motion non-periodic.
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.071 * t)),
    fbm(p + vec2(5.2, 1.3) - vec2(0.053 * t, 0.0))
  );
  vec2 r = vec2(
    fbm(p + 1.8 * q + vec2(1.7, 9.2) + 0.037 * t),
    fbm(p + 1.8 * q + vec2(8.3, 2.8) - 0.029 * t)
  );
  float f = fbm(p + 1.6 * r);

  vec3 a1 = hueRotate(uAccent, uHue);
  vec3 a2 = hueRotate(uAccent2, -uHue * 0.6);

  // Contour levels of the warped field. Tints are partly terraced to the
  // levels, like a hypsometric map, so the color reads as bands, not a blob.
  float level = f * LEVELS;
  float terrace = (floor(level) + 0.5) / LEVELS;
  float h = mix(f, terrace, 0.3);

  float w1 = smoothstep(-0.12, 0.32, h);
  float w2 = smoothstep(0.08, 0.45, length(q)) * (1.0 - 0.75 * w1);

  vec3 col = uBg;
  col = mix(col, a1, w1 * uIntensity);
  col = mix(col, a2, w2 * uIntensity);

  // Antialiased iso-lines via screen-space derivatives; every fourth line is
  // an "index contour", slightly stronger. Lines fade in and out by region.
  float fw = max(fwidth(level), 1e-4);
  float minor = 1.0 - smoothstep(0.0, 1.1, abs(fract(level + 0.5) - 0.5) / fw);
  float majorLevel = level * 0.25;
  float major = 1.0 - smoothstep(0.0, 1.5, abs(fract(majorLevel + 0.5) - 0.5) / (fw * 0.25));
  float line = max(minor * 0.55, major);
  float region = 0.3 + 0.7 * smoothstep(0.05, 0.4, length(r) + 0.25 * falloff);
  col = mix(col, mix(uFg, a1, 0.35), line * region * uLines);

  // Dither to hide banding in the low-contrast gradients.
  col += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;

export interface FieldUniforms {
  time: number;
  pointer: readonly [x: number, y: number, presence: number];
  bg: Rgb;
  fg: Rgb;
  accent: Rgb;
  accent2: Rgb;
  hue: number;
  intensity: number;
  lines: number;
  scale: number;
  pull: number;
  seed: readonly [number, number];
}

export interface FieldRenderer {
  readonly gl: WebGL2RenderingContext;
  /** Resize the backing store (pixels, not CSS). */
  resize(width: number, height: number): void;
  render(uniforms: FieldUniforms): void;
  dispose(): void;
}

const UNIFORMS = [
  "uRes",
  "uTime",
  "uPointer",
  "uBg",
  "uFg",
  "uAccent",
  "uAccent2",
  "uHue",
  "uIntensity",
  "uLines",
  "uScale",
  "uPull",
  "uSeed",
] as const;
type UniformName = (typeof UNIFORMS)[number];

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (
    !gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
    !gl.isContextLost()
  ) {
    console.warn("LivingBackground shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Returns null when WebGL2 is unavailable or the program fails to build. */
export function createFieldRenderer(
  canvas: HTMLCanvasElement,
): FieldRenderer | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("LivingBackground program:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  // One oversized triangle covers the viewport.
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  for (const name of UNIFORMS) loc[name] = gl.getUniformLocation(program, name);

  const ctx = gl;
  return {
    gl: ctx,
    resize(width, height) {
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    },
    render(u) {
      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.useProgram(program);
      ctx.bindVertexArray(vao);
      ctx.uniform2f(loc.uRes, canvas.width, canvas.height);
      ctx.uniform1f(loc.uTime, u.time);
      ctx.uniform3f(loc.uPointer, u.pointer[0], u.pointer[1], u.pointer[2]);
      ctx.uniform3f(loc.uBg, u.bg[0], u.bg[1], u.bg[2]);
      ctx.uniform3f(loc.uFg, u.fg[0], u.fg[1], u.fg[2]);
      ctx.uniform3f(loc.uAccent, u.accent[0], u.accent[1], u.accent[2]);
      ctx.uniform3f(loc.uAccent2, u.accent2[0], u.accent2[1], u.accent2[2]);
      ctx.uniform1f(loc.uHue, u.hue);
      ctx.uniform1f(loc.uIntensity, u.intensity);
      ctx.uniform1f(loc.uLines, u.lines);
      ctx.uniform1f(loc.uScale, u.scale);
      ctx.uniform1f(loc.uPull, u.pull);
      ctx.uniform2f(loc.uSeed, u.seed[0], u.seed[1]);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    },
    dispose() {
      ctx.deleteBuffer(buffer);
      ctx.deleteVertexArray(vao);
      ctx.deleteProgram(program);
    },
  };
}
