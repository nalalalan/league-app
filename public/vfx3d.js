import * as THREE from "/vendor/three.module.min.js";

const DEFAULT_PROFILE = {
  main: "255, 238, 174",
  secondary: "226, 156, 190",
  third: "100, 143, 137",
  dark: "45, 36, 38"
};

const PRESETS = {
  samira: { mode: 1, particles: 280, speed: 1.7, ringCount: 4, shardCount: 22, beamCount: 8, roll: -0.26, cameraZ: 6.2 },
  caitlyn: { mode: 2, particles: 220, speed: 1.08, ringCount: 5, shardCount: 14, beamCount: 5, roll: 0.02, cameraZ: 6.5 },
  fizz: { mode: 3, particles: 300, speed: 1.36, ringCount: 5, shardCount: 18, beamCount: 6, roll: -0.08, cameraZ: 6.0 },
  kaisa: { mode: 4, particles: 300, speed: 1.44, ringCount: 5, shardCount: 22, beamCount: 7, roll: 0.2, cameraZ: 6.15 },
  missfortune: { mode: 5, particles: 260, speed: 1.5, ringCount: 3, shardCount: 18, beamCount: 8, roll: 0.08, cameraZ: 6.3 },
  ezreal: { mode: 6, particles: 280, speed: 1.58, ringCount: 5, shardCount: 18, beamCount: 7, roll: -0.18, cameraZ: 6.0 },
  jhin: { mode: 7, particles: 240, speed: 0.96, ringCount: 4, shardCount: 24, beamCount: 4, roll: 0.04, cameraZ: 6.5 },
  ashe: { mode: 8, particles: 280, speed: 1.34, ringCount: 4, shardCount: 24, beamCount: 6, roll: -0.06, cameraZ: 6.15 },
  rammus: { mode: 9, particles: 300, speed: 1.62, ringCount: 5, shardCount: 22, beamCount: 7, roll: 0.18, cameraZ: 6.0 },
  default: { mode: 0, particles: 240, speed: 1.2, ringCount: 4, shardCount: 16, beamCount: 5, roll: 0, cameraZ: 6.4 }
};

const TAU = Math.PI * 2;

const BACKDROP_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BACKDROP_FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uProgress;
uniform int uMode;
uniform vec3 uMain;
uniform vec3 uSecondary;
uniform vec3 uThird;
uniform vec3 uDark;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.52;
  mat2 r = mat2(0.76, -0.65, 0.65, 0.76);
  for (int i = 0; i < 5; i++) {
    v += noise(p) * a;
    p = r * p * 2.02 + 4.13;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(1.78, 1.0);
  float fade = smoothstep(0.0, 0.05, uProgress) * (1.0 - smoothstep(0.9, 1.0, uProgress));
  float mist = fbm(p * 2.2 + vec2(uTime * 0.05, -uTime * 0.035));
  float vortex = atan(p.y, p.x) * 0.12 + length(p) * 1.4 - uTime * 0.18;
  float field = pow(max(0.0, 1.0 - length(p) * 0.62), 2.6);
  vec3 color = uDark * 0.08;
  color += uMain * field * (0.18 + mist * 0.12);
  color += uSecondary * exp(-length(p - vec2(0.32, -0.14)) * 2.6) * 0.14;
  color += uThird * exp(-length(p + vec2(0.28, 0.12)) * 2.4) * 0.12;
  if (uMode == 3) {
    float caustic = pow(abs(sin((p.x + mist * 0.16) * 22.0 + uTime * 1.8) * sin((p.y - mist * 0.08) * 17.0 - uTime * 1.2)), 8.0);
    color += mix(uMain, vec3(0.86, 1.0, 0.97), 0.48) * caustic * 0.38;
  } else if (uMode == 2) {
    float scope = 1.0 - smoothstep(0.006, 0.025, abs(fract(length(p) * 6.0 - uProgress * 1.5) - 0.5));
    color += mix(uThird, uMain, 0.42) * scope * 0.08;
  } else if (uMode == 4) {
    color += mix(uSecondary, uThird, mist) * (0.2 + sin(vortex * 8.0) * 0.08) * field;
  } else if (uMode == 7) {
    float curtain = smoothstep(0.9, 0.08, abs(p.x * 0.32) + max(0.0, p.y + 0.18));
    color += mix(uMain, uSecondary, 0.5) * curtain * 0.22;
  } else if (uMode == 9) {
    float quake = 1.0 - smoothstep(0.01, 0.04, abs(sin((p.y + uProgress * 0.4) * 18.0 + mist * 2.0)));
    color += mix(uMain, uThird, 0.5) * quake * 0.06;
  }
  float grain = hash(gl_FragCoord.xy + floor(uTime * 75.0)) - 0.5;
  color = color * (1.18 + mist * 0.12) + grain * 0.018;
  float alpha = clamp((field * 0.42 + mist * 0.12) * fade, 0.0, 0.64);
  gl_FragColor = vec4(color, alpha);
}
`;

const POINT_VERTEX = `
attribute vec3 aVelocity;
attribute vec3 aColor;
attribute float aSeed;
attribute float aSize;
uniform float uTime;
uniform float uProgress;
uniform float uPixelRatio;
uniform float uSpeed;
uniform int uMode;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float life = fract(uProgress * uSpeed + aSeed);
  float envelope = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.78, 1.0, life));
  vec3 pos = position;

  if (uMode == 1) {
    pos += aVelocity * life * 2.9;
    pos.x += sin(uTime * 2.6 + aSeed * 20.0) * 0.12;
  } else if (uMode == 2) {
    pos.xy *= 0.74 + life * 0.72;
    pos.z += aVelocity.z * life * 1.4;
  } else if (uMode == 3) {
    pos += aVelocity * life * 2.2;
    pos.y += life * 2.8;
    pos.x += sin(uTime * 2.8 + aSeed * 18.0) * 0.18;
  } else if (uMode == 4) {
    float angle = uTime * (0.25 + aSeed * 0.3) + life * 4.4;
    pos.xy = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * pos.xy;
    pos += aVelocity * life * 1.5;
  } else if (uMode == 5) {
    pos += aVelocity * life * 3.6;
    pos.y -= life * 0.4;
  } else if (uMode == 6) {
    pos += aVelocity * life * 3.1;
    pos.xy += vec2(sin(uTime * 3.0 + aSeed * 16.0), cos(uTime * 2.2 + aSeed * 12.0)) * 0.08;
  } else if (uMode == 7) {
    pos += aVelocity * life * 1.8;
    pos.x += sin(uTime * 0.9 + aSeed * 20.0) * 0.22;
    pos.y += cos(uTime * 0.7 + aSeed * 14.0) * 0.1;
  } else if (uMode == 8) {
    pos += aVelocity * life * 3.0;
    pos.x += life * 1.2;
  } else if (uMode == 9) {
    pos += aVelocity * life * 3.0;
    pos.y -= life * 0.7;
  } else {
    pos += aVelocity * life * 2.0;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float depth = clamp(7.2 / max(1.0, -mvPosition.z), 0.45, 2.6);
  gl_PointSize = aSize * uPixelRatio * depth * (0.72 + envelope * 0.65);
  vColor = aColor;
  vAlpha = envelope * (0.25 + aSeed * 0.75);
}
`;

const POINT_FRAGMENT = `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  float core = smoothstep(0.5, 0.02, d);
  float halo = smoothstep(0.5, 0.18, d) * 0.45;
  gl_FragColor = vec4(vColor * (1.0 + core * 0.85), (core + halo) * vAlpha);
}
`;

function presetFor(championId) {
  return PRESETS[championId] || PRESETS.default;
}

function parseColor(value, fallback) {
  const parts = String(value || fallback).split(",").map((part) => Number(part.trim()));
  return new THREE.Color((parts[0] || 0) / 255, (parts[1] || 0) / 255, (parts[2] || 0) / 255);
}

function seeded(index, salt = 1) {
  return (Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 0.5;
}

function seededSigned(index, salt = 1) {
  return seeded(index, salt) * 2 - 1;
}

function smoothstep(edge0, edge1, value) {
  const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return x * x * (3 - 2 * x);
}

function makeColors(profile = DEFAULT_PROFILE) {
  return {
    main: parseColor(profile.main, DEFAULT_PROFILE.main),
    secondary: parseColor(profile.secondary, DEFAULT_PROFILE.secondary),
    third: parseColor(profile.third, DEFAULT_PROFILE.third),
    dark: parseColor(profile.dark, DEFAULT_PROFILE.dark)
  };
}

function createBackdrop(colors, preset) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uMode: { value: preset.mode },
      uMain: { value: colors.main },
      uSecondary: { value: colors.secondary },
      uThird: { value: colors.third },
      uDark: { value: colors.dark }
    }
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  return mesh;
}

function paletteColor(index, colors, preset) {
  if (preset.mode === 3) {
    if (index % 7 === 0) return new THREE.Color(0.94, 1, 0.98);
    if (index % 4 === 0) return colors.third.clone().lerp(colors.main, 0.76);
    return colors.main.clone().lerp(new THREE.Color(0.78, 1, 0.96), 0.34);
  }
  if (preset.mode === 8) {
    if (index % 4 === 0) return new THREE.Color(0.94, 0.99, 1);
    return index % 3 === 0 ? colors.secondary : colors.main;
  }
  if (index % 5 === 0) return colors.third;
  if (index % 3 === 0) return colors.secondary;
  return colors.main;
}

function createParticles(colors, preset) {
  const count = preset.particles;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colorValues = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const mode = preset.mode;

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const seed = seeded(index, 0.9);
    const color = paletteColor(index, colors, preset);
    let x = seededSigned(index, 1.7) * 3.8;
    let y = seededSigned(index, 2.8) * 2.2;
    let z = -0.8 - seeded(index, 3.9) * 4.2;
    let vx = seededSigned(index, 4.3) * 0.8;
    let vy = seededSigned(index, 5.4) * 0.6;
    let vz = seededSigned(index, 6.5) * 0.5;
    let size = 16 + seeded(index, 7.6) * 32;

    if (mode === 1) {
      x = seededSigned(index, 1.7) * 3.4;
      y = seededSigned(index, 2.8) * 1.7;
      vx = (index % 2 ? 1 : -1) * (1.1 + seeded(index, 4.3) * 1.4);
      vy = seededSigned(index, 5.4) * 0.8;
      size = 10 + seeded(index, 7.6) * 28;
    } else if (mode === 2) {
      const angle = seeded(index, 1.7) * Math.PI * 2;
      const radius = 0.35 + seeded(index, 2.8) * 2.6;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius * 0.56;
      vx = -x * 0.24;
      vy = -y * 0.24;
      size = 8 + seeded(index, 7.6) * 20;
    } else if (mode === 3) {
      x = seededSigned(index, 1.7) * 3.6;
      y = -2.25 - seeded(index, 2.8) * 0.7;
      z = -0.6 - seeded(index, 3.9) * 3.6;
      vx = seededSigned(index, 4.3) * 0.28;
      vy = 0.52 + seeded(index, 5.4) * 0.62;
      vz = seededSigned(index, 6.5) * 0.08;
      size = 6 + seeded(index, 7.6) * 23;
    } else if (mode === 4) {
      const angle = seeded(index, 1.7) * Math.PI * 2;
      const radius = 0.4 + seeded(index, 2.8) * 2.7;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius * 0.7;
      vx = Math.cos(angle + Math.PI * 0.5) * (0.3 + seeded(index, 4.3) * 0.5);
      vy = Math.sin(angle + Math.PI * 0.5) * (0.2 + seeded(index, 5.4) * 0.42);
      size = 12 + seeded(index, 7.6) * 30;
    } else if (mode === 5) {
      const side = index % 2 ? 1 : -1;
      x = side * (1.2 + seeded(index, 1.7) * 0.5);
      y = -1.3 + seededSigned(index, 2.8) * 0.4;
      vx = side * (1.4 + seeded(index, 4.3) * 1.6);
      vy = 1.0 + seeded(index, 5.4) * 1.2;
      size = 9 + seeded(index, 7.6) * 26;
    } else if (mode === 6 || mode === 8) {
      x = -3.4 - seeded(index, 1.7) * 0.8;
      y = 1.5 - seeded(index, 2.8) * 3.2;
      vx = 1.4 + seeded(index, 4.3) * 1.6;
      vy = -0.55 + seededSigned(index, 5.4) * 0.55;
      size = 10 + seeded(index, 7.6) * 24;
    } else if (mode === 7) {
      x = seededSigned(index, 1.7) * 2.6;
      y = 1.8 + seeded(index, 2.8) * 0.4;
      vx = seededSigned(index, 4.3) * 0.35;
      vy = -0.45 - seeded(index, 5.4) * 0.5;
      size = 14 + seeded(index, 7.6) * 30;
    } else if (mode === 9) {
      x = -2.9 + seeded(index, 1.7) * 1.0;
      y = -1.25 + seededSigned(index, 2.8) * 0.38;
      vx = 1.2 + seeded(index, 4.3) * 1.7;
      vy = 0.24 + seeded(index, 5.4) * 0.8;
      size = 12 + seeded(index, 7.6) * 34;
    }

    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    velocities[offset] = vx;
    velocities[offset + 1] = vy;
    velocities[offset + 2] = vz;
    colorValues[offset] = color.r;
    colorValues[offset + 1] = color.g;
    colorValues[offset + 2] = color.b;
    seeds[index] = seed;
    sizes[index] = size;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colorValues, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: 1 },
      uSpeed: { value: preset.speed },
      uMode: { value: preset.mode }
    }
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function createRings(colors, preset) {
  const group = new THREE.Group();
  const materialColors = [colors.main, colors.secondary, colors.third];
  for (let index = 0; index < preset.ringCount; index += 1) {
    const geometry = new THREE.TorusGeometry(0.8 + index * 0.09, 0.006 + index * 0.0015, 8, 160);
    const material = new THREE.MeshBasicMaterial({
      color: materialColors[index % materialColors.length],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      base: 0.48 + index * 0.18,
      delay: index * 0.06,
      spin: (index % 2 ? -1 : 1) * (0.42 + index * 0.07),
      mode: preset.mode
    };
    group.add(mesh);
  }
  return group;
}

function createBeams(colors, preset) {
  const group = new THREE.Group();
  const materialColors = [colors.main, new THREE.Color(1, 0.96, 0.82), colors.secondary, colors.third];
  for (let index = 0; index < preset.beamCount; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: materialColors[index % materialColors.length],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.018 + seeded(index, 9.2) * 0.025), material);
    mesh.userData = {
      seed: seeded(index, 1.4),
      mode: preset.mode,
      side: index % 2 ? 1 : -1
    };
    group.add(mesh);
  }
  return group;
}

function createShards(colors, preset) {
  const group = new THREE.Group();
  const geometry = new THREE.TetrahedronGeometry(0.055, 0);
  const materialColors = [colors.main, colors.secondary, colors.third, new THREE.Color(1, 0.96, 0.84)];
  for (let index = 0; index < preset.shardCount; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: materialColors[index % materialColors.length],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      seed: seeded(index, 2.3),
      x: seededSigned(index, 3.4) * 3.4,
      y: seededSigned(index, 4.5) * 1.8,
      z: -0.4 - seeded(index, 5.6) * 3.2,
      scale: 0.55 + seeded(index, 6.7) * 1.8,
      side: index % 2 ? 1 : -1,
      mode: preset.mode
    };
    group.add(mesh);
  }
  return group;
}

function relicMaterial(color, opacity = 0.48) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: Math.min(0.86, opacity * 1.25),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

function registerRelic(mesh, options = {}) {
  mesh.userData = {
    ...mesh.userData,
    role: options.role || "detail",
    baseOpacity: options.baseOpacity ?? mesh.material.opacity ?? 0.42,
    baseX: mesh.position.x,
    baseY: mesh.position.y,
    baseZ: mesh.position.z,
    baseRotX: mesh.rotation.x,
    baseRotY: mesh.rotation.y,
    baseRotZ: mesh.rotation.z,
    baseScaleX: mesh.scale.x,
    baseScaleY: mesh.scale.y,
    baseScaleZ: mesh.scale.z,
    phase: options.phase ?? 0,
    side: options.side ?? 1,
    spin: options.spin ?? 0
  };
  return mesh;
}

function addRelicPlane(group, width, height, color, opacity, x, y, z, rotationZ = 0, options = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), relicMaterial(color, opacity));
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotationZ;
  if (options.scale) mesh.scale.set(options.scale[0], options.scale[1], options.scale[2] ?? 1);
  registerRelic(mesh, { ...options, baseOpacity: opacity });
  group.add(mesh);
  return mesh;
}

function addRelicTorus(group, radius, tube, color, opacity, x, y, z, rotations = [0, 0, 0], options = {}) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 128), relicMaterial(color, opacity));
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotations[0], rotations[1], rotations[2]);
  if (options.scale) mesh.scale.set(options.scale[0], options.scale[1], options.scale[2] ?? 1);
  registerRelic(mesh, { ...options, baseOpacity: opacity });
  group.add(mesh);
  return mesh;
}

function addRelicSphere(group, radius, color, opacity, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), relicMaterial(color, opacity));
  mesh.position.set(x, y, z);
  registerRelic(mesh, { ...options, baseOpacity: opacity });
  group.add(mesh);
  return mesh;
}

function addRelicCone(group, radius, height, color, opacity, x, y, z, rotationZ = 0, options = {}) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 4, 1, false), relicMaterial(color, opacity));
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotationZ;
  if (options.scale) mesh.scale.set(options.scale[0], options.scale[1], options.scale[2] ?? 1);
  registerRelic(mesh, { ...options, baseOpacity: opacity });
  group.add(mesh);
  return mesh;
}

function addRelicCylinder(group, radius, height, color, opacity, x, y, z, rotationZ = 0, options = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12, 1, false), relicMaterial(color, opacity));
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotationZ;
  if (options.scale) mesh.scale.set(options.scale[0], options.scale[1], options.scale[2] ?? 1);
  registerRelic(mesh, { ...options, baseOpacity: opacity });
  group.add(mesh);
  return mesh;
}

function createChampionRelic(colors, preset) {
  const group = new THREE.Group();
  const mode = preset.mode;
  const warm = new THREE.Color(1, 0.96, 0.78);
  const water = new THREE.Color(0.76, 1, 0.96);
  const ice = new THREE.Color(0.9, 0.98, 1);
  const shadow = colors.dark.clone().lerp(colors.main, 0.42);
  group.position.z = -0.44;
  group.scale.setScalar(1.42);

  if (mode === 1) {
    addRelicTorus(group, 0.76, 0.012, colors.secondary, 0.42, 0, 0.02, 0, [0.35, 0, 0.2], { role: "ring", scale: [1.12, 0.38, 1], spin: 0.8 });
    addRelicTorus(group, 0.98, 0.008, colors.main, 0.32, 0, 0.02, -0.08, [0.32, 0, -0.26], { role: "ring", scale: [1.2, 0.32, 1], spin: -0.7, phase: 0.22 });
    for (let index = 0; index < 10; index += 1) {
      const angle = index * 0.34 - 1.62;
      const radius = 0.24 + (index % 3) * 0.035;
      addRelicPlane(
        group,
        1.75 + (index % 2) * 0.32,
        0.035,
        index % 2 ? colors.main : colors.secondary,
        0.34,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.45,
        -0.04 - index * 0.018,
        angle,
        { role: "blade", phase: index / 10, spin: index % 2 ? 0.75 : -0.62, side: index % 2 ? 1 : -1 }
      );
    }
    addRelicPlane(group, 0.72, 0.06, warm, 0.3, -0.72, -0.38, -0.05, 0.18, { role: "muzzle", phase: 0.18, side: -1 });
    addRelicPlane(group, 0.72, 0.06, warm, 0.3, 0.74, -0.36, -0.05, -0.18, { role: "muzzle", phase: 0.62, side: 1 });
  } else if (mode === 2) {
    for (let index = 0; index < 4; index += 1) {
      addRelicTorus(group, 0.48 + index * 0.17, 0.006 + index * 0.001, index % 2 ? colors.third : warm, 0.28, 0.1, 0.02, -index * 0.04, [0.02, 0, index * 0.09], { role: "scope", scale: [1.38, 0.72, 1], phase: index * 0.11, spin: index % 2 ? -0.28 : 0.2 });
    }
    addRelicPlane(group, 1.78, 0.012, warm, 0.42, 0.1, 0.02, -0.02, 0, { role: "reticle", phase: 0.1 });
    addRelicPlane(group, 0.012, 1.02, colors.third, 0.32, 0.1, 0.02, -0.02, 0, { role: "reticle", phase: 0.26 });
    addRelicPlane(group, 3.4, 0.032, colors.main, 0.3, -1.32, -0.08, -0.14, -0.05, { role: "beam", phase: 0.42 });
    addRelicPlane(group, 0.78, 0.12, warm, 0.44, -1.42, -0.08, -0.1, -0.05, { role: "muzzle", phase: 0.42 });
  } else if (mode === 3) {
    group.position.y = -0.12;
    for (let index = 0; index < 5; index += 1) {
      addRelicTorus(group, 0.42 + index * 0.16, 0.01, index % 2 ? water : colors.main, 0.3, 0.03, -0.24 + index * 0.045, -index * 0.055, [0.82, 0.04, index * 0.34], { role: "water-ring", scale: [1.48, 0.34, 1], phase: index * 0.12, spin: index % 2 ? -0.72 : 0.86 });
    }
    addRelicCylinder(group, 0.028, 1.52, water, 0.46, -0.24, 0.12, -0.05, -0.24, { role: "trident", phase: 0.12 });
    addRelicCone(group, 0.085, 0.34, water, 0.46, -0.41, 0.86, -0.04, -0.24, { role: "trident-tip", phase: 0.18 });
    addRelicCone(group, 0.07, 0.28, colors.main, 0.38, -0.24, 0.91, -0.04, 0, { role: "trident-tip", phase: 0.28 });
    addRelicCone(group, 0.085, 0.34, water, 0.46, -0.07, 0.84, -0.04, 0.24, { role: "trident-tip", phase: 0.38 });
    for (let index = 0; index < 22; index += 1) {
      const angle = (index / 22) * TAU;
      const radius = 0.36 + (index % 5) * 0.12;
      addRelicSphere(
        group,
        0.018 + (index % 4) * 0.006,
        index % 2 ? water : warm,
        0.2,
        Math.cos(angle) * radius * 1.5,
        -0.8 + (index % 7) * 0.13,
        -0.16 - (index % 4) * 0.05,
        { role: "bubble", phase: index / 22, spin: index % 2 ? 1 : -1 }
      );
    }
  } else if (mode === 4) {
    addRelicSphere(group, 0.23, colors.secondary, 0.46, 0, 0.02, -0.04, { role: "core", phase: 0.2, spin: 0.8 });
    addRelicTorus(group, 0.38, 0.009, colors.third, 0.34, 0, 0.02, -0.02, [0.5, 0.2, -0.35], { role: "ring", scale: [1.05, 0.58, 1], phase: 0.1, spin: 0.6 });
    [-1, 1].forEach((side) => {
      for (let index = 0; index < 4; index += 1) {
        addRelicPlane(
          group,
          0.18 + index * 0.035,
          1.06 - index * 0.08,
          index % 2 ? colors.main : colors.secondary,
          0.32,
          side * (0.34 + index * 0.18),
          0.08 - index * 0.055,
          -0.08 - index * 0.035,
          side * (0.52 + index * 0.14),
          { role: "wing", phase: 0.16 + index * 0.11, side, spin: side * 0.18 }
        );
      }
    });
  } else if (mode === 5) {
    [-1, 1].forEach((side) => {
      addRelicPlane(group, 1.18, 0.11, warm, 0.36, side * 0.52, -0.34, -0.05, side * -0.2, { role: "pistol", phase: side > 0 ? 0.35 : 0.15, side });
      addRelicPlane(group, 0.88, 0.035, colors.main, 0.34, side * 0.92, -0.18, -0.08, side * -0.72, { role: "muzzle", phase: side > 0 ? 0.5 : 0.26, side });
      addRelicTorus(group, 0.22, 0.008, colors.secondary, 0.28, side * 0.72, -0.19, -0.12, [0.2, 0.05, side * -0.2], { role: "muzzle-ring", scale: [1.4, 0.42, 1], phase: side > 0 ? 0.55 : 0.32, side });
    });
    for (let index = 0; index < 8; index += 1) {
      addRelicPlane(group, 1.6, 0.022, index % 2 ? colors.secondary : warm, 0.22, 0, -0.02 + index * 0.06, -0.28 - index * 0.02, -0.95 + index * 0.26, { role: "fan", phase: index / 8, spin: 0.18 });
    }
  } else if (mode === 6) {
    group.position.x = -0.1;
    for (let index = 0; index < 5; index += 1) {
      addRelicTorus(group, 0.26 + index * 0.13, 0.008, index % 2 ? colors.secondary : colors.main, 0.3, -0.52 + index * 0.03, -0.08 + index * 0.025, -index * 0.05, [0.55, -0.18, -0.72 + index * 0.18], { role: "gauntlet-ring", scale: [1.25, 0.62, 1], phase: index * 0.1, spin: index % 2 ? -0.6 : 0.7 });
    }
    for (let index = 0; index < 7; index += 1) {
      addRelicPlane(group, 0.34, 0.042, index % 2 ? warm : colors.third, 0.34, -0.12 + index * 0.26, 0.4 - index * 0.18, -0.12 - index * 0.025, -0.76, { role: "chevron", phase: index / 7, spin: 0.24 });
      addRelicPlane(group, 0.34, 0.042, index % 2 ? warm : colors.third, 0.34, 0.02 + index * 0.26, 0.29 - index * 0.18, -0.12 - index * 0.025, 0.76, { role: "chevron", phase: index / 7 + 0.08, spin: -0.24 });
    }
  } else if (mode === 7) {
    addRelicTorus(group, 0.58, 0.01, warm, 0.36, 0, 0.02, -0.06, [0.1, 0.05, 0], { role: "aperture", scale: [1.1, 0.8, 1], phase: 0.1, spin: 0.24 });
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI * 0.5 + 0.34;
      addRelicPlane(group, 0.34, 1.02, index % 2 ? colors.secondary : colors.main, 0.3, Math.cos(angle) * 0.2, Math.sin(angle) * 0.16, -0.08, angle, { role: "petal", phase: index * 0.18, spin: 0.16 });
    }
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI * 0.5;
      addRelicPlane(group, 1.48, 0.015, shadow, 0.24, Math.cos(angle) * 0.02, Math.sin(angle) * 0.02, -0.16, angle, { role: "curtain-cut", phase: index * 0.12, spin: 0.12 });
    }
  } else if (mode === 8) {
    addRelicPlane(group, 2.7, 0.045, ice, 0.44, 0.05, 0.1, -0.05, -0.1, { role: "arrow", phase: 0.16 });
    addRelicCone(group, 0.22, 0.48, ice, 0.48, 1.42, -0.04, -0.04, -Math.PI * 0.6, { role: "arrowhead", phase: 0.2 });
    for (let index = 0; index < 10; index += 1) {
      const side = index % 2 ? 1 : -1;
      addRelicCone(group, 0.055 + (index % 3) * 0.018, 0.42 + (index % 4) * 0.08, index % 2 ? colors.main : ice, 0.28, -0.86 + index * 0.2, side * (0.18 + (index % 3) * 0.07), -0.15 - index * 0.025, side * (0.8 + index * 0.04), { role: "ice-shard", phase: index / 10, side });
    }
  } else if (mode === 9) {
    const shellMaterial = relicMaterial(colors.main, 0.4);
    shellMaterial.wireframe = true;
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 2), shellMaterial);
    shell.position.set(0, -0.06, -0.06);
    registerRelic(shell, { role: "shell", baseOpacity: 0.4, spin: 0.9 });
    group.add(shell);
    addRelicTorus(group, 0.7, 0.012, colors.third, 0.28, 0, -0.08, -0.12, [0.72, 0.1, 0], { role: "roll-ring", scale: [1.24, 0.34, 1], phase: 0.12, spin: 1 });
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * TAU;
      addRelicCone(group, 0.052, 0.32, index % 2 ? colors.secondary : warm, 0.28, Math.cos(angle) * 0.58, Math.sin(angle) * 0.42 - 0.04, -0.04, angle - Math.PI * 0.5, { role: "spike", phase: index / 12, spin: 0.12 });
    }
  } else {
    addRelicTorus(group, 0.66, 0.01, colors.main, 0.34, 0, 0, -0.05, [0.4, 0.1, 0], { role: "ring", scale: [1.16, 0.55, 1], spin: 0.3 });
    addRelicSphere(group, 0.24, colors.secondary, 0.36, 0, 0, -0.03, { role: "core", spin: 0.4 });
  }

  group.traverse((node) => {
    if (node.material) node.material.opacity = 0;
  });
  return group;
}

function updateRings(group, elapsed, progress, preset) {
  group.children.forEach((mesh, index) => {
    const local = Math.max(0, Math.min(1, (progress - mesh.userData.delay) / 0.84));
    const pulse = smoothstep(0, 0.22, local) * (1 - smoothstep(0.72, 1, local));
    const mode = preset.mode;
    let sx = mesh.userData.base + local * 1.8;
    let sy = sx;
    if (mode === 1) sy *= 0.36;
    if (mode === 3) sy *= 0.28 + Math.sin(elapsed * 0.002 + index) * 0.025;
    if (mode === 5) sy *= 0.22;
    if (mode === 8) sy *= 0.42;
    if (mode === 9) sy *= 0.3;
    mesh.scale.set(sx, sy, 1);
    mesh.rotation.z = preset.roll + elapsed * 0.0004 * mesh.userData.spin + index * 0.42;
    mesh.rotation.x = mode === 2 ? 0 : 0.32 + index * 0.035;
    mesh.rotation.y = mode === 4 ? elapsed * 0.0005 + index * 0.12 : index * 0.03;
    mesh.material.opacity = pulse * (mode === 3 ? 0.2 : 0.26);
  });
}

function updateBeams(group, elapsed, progress, preset) {
  group.children.forEach((mesh, index) => {
    const local = (progress * preset.speed + mesh.userData.seed) % 1;
    const hit = smoothstep(0, 0.08, local) * (1 - smoothstep(0.52, 1, local));
    const side = mesh.userData.side;
    const mode = preset.mode;
    let x = -3.2 + local * 6.4;
    let y = seededSigned(index, 8.1) * 1.5;
    let length = 1.4 + seeded(index, 9.8) * 2.6;
    let angle = -0.28 + seededSigned(index, 10.9) * 0.3;

    if (mode === 1) {
      x = side * (2.7 - local * 4.8);
      y = seededSigned(index, 8.1) * 1.25;
      angle = side * (0.54 + seeded(index, 10.9) * 0.3);
      length = 1.8 + seeded(index, 9.8) * 2.1;
    } else if (mode === 2) {
      x = -3.0 + local * 3.0;
      y = 0.75 - local * 0.8;
      angle = -0.2;
      length = 3.6;
    } else if (mode === 3) {
      x = seededSigned(index, 8.1) * 2.9;
      y = -1.25 + Math.sin(elapsed * 0.002 + index) * 0.25 + local * 0.65;
      angle = 0.04 + Math.sin(elapsed * 0.0014 + index) * 0.08;
      length = 1.2 + seeded(index, 9.8) * 2.5;
    } else if (mode === 5) {
      x = side * (1.05 + local * 2.7);
      y = -1.2 + local * 2.3;
      angle = side * 0.72;
      length = 2.8 + seeded(index, 9.8) * 1.8;
    } else if (mode === 6 || mode === 8) {
      x = -2.8 + local * 5.6;
      y = 1.25 - local * 2.4;
      angle = -0.56;
      length = 2.4 + seeded(index, 9.8) * 2.0;
    } else if (mode === 7) {
      x = seededSigned(index, 8.1) * 2.0;
      y = 1.3 - local * 2.2;
      angle = Math.PI * 0.5;
      length = 2.6;
    } else if (mode === 9) {
      x = -2.6 + local * 5.2;
      y = -1.35 + seeded(index, 8.1) * 0.42;
      angle = 0.05;
      length = 1.4 + local * 2.7;
    }

    mesh.position.set(x, y, -1.0 - seeded(index, 11.2) * 2.2);
    mesh.rotation.z = angle;
    mesh.scale.set(length * (0.45 + hit), 1, 1);
    mesh.material.opacity = hit * (mode === 3 ? 0.16 : 0.22);
  });
}

function updateShards(group, elapsed, progress, preset) {
  group.children.forEach((mesh, index) => {
    const seed = mesh.userData.seed;
    const local = (progress * (preset.speed * 0.75) + seed) % 1;
    const visible = smoothstep(0, 0.1, local) * (1 - smoothstep(0.78, 1, local));
    const mode = preset.mode;
    let x = mesh.userData.x + mesh.userData.side * local * 1.4;
    let y = mesh.userData.y + (local - 0.5) * 1.2;
    let z = mesh.userData.z + local * 0.6;
    if (mode === 3) {
      y = -1.5 + local * 2.5 + Math.sin(elapsed * 0.003 + index) * 0.18;
      x = mesh.userData.x * 0.8 + Math.sin(local * 5.0 + index) * 0.24;
    } else if (mode === 7) {
      y = 1.5 - local * 2.5;
      x += Math.sin(elapsed * 0.001 + index) * 0.28;
    } else if (mode === 8) {
      x = -2.8 + local * 5.4 + seededSigned(index, 9.1) * 0.4;
      y = 1.0 - local * 1.9 + seededSigned(index, 4.5) * 0.7;
    } else if (mode === 9) {
      y = -1.25 + Math.sin(local * Math.PI) * (0.45 + seed * 0.5);
      x = -2.2 + local * 4.4 + seededSigned(index, 3.4) * 0.5;
    }
    mesh.position.set(x, y, z);
    mesh.rotation.set(elapsed * 0.0012 + seed * 4.0, elapsed * 0.0016 + seed * 5.0, elapsed * 0.001 + index);
    const s = mesh.userData.scale * (0.45 + visible * 1.1);
    mesh.scale.setScalar(s);
    mesh.material.opacity = visible * (mode === 7 ? 0.18 : 0.24);
  });
}

function updateChampionRelic(group, elapsed, progress, preset) {
  const time = elapsed / 1000;
  const visibility = smoothstep(0.025, 0.18, progress) * (1 - smoothstep(0.88, 1, progress));
  const mode = preset.mode;
  group.visible = visibility > 0.005;
  group.rotation.x = Math.sin(time * 0.58 + mode) * 0.045 + (mode === 3 ? 0.08 : 0);
  group.rotation.y = Math.sin(time * 0.42 + mode * 0.4) * 0.07;
  group.rotation.z = preset.roll * 0.18 + Math.sin(time * 0.34 + mode) * 0.03;
  if (mode === 1) group.rotation.z += time * 0.42;
  if (mode === 3) group.rotation.z += Math.sin(time * 0.9) * 0.08;
  if (mode === 9) group.rotation.z -= progress * 5.6;

  group.children.forEach((mesh, index) => {
    const data = mesh.userData;
    const phase = data.phase + index * 0.03;
    const pulse = 0.5 + Math.sin(time * (1.4 + preset.speed * 0.28) + phase * TAU) * 0.5;
    const shimmer = 0.78 + pulse * 0.38;
    mesh.position.set(data.baseX, data.baseY, data.baseZ);
    mesh.rotation.set(data.baseRotX, data.baseRotY, data.baseRotZ);
    mesh.scale.set(data.baseScaleX, data.baseScaleY, data.baseScaleZ);
    mesh.material.opacity = Math.min(0.92, data.baseOpacity * visibility * shimmer * 1.42);

    if (data.role.includes("ring") || data.role === "scope" || data.role === "aperture") {
      const swell = 1 + Math.sin(time * (0.8 + Math.abs(data.spin)) + phase * TAU) * 0.035 + progress * 0.08;
      mesh.scale.set(data.baseScaleX * swell, data.baseScaleY * (1 + (swell - 1) * 0.42), data.baseScaleZ);
      mesh.rotation.z = data.baseRotZ + time * data.spin * 0.32;
    } else if (data.role === "bubble") {
      const drift = (progress * 1.55 + phase) % 1;
      mesh.position.x = data.baseX + Math.sin(time * 2.4 + phase * TAU) * 0.11;
      mesh.position.y = data.baseY + drift * 1.08;
      mesh.scale.setScalar(data.baseScaleX * (0.72 + drift * 0.8));
      mesh.material.opacity = Math.min(0.78, data.baseOpacity * visibility * (1 - smoothstep(0.72, 1, drift)) * (0.92 + pulse * 0.55) * 1.42);
    } else if (data.role === "blade" || data.role === "fan" || data.role === "curtain-cut") {
      mesh.rotation.z = data.baseRotZ + Math.sin(time * 1.2 + phase * TAU) * 0.08 * data.side;
      mesh.scale.x = data.baseScaleX * (1 + pulse * 0.18);
    } else if (data.role === "beam" || data.role === "muzzle") {
      const flash = smoothstep(0.12, 0.34, progress) * (1 - smoothstep(0.68, 0.92, progress));
      mesh.scale.x = data.baseScaleX * (1 + flash * 1.4 + pulse * 0.18);
      mesh.material.opacity = Math.min(0.95, data.baseOpacity * visibility * (0.78 + flash * 1.45 + pulse * 0.24) * 1.38);
    } else if (data.role.includes("trident")) {
      mesh.position.y = data.baseY + Math.sin(time * 1.2 + phase * TAU) * 0.045;
      mesh.rotation.z = data.baseRotZ + Math.sin(time * 0.9 + phase * TAU) * 0.035;
    } else if (data.role === "wing") {
      mesh.rotation.z = data.baseRotZ + Math.sin(time * 0.9 + phase * TAU) * 0.08 * data.side;
      mesh.position.x = data.baseX + Math.sin(time * 0.7 + phase * TAU) * 0.055 * data.side;
    } else if (data.role === "core" || data.role === "shell") {
      mesh.rotation.x = data.baseRotX + time * 0.28;
      mesh.rotation.y = data.baseRotY + time * (0.45 + Math.abs(data.spin) * 0.22);
      mesh.scale.setScalar(data.baseScaleX * (1 + pulse * 0.08));
    } else if (data.role === "arrow" || data.role === "arrowhead" || data.role === "chevron") {
      const travel = smoothstep(0.04, 0.76, progress);
      mesh.position.x = data.baseX + travel * 0.26;
      mesh.position.y = data.baseY - travel * 0.08 + Math.sin(time * 1.6 + phase * TAU) * 0.02;
      mesh.scale.x = data.baseScaleX * (1 + travel * 0.22 + pulse * 0.08);
    } else if (data.role === "ice-shard" || data.role === "spike") {
      mesh.rotation.z = data.baseRotZ + Math.sin(time * 1.3 + phase * TAU) * 0.07 * data.side;
      mesh.scale.setScalar(data.baseScaleX * (0.9 + pulse * 0.22));
    } else if (data.role === "petal") {
      mesh.rotation.z = data.baseRotZ + time * 0.08 + pulse * 0.08;
      mesh.scale.y = data.baseScaleY * (0.9 + pulse * 0.22);
    }
  });
}

export function createChampionVfx3D({ canvas, championId = "default", profile = DEFAULT_PROFILE, duration = 4200 } = {}) {
  const preset = presetFor(championId);
  const colors = makeColors(profile);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 40);
  camera.position.set(0, 0, preset.cameraZ);

  const backdrop = createBackdrop(colors, preset);
  scene.add(backdrop);

  const root = new THREE.Group();
  root.rotation.z = preset.roll * 0.08;
  scene.add(root);

  const particles = createParticles(colors, preset);
  const rings = createRings(colors, preset);
  const beams = createBeams(colors, preset);
  const shards = createShards(colors, preset);
  const relic = createChampionRelic(colors, preset);
  root.add(particles, rings, beams, shards, relic);

  let disposed = false;
  let lastWidth = 0;
  let lastHeight = 0;
  let lastRatio = 1;

  function resize(width, height, pixelRatio = 1) {
    if (disposed) return;
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    const safeRatio = Math.max(1, Math.min(pixelRatio || 1, 1.25));
    if (safeWidth === lastWidth && safeHeight === lastHeight && safeRatio === lastRatio) return;
    lastWidth = safeWidth;
    lastHeight = safeHeight;
    lastRatio = safeRatio;
    renderer.setPixelRatio(safeRatio);
    renderer.setSize(safeWidth, safeHeight, false);
    camera.aspect = safeWidth / safeHeight;
    camera.updateProjectionMatrix();
    particles.material.uniforms.uPixelRatio.value = safeRatio;
  }

  function render(elapsed = 0, frameDuration = duration) {
    if (disposed) return;
    const progress = Math.min(Math.max(elapsed / Math.max(1, frameDuration), 0), 1);
    const time = elapsed / 1000;
    backdrop.material.uniforms.uTime.value = time;
    backdrop.material.uniforms.uProgress.value = progress;
    particles.material.uniforms.uTime.value = time;
    particles.material.uniforms.uProgress.value = progress;
    root.rotation.x = Math.sin(time * 0.42) * 0.035;
    root.rotation.y = Math.sin(time * 0.36 + preset.mode) * 0.055;
    root.rotation.z = preset.roll * 0.08 + Math.sin(time * 0.28) * 0.025;
    camera.position.x = Math.sin(time * 0.45 + preset.mode) * 0.12;
    camera.position.y = Math.cos(time * 0.38) * 0.08;
    camera.lookAt(0, 0, 0);
    updateRings(rings, elapsed, progress, preset);
    updateBeams(beams, elapsed, progress, preset);
    updateShards(shards, elapsed, progress, preset);
    updateChampionRelic(relic, elapsed, progress, preset);
    renderer.render(scene, camera);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    scene.traverse((node) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) {
        if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
        else node.material.dispose();
      }
    });
    renderer.dispose();
  }

  return { resize, render, dispose };
}
