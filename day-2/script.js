// ============================================================
// SECTION 1: IMPORTS
// We bring in Three.js — a powerful 3D graphics library
// ============================================================
import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';

// ============================================================
// SECTION 2: PLANET & MOON DATA
// All the info about each planet: size, distance from sun, moons
// Scale: 1 AU (Earth-Sun distance) = 200 Three.js units
// ============================================================
const PLANET_DATA = [
  {
    name: 'Mercury', radius: 6,  orbitRadius: 77,   orbitalPeriod: 0.241,
    type: 'mercury', color: 0x9a8f85, moons: []
  },
  {
    name: 'Venus',   radius: 14, orbitRadius: 144,  orbitalPeriod: 0.615,
    type: 'venus',   color: 0xe8cda0, moons: []
  },
  {
    name: 'Earth',   radius: 15, orbitRadius: 200,  orbitalPeriod: 1.0,
    type: 'earth',   color: 0x4488ff,
    moons: [
      { name: 'Moon',    orbitRadius: 42,  radius: 4.0, orbitalPeriod: 0.0748, color: 0xaaaaaa, type: 'moon' }
    ]
  },
  {
    name: 'Mars',    radius: 8,  orbitRadius: 304,  orbitalPeriod: 1.88,
    type: 'mars',    color: 0xcc4422,
    moons: [
      { name: 'Phobos', orbitRadius: 18,  radius: 1.4, orbitalPeriod: 0.00876, color: 0x887766, type: 'moon' },
      { name: 'Deimos', orbitRadius: 28,  radius: 0.9, orbitalPeriod: 0.0327,  color: 0x998877, type: 'moon' }
    ]
  },
  {
    name: 'Jupiter', radius: 165, orbitRadius: 1040, orbitalPeriod: 11.86,
    type: 'jupiter', color: 0xc88b3a,
    moons: [
      { name: 'Io',       orbitRadius: 260, radius: 8.4,  orbitalPeriod: 0.00484, color: 0xffe066, type: 'io'     },
      { name: 'Europa',   orbitRadius: 350, radius: 7.2,  orbitalPeriod: 0.00972, color: 0xeef4ff, type: 'europa' },
      { name: 'Ganymede', orbitRadius: 490, radius: 12.3, orbitalPeriod: 0.01957, color: 0x998877, type: 'moon'   },
      { name: 'Callisto', orbitRadius: 680, radius: 11.1, orbitalPeriod: 0.04566, color: 0x776655, type: 'moon'   }
    ]
  },
  {
    name: 'Saturn',  radius: 140, orbitRadius: 1906, orbitalPeriod: 29.46,
    type: 'saturn',  color: 0xe4d191, hasRings: true,
    moons: [
      { name: 'Mimas',     orbitRadius: 195, radius: 2.4,  orbitalPeriod: 0.00249, color: 0xbbbbbb, type: 'moon'  },
      { name: 'Enceladus', orbitRadius: 235, radius: 3.0,  orbitalPeriod: 0.00365, color: 0xeeeeff, type: 'moon'  },
      { name: 'Tethys',    orbitRadius: 285, radius: 4.0,  orbitalPeriod: 0.00519, color: 0xcccccc, type: 'moon'  },
      { name: 'Dione',     orbitRadius: 335, radius: 4.2,  orbitalPeriod: 0.00731, color: 0xbbaaaa, type: 'moon'  },
      { name: 'Rhea',      orbitRadius: 435, radius: 5.5,  orbitalPeriod: 0.01221, color: 0xbbbbaa, type: 'moon'  },
      { name: 'Titan',     orbitRadius: 700, radius: 12.0, orbitalPeriod: 0.04374, color: 0xdd9944, type: 'titan' }
    ]
  },
  {
    name: 'Uranus',  radius: 58,  orbitRadius: 3834, orbitalPeriod: 84.01,
    type: 'uranus',  color: 0x7de8e8,
    moons: [
      { name: 'Miranda', orbitRadius: 95,  radius: 2.4, orbitalPeriod: 0.00384, color: 0xaaaaaa, type: 'moon' },
      { name: 'Ariel',   orbitRadius: 120, radius: 4.2, orbitalPeriod: 0.00586, color: 0xbbbbbb, type: 'moon' },
      { name: 'Umbriel', orbitRadius: 155, radius: 4.0, orbitalPeriod: 0.00840, color: 0x777777, type: 'moon' },
      { name: 'Titania', orbitRadius: 225, radius: 5.5, orbitalPeriod: 0.01518, color: 0x999988, type: 'moon' },
      { name: 'Oberon',  orbitRadius: 285, radius: 5.3, orbitalPeriod: 0.02337, color: 0x887766, type: 'moon' }
    ]
  },
  {
    name: 'Neptune', radius: 55,  orbitRadius: 5998, orbitalPeriod: 164.8,
    type: 'neptune', color: 0x3355ff,
    moons: [
      { name: 'Triton', orbitRadius: 150, radius: 6.3, orbitalPeriod: 0.01621, color: 0xaabbcc, type: 'moon' }
    ]
  }
];

const SUN_RADIUS = 110;
const G = 600; // Gravitational constant (tuned for fun, not real physics)

// ============================================================
// SECTION 3: GLOBAL STATE
// Variables that the whole program needs to remember
// ============================================================

// Three.js core objects
let scene, camera, renderer, composer;

// All planets, moons, and sun are stored here
const celestialBodies = [];
// Animated shader materials that need a "time" uniform updated each frame
const animatedMaterials = [];

// Player movement state
let yaw = 0, pitch = 0;          // camera rotation angles
let velocity = new THREE.Vector3();
let flySpeed = 150;               // units per second (changed by mouse wheel)
let currentMode = 1;              // 1 = free, 2 = gravity
const keys = {};                  // which keys are currently held down

// Pointer lock state
let pointerLocked = false;

// Fly-to animation state (for search)
let flyToTarget = null;
let flyToStart = new THREE.Vector3();
let flyToEnd = new THREE.Vector3();
let flyToProgress = 1.0; // 1.0 = not animating

// Spaceship state
let shipGroup    = null;
let shipActive   = false;
let shipVelocity = new THREE.Vector3();

// Asteroid belt
let asteroidMesh = null;
const asteroidData = [];

// HUD update timer
let hudTimer = 0;
let frameCount = 0;

// Audio
let audioCtx = null;
let masterGain = null;
let musicOn = true;

// Recording
let mediaRecorder = null;
let recordedChunks = [];

// ============================================================
// SECTION 4: GLSL SHADER CODE
// These are mini-programs that run on the GPU (graphics card)
// to create the beautiful planet surfaces procedurally
// ============================================================

// Shared noise functions included in every planet shader
const NOISE_GLSL = `
  // Hash function: turns a 3D point into a pseudo-random number
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  // Smooth noise: interpolates between hash values
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i),             hash(i+vec3(1,0,0)), f.x),
          mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
          mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  // Fractal Brownian Motion: layers of noise for more detail
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p = p * 2.1 + vec3(1.7, 9.2, 3.4);
      a *= 0.5;
    }
    return v;
  }
`;

// Shared vertex shader — passes world-space position and normal to fragment
// (world-space data lets us do accurate atmosphere and night-side lighting)
const VERT = `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPos;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vNormal      = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vPos         = position;
    vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv          = uv;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Shared fragment-shader header: declares ALL varyings + atmosphere helper.
// Include this (along with NOISE_GLSL) at the top of every planet fragment shader.
const ATM_GLSL = `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPos;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  // Fresnel atmospheric rim glow — call at the END of every planet fragment
  // atmColor e.g. vec3(0.3,0.6,1.0) for Earth blue, vec3(1.0,0.5,0.1) for Mars dust
  vec3 addAtmosphere(vec3 col, vec3 atmColor, float power, float strength) {
    vec3  eyeDir = normalize(cameraPosition - vWorldPos);
    float rim    = 1.0 - max(0.0, dot(vWorldNormal, eyeDir));
    return col + atmColor * pow(rim, power) * strength;
  }
`;

// Helper: world-space sun direction from any point (sun is at origin)
// sunDot > 0 = day side, < 0 = night side
// Used in fragment shaders via: vec3 sunDir = normalize(-vWorldPos);

// --- SUN SHADER ---
function createSunMaterial() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      uniform float time;
      varying vec3 vPos;
      void main() {
        vec3 p = normalize(vPos);
        // Solar granulation (convection cells) at multiple scales
        float gran  = fbm(p * 4.0  + time * 0.05);
        float gran2 = fbm(p * 9.0  - time * 0.04);
        float flare = fbm(p * 16.0 + time * 0.09) * 0.4;
        float v = gran * 0.5 + gran2 * 0.3 + flare * 0.2;
        // Palette: sunspot core → orange → yellow → white peak
        vec3 spot   = vec3(0.60, 0.10, 0.01);
        vec3 orange = vec3(0.98, 0.28, 0.01);
        vec3 yellow = vec3(1.00, 0.76, 0.08);
        vec3 white  = vec3(1.00, 0.96, 0.72);
        vec3 col = mix(spot,   orange, smoothstep(0.18, 0.40, v));
        col       = mix(col,   yellow, smoothstep(0.40, 0.65, v));
        col       = mix(col,   white,  smoothstep(0.65, 0.88, v));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.FrontSide
  });
  animatedMaterials.push(mat);
  return mat;
}

// --- EARTH SHADER — city lights on night side, specular ocean, blue atmosphere ---
function createEarthMaterial() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      uniform float time;
      void main() {
        vec3 p = normalize(vPos);
        // === SURFACE ===
        float land = fbm(p * 3.0 + vec3(5.1));
        float elev = fbm(p * 5.5 + vec3(99.0));
        vec3 deepOcean = vec3(0.04, 0.14, 0.48);
        vec3 ocean     = mix(deepOcean, vec3(0.08, 0.28, 0.68), fbm(p * 7.0));
        vec3 green     = vec3(0.12, 0.40, 0.10);
        vec3 brown     = vec3(0.42, 0.30, 0.16);
        vec3 desert    = vec3(0.72, 0.60, 0.32);
        vec3 landCol   = mix(green, brown,  smoothstep(0.44, 0.58, elev));
        landCol        = mix(landCol, desert, smoothstep(0.6, 0.72, elev));
        float landMask = smoothstep(0.47, 0.53, land);
        vec3 surface   = mix(ocean, landCol, landMask);
        // Ice caps
        surface = mix(surface, vec3(0.92, 0.96, 1.0), smoothstep(0.72, 0.90, abs(p.y)));
        // Animated clouds
        float cloud = fbm(p * 4.5 + vec3(time * 0.014, 0.0, 0.0));
        float cloud2= fbm(p * 8.0 - vec3(time * 0.009, 0.0, 0.0));
        float cloudMask = smoothstep(0.50, 0.64, cloud * 0.7 + cloud2 * 0.3);
        surface = mix(surface, vec3(0.96, 0.97, 1.0), cloudMask * 0.88);
        // === WORLD-SPACE LIGHTING ===
        vec3 sunDir = normalize(-vWorldPos); // sun at origin
        float sunDot = dot(vWorldNormal, sunDir);
        float dayLight = max(0.0, sunDot) * 0.85 + 0.15;
        surface *= dayLight;
        // === SPECULAR OCEAN SHINE ===
        float oceanMask = (1.0 - landMask) * (1.0 - cloudMask);
        vec3 eyeDir  = normalize(cameraPosition - vWorldPos);
        vec3 halfDir = normalize(sunDir + eyeDir);
        float spec = pow(max(0.0, dot(vWorldNormal, halfDir)), 55.0);
        surface += vec3(0.55, 0.72, 1.0) * spec * oceanMask * max(0.0, sunDot) * 0.65;
        // === NIGHT-SIDE CITY LIGHTS ===
        float cityNoise = pow(max(0.0, fbm(p * 32.0 + vec3(333.3)) - 0.60) / 0.40, 2.8) * 2.5;
        float nightMask = smoothstep(0.08, -0.12, sunDot);
        surface += vec3(1.0, 0.62, 0.15) * cityNoise * nightMask * landMask * (1.0 - cloudMask);
        // === ATMOSPHERE RIM (blue glow on the limb) ===
        vec3 col = addAtmosphere(surface, vec3(0.22, 0.50, 1.0), 3.8, 0.85);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  animatedMaterials.push(mat);
  return mat;
}

// --- EUROPA SHADER — NASA-accurate cracked ice surface ---
function createEuropaMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      void main() {
        vec3 p = normalize(vPos);
        // === ICE BASE ===
        float iceVar = fbm(p * 9.0 + vec3(10.2, 20.4, 30.6));
        vec3 pureIce = vec3(0.91, 0.95, 1.00);   // white ice
        vec3 blueIce = vec3(0.70, 0.84, 0.95);   // blue-tinted ice depths
        vec3 greyIce = vec3(0.77, 0.80, 0.83);   // grey patches
        vec3 iceCol  = mix(pureIce, blueIce, smoothstep(0.32, 0.62, iceVar));
        iceCol       = mix(iceCol,  greyIce, fbm(p * 18.0) * 0.25);
        // === LINEAE — the famous rust-brown crack network ===
        // Macro ridges (wide, long continent-spanning bands)
        float mac1 = abs(fbm(p * 3.2 + vec3(100.0)) - 0.5);
        float mac2 = abs(fbm(p * 3.2 + vec3(200.0, 0.0, 100.0)) - 0.5);
        float macCrack = min(mac1, mac2);
        // Meso cracks (mid-scale network)
        float mid1 = abs(fbm(p * 6.5 + vec3(300.0)) - 0.5);
        float mid2 = abs(fbm(p * 6.5 + vec3(0.0, 400.0, 200.0)) - 0.5);
        float midCrack = min(mid1, mid2);
        // Fine micro-fractures
        float micro = abs(fbm(p * 13.0 + vec3(500.0)) - 0.5);
        // Crack colors: dark rusty brown core, lighter ridge flanks
        vec3 crackCore  = vec3(0.48, 0.20, 0.08);
        vec3 crackFlank = vec3(0.65, 0.42, 0.22);
        // Apply macro cracks
        float macMask  = 1.0 - smoothstep(0.00, 0.07, macCrack);
        float macFlank = 1.0 - smoothstep(0.07, 0.17, macCrack);
        vec3 col = mix(iceCol, crackCore,  macMask  * 0.90);
        col      = mix(col,    crackFlank, macFlank * (1.0 - macMask) * 0.35);
        // Mid cracks (thinner)
        float midMask = 1.0 - smoothstep(0.00, 0.04, midCrack);
        col = mix(col, crackCore * 0.85, midMask * 0.55);
        // Micro fractures (very faint hairlines)
        float micMask = 1.0 - smoothstep(0.00, 0.025, micro);
        col = mix(col, crackCore * 0.7, micMask * 0.30);
        // === CHAOTIC TERRAIN (Conamara Chaos etc.) ===
        float chaos = fbm(p * 5.5 + vec3(600.0, 350.0, 120.0));
        float chaosMask = smoothstep(0.64, 0.73, chaos);
        vec3 chaosCol   = mix(vec3(0.62, 0.52, 0.42), vec3(0.80, 0.76, 0.70), fbm(p * 22.0));
        col = mix(col, chaosCol, chaosMask * 0.50);
        // === SHALLOW IMPACT CRATERS (few — ice heals itself) ===
        float crat = fbm(p * 20.0 + vec3(800.0));
        col = mix(col, vec3(0.96, 0.98, 1.0), smoothstep(0.72, 0.78, crat) * 0.38);
        // === LIGHTING ===
        vec3 sunDir = normalize(-vWorldPos);
        float diff  = max(0.0, dot(vWorldNormal, sunDir)) * 0.80 + 0.20;
        col *= diff;
        // Specular: icy surface is slightly reflective
        vec3 eyeDir  = normalize(cameraPosition - vWorldPos);
        vec3 halfDir = normalize(sunDir + eyeDir);
        float spec = pow(max(0.0, dot(vWorldNormal, halfDir)), 70.0) * 0.45;
        col += vec3(0.7, 0.85, 1.0) * spec * max(0.0, dot(vWorldNormal, sunDir));
        // Very faint oxygen atmosphere rim
        col = addAtmosphere(col, vec3(0.50, 0.78, 1.0), 5.5, 0.28);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

// --- MARS SHADER ---
function createMarsMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      void main() {
        vec3 p = normalize(vPos);
        float n       = fbm(p * 4.5);
        float craters = fbm(p * 9.0);
        float micro   = fbm(p * 18.0);
        vec3 rust   = vec3(0.74, 0.25, 0.06);
        vec3 ochre  = vec3(0.85, 0.46, 0.16);
        vec3 dark   = vec3(0.34, 0.12, 0.04);
        vec3 col = mix(rust, ochre, smoothstep(0.38, 0.68, n));
        col = mix(col, dark, smoothstep(0.66, 0.80, craters) * 0.55);
        col *= (0.85 + micro * 0.22);
        col = mix(col, vec3(0.90, 0.93, 0.97), smoothstep(0.80, 0.95, abs(p.y)));
        // World-space lighting
        vec3 sunDir = normalize(-vWorldPos);
        float light = max(0.0, dot(vWorldNormal, sunDir)) * 0.82 + 0.18;
        col *= light;
        // Thin reddish-orange atmosphere
        col = addAtmosphere(col, vec3(0.88, 0.42, 0.12), 4.5, 0.55);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

// --- JUPITER SHADER ---
function createJupiterMaterial() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      uniform float time;
      void main() {
        vec3 p = normalize(vPos);
        float band  = fbm(vec3(p.x*0.3, p.y*9.5, p.z*0.3) + vec3(time*0.007));
        float turb  = fbm(vec3(p.x*2.2, p.y*4.0, time*0.005));
        float detail= fbm(p*12.0 + time*0.015) * 0.18;
        float v = band*0.62 + turb*0.28 + detail;
        vec3 cream  = vec3(0.92, 0.85, 0.65);
        vec3 orange = vec3(0.78, 0.48, 0.17);
        vec3 brown  = vec3(0.52, 0.28, 0.09);
        vec3 tan    = vec3(0.85, 0.64, 0.34);
        vec3 col = mix(cream,  orange, smoothstep(0.28, 0.48, v));
        col       = mix(col,   brown,  smoothstep(0.48, 0.68, v));
        col       = mix(col,   tan,    smoothstep(0.68, 0.88, v));
        // Great Red Spot
        float grs = fbm(p * 8.5 + vec3(2.5, -0.28, 0.9));
        float grsSwirl = fbm(p * 14.0 + vec3(2.4, -0.3, time*0.012));
        col = mix(col, vec3(0.68, 0.18, 0.08), smoothstep(0.63, 0.71, grs) * 0.75);
        col = mix(col, vec3(0.80, 0.35, 0.15), smoothstep(0.67, 0.72, grsSwirl) * 0.40);
        // Subtle brown atmosphere glow
        col = addAtmosphere(col, vec3(0.65, 0.38, 0.12), 3.5, 0.50);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  animatedMaterials.push(mat);
  return mat;
}

// --- SATURN SHADER ---
function createSaturnMaterial() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      uniform float time;
      void main() {
        vec3 p = normalize(vPos);
        float band   = fbm(vec3(p.x*0.25, p.y*12.0, p.z*0.25) + vec3(time*0.003));
        float detail = fbm(p*8.0 + time*0.008) * 0.15;
        float v = band + detail;
        vec3 gold  = vec3(0.88, 0.80, 0.52);
        vec3 cream = vec3(0.96, 0.90, 0.70);
        vec3 tan   = vec3(0.76, 0.63, 0.36);
        vec3 pale  = vec3(0.93, 0.88, 0.66);
        vec3 col = mix(cream, gold, smoothstep(0.33, 0.55, v));
        col       = mix(col,  tan,  smoothstep(0.55, 0.78, v));
        col       = mix(col,  pale, smoothstep(0.78, 0.92, v));
        col = addAtmosphere(col, vec3(0.82, 0.68, 0.28), 3.2, 0.42);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  animatedMaterials.push(mat);
  return mat;
}

// --- VENUS SHADER ---
function createVenusMaterial() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      uniform float time;
      void main() {
        vec3 p = normalize(vPos);
        float cloud  = fbm(p*3.5 + vec3(time*0.011, 0.0, time*0.007));
        float cloud2 = fbm(p*7.0 - vec3(0.0, time*0.008, 0.0));
        float v = cloud*0.58 + cloud2*0.42;
        vec3 tan  = vec3(0.90, 0.78, 0.52);
        vec3 gold = vec3(0.82, 0.58, 0.22);
        vec3 haze = vec3(0.95, 0.86, 0.62);
        vec3 col = mix(tan, gold, smoothstep(0.38, 0.68, v));
        col       = mix(col, haze, smoothstep(0.68, 0.88, v));
        // Very thick sulfuric acid atmosphere — strong yellow-orange glow
        col = addAtmosphere(col, vec3(0.92, 0.68, 0.18), 2.8, 1.10);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  animatedMaterials.push(mat);
  return mat;
}

// --- URANUS SHADER ---
function createUranusMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      void main() {
        vec3 p = normalize(vPos);
        float band = fbm(vec3(p.x*0.18, p.y*8.0, p.z*0.18));
        vec3 teal = vec3(0.47, 0.90, 0.90);
        vec3 cyan = vec3(0.35, 0.76, 0.84);
        vec3 col  = mix(teal, cyan, smoothstep(0.38, 0.68, band));
        col = addAtmosphere(col, vec3(0.30, 0.88, 0.95), 3.5, 0.60);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

// --- NEPTUNE SHADER ---
function createNeptuneMaterial() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      uniform float time;
      void main() {
        vec3 p = normalize(vPos);
        float band  = fbm(vec3(p.x*0.38, p.y*6.5, p.z*0.38) + vec3(time*0.009));
        float storm = fbm(p*5.5 + vec3(1.5, 0.4, time*0.006));
        float detail= fbm(p*11.0 - time*0.012) * 0.15;
        float v = band*0.70 + detail;
        vec3 deep  = vec3(0.07, 0.12, 0.72);
        vec3 mid   = vec3(0.16, 0.28, 0.86);
        vec3 light = vec3(0.32, 0.48, 0.94);
        vec3 col = mix(deep, mid,   smoothstep(0.28, 0.58, v));
        col       = mix(col, light, smoothstep(0.58, 0.78, v));
        // Great Dark Spot
        col = mix(col, vec3(0.03, 0.06, 0.38), smoothstep(0.66, 0.73, storm) * 0.82);
        col = addAtmosphere(col, vec3(0.18, 0.38, 1.0), 3.2, 0.75);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  animatedMaterials.push(mat);
  return mat;
}

// --- MERCURY SHADER ---
function createMercuryMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      void main() {
        vec3 p = normalize(vPos);
        float base    = fbm(p * 5.5);
        float craters = fbm(p * 11.0);
        float micro   = fbm(p * 22.0);
        vec3 grey1 = vec3(0.52, 0.48, 0.44);
        vec3 grey2 = vec3(0.30, 0.27, 0.24);
        vec3 col = mix(grey1, grey2, smoothstep(0.38, 0.62, base));
        col = mix(col, grey2 * 0.65, smoothstep(0.62, 0.72, craters) * 0.48);
        col *= (0.84 + micro * 0.28);
        // Sharp day/night terminator (no atmosphere to diffuse light)
        vec3 sunDir = normalize(-vWorldPos);
        float light = max(0.0, dot(vWorldNormal, sunDir));
        float term  = smoothstep(0.0, 0.04, light); // very sharp terminator
        col *= light * 0.88 * term + 0.05; // very dark on night side
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

// --- MOON / ROCKY MOON SHADER ---
function createMoonMaterial(_type, color) {
  const r = ((color >> 16) & 0xff) / 255;
  const g = ((color >> 8)  & 0xff) / 255;
  const b = ( color        & 0xff) / 255;
  return new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(r, g, b) } },
    vertexShader: VERT,
    fragmentShader: `
      ${NOISE_GLSL}
      ${ATM_GLSL}
      uniform vec3 tint;
      void main() {
        vec3 p = normalize(vPos);
        float n       = fbm(p * 4.5);
        float craters = fbm(p * 10.0);
        float micro   = fbm(p * 20.0);
        vec3 base = mix(vec3(0.48), tint, 0.62);
        vec3 dark = base * 0.50;
        vec3 col  = mix(base, dark, smoothstep(0.54, 0.70, craters));
        col *= (0.80 + n*0.38 + micro*0.12);
        vec3 sunDir = normalize(-vWorldPos);
        float light = max(0.0, dot(vWorldNormal, sunDir)) * 0.78 + 0.22;
        col *= light;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

// --- SATURN RINGS SHADER ---
function createRingMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      ${NOISE_GLSL}
      varying vec2 vUv;
      void main() {
        float r = vUv.x;
        float density  = fbm(vec3(r * 13.0, 0.5, 0.5));
        density       += fbm(vec3(r * 32.0, 1.5, 0.5)) * 0.38;
        // Cassini Division (~r 0.53)
        float cassini  = smoothstep(0.50, 0.53, r) * (1.0 - smoothstep(0.53, 0.57, r));
        float alpha    = smoothstep(0.28, 0.52, density) * (1.0 - cassini * 0.92);
        alpha         *= smoothstep(0.0, 0.04, r) * smoothstep(1.0, 0.96, r);
        vec3 cream = vec3(0.90, 0.83, 0.66);
        vec3 rust  = vec3(0.70, 0.53, 0.33);
        vec3 col   = mix(cream, rust, smoothstep(0.28, 0.80, density));
        gl_FragColor = vec4(col, alpha * 0.72);
      }
    `,
    side: THREE.DoubleSide, transparent: true, depthWrite: false
  });
}

// Helper: pick the right shader for a planet type
function createPlanetMaterial(type, color) {
  switch (type) {
    case 'earth':   return createEarthMaterial();
    case 'europa':  return createEuropaMaterial();
    case 'mars':    return createMarsMaterial();
    case 'jupiter': return createJupiterMaterial();
    case 'saturn':  return createSaturnMaterial();
    case 'venus':   return createVenusMaterial();
    case 'uranus':  return createUranusMaterial();
    case 'neptune': return createNeptuneMaterial();
    case 'mercury': return createMercuryMaterial();
    default:        return createMoonMaterial(type, color);
  }
}

// ============================================================
// SECTION 5: SCENE SETUP
// Create the Three.js renderer, scene, camera, and starfield
// ============================================================
function setupScene() {
  const canvas = document.getElementById('solarCanvas');

  // Renderer — this is what draws everything on screen
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 0.85;

  // Scene — like a stage where we place all 3D objects
  scene = new THREE.Scene();

  // Camera — like the player's eyes, 75 degree field of view
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 120000);
  camera.position.set(0, 80, 350); // Start near Earth's orbit

  // Post-processing: bloom glow on bright objects (sun, engines)
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.65, // strength — kept low so planets don't over-glow
    0.55, // radius
    0.60  // threshold — only very bright things (sun, engine glow) bloom
  );
  composer.addPass(bloomPass);

  // Blue-toned cinematic color grade + subtle vignette
  const colorGrade = new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        // Slightly cool the image (more blue, less red)
        c.r *= 0.88; c.g *= 0.93; c.b = min(1.0, c.b * 1.05);
        // Gamma-style brightness reduction
        c.rgb = pow(c.rgb, vec3(1.12));
        // Vignette: darken screen edges
        vec2 uv2 = vUv - 0.5;
        c.rgb *= 1.0 - dot(uv2, uv2) * 1.6;
        gl_FragColor = c;
      }
    `
  });
  composer.addPass(colorGrade);

  // Very dim blue ambient light — space is almost completely dark
  scene.add(new THREE.AmbientLight(0x0a1428, 0.35));

  // Sun's point light illuminates the planets
  const sunLight = new THREE.PointLight(0xffe8cc, 1.8, 0, 1.4);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Starfield: 12,000 random points in a giant sphere
  buildStarfield();

  // Handle window resizing
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
}

function buildStarfield() {
  const count = 12000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Random point on a sphere of radius 60000
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 40000 + Math.random() * 20000;
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    // Slight color variation: some stars are bluish, some yellowish
    const warm = Math.random();
    colors[i*3]   = 0.8 + warm * 0.2;
    colors[i*3+1] = 0.8 + warm * 0.1;
    colors[i*3+2] = 0.8 + (1 - warm) * 0.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.5, vertexColors: true,
    sizeAttenuation: false, // stars stay same size regardless of distance
    transparent: true, opacity: 0.9
  });
  scene.add(new THREE.Points(geo, mat));
}

// ============================================================
// SECTION 6: SOLAR SYSTEM BUILDER
// Creates all the planets, moons, and their orbit lines
// ============================================================
function buildSolarSystem() {
  // --- SUN ---
  const sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);
  const sunMat = createSunMaterial();
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.userData = { name: 'Sun', isSun: true, radius: SUN_RADIUS, mass: 1e10 };
  scene.add(sun);
  celestialBodies.push(sun);
  buildSunCorona(); // glowing corona around the sun

  // --- PLANETS ---
  for (const pd of PLANET_DATA) {
    // Planet mesh
    const geo = new THREE.SphereGeometry(pd.radius, 64, 64);
    const mat = createPlanetMaterial(pd.type, pd.color);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      name: pd.name,
      orbitRadius: pd.orbitRadius,
      orbitalPeriod: pd.orbitalPeriod,
      angle: Math.random() * Math.PI * 2,
      radius: pd.radius,
      mass: Math.pow(pd.radius, 3) * 1200,
      moons: [],
      isPlanet: true
    };
    scene.add(mesh);
    celestialBodies.push(mesh);

    // Saturn's rings (flat disc geometry)
    if (pd.hasRings) {
      const ringInner = pd.radius * 1.3;
      const ringOuter = pd.radius * 2.4;
      const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 128);
      fixRingUVs(ringGeo, ringInner, ringOuter);
      const ringMat = createRingMaterial();
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.2; // slight tilt
      // Ring is a CHILD of Saturn so it moves with the planet
      mesh.add(ring);
    }

    // --- MOONS ---
    for (const md of pd.moons) {
      const mGeo = new THREE.SphereGeometry(md.radius, 32, 32);
      const mMat = createMoonMaterial(md.type, md.color);
      const moon = new THREE.Mesh(mGeo, mMat);
      moon.userData = {
        name: md.name,
        orbitRadius: md.orbitRadius,
        orbitalPeriod: md.orbitalPeriod,
        angle: Math.random() * Math.PI * 2,
        radius: md.radius,
        mass: Math.pow(md.radius, 3) * 800,
        parentBody: mesh, // reference to the planet this moon orbits
        isMoon: true
      };
      scene.add(moon);
      celestialBodies.push(moon);
      mesh.userData.moons.push(moon);
    }
  }
}

// Fix Saturn's ring UV coordinates so the shader knows the radial position
function fixRingUVs(geometry, innerRadius, outerRadius) {
  const pos = geometry.attributes.position;
  const uv  = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    uv.setXY(i, (r - innerRadius) / (outerRadius - innerRadius), 0);
  }
  uv.needsUpdate = true;
}

// ============================================================
// SUN CORONA — glowing halo of light around the sun
// Two transparent shells: a wide outer glow + spiky inner corona
// ============================================================
function buildSunCorona() {
  // --- Inner spiky corona (close to surface, dim streamers) ---
  const innerGeo = new THREE.SphereGeometry(SUN_RADIUS * 1.7, 64, 64);
  const innerMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      ${NOISE_GLSL}
      uniform float time;
      varying vec3 vPos;
      void main() {
        vec3 p = normalize(vPos);
        // High-frequency noise creates bright filaments and streamers
        float streamer = fbm(p * 5.0 + time * 0.07);
        float burst    = fbm(p * 9.0 - time * 0.05) * 0.6;
        float v = streamer * 0.65 + burst * 0.35;
        // Solar flare colors: hot white → orange
        vec3 col = mix(vec3(1.0, 0.55, 0.05), vec3(1.0, 0.95, 0.6), v);
        float alpha = pow(v, 2.2) * 0.28;
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  scene.add(new THREE.Mesh(innerGeo, innerMat));
  animatedMaterials.push(innerMat);
}

// ============================================================
// SECTION 7: ASTEROID BELT
// 500 rocky objects between Mars and Jupiter
// ============================================================
function buildAsteroidBelt() {
  const count = 500;
  // DodecahedronGeometry gives a rough, rocky look
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.95, metalness: 0.05 });
  asteroidMesh = new THREE.InstancedMesh(geo, mat, count);
  asteroidMesh.castShadow = false;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    // Belt sits between Mars (304) and Jupiter (1040): place at 490–820 range
    const r     = 490 + Math.random() * 330;
    const angle = Math.random() * Math.PI * 2;
    const y     = (Math.random() - 0.5) * 22;
    const scale = 0.4 + Math.random() * 2.8;
    const speed = (0.25 + Math.random() * 0.15) * (Math.random() < 0.5 ? 1 : -1);
    asteroidData.push({ r, angle, y, scale, speed, rotX: Math.random() * Math.PI, rotZ: Math.random() * Math.PI });

    dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    dummy.scale.setScalar(scale);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.updateMatrix();
    asteroidMesh.setMatrixAt(i, dummy.matrix);
  }
  asteroidMesh.instanceMatrix.needsUpdate = true;
  scene.add(asteroidMesh);
}

function updateAsteroids(delta) {
  if (!asteroidMesh) return;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < asteroidData.length; i++) {
    const a = asteroidData[i];
    a.angle += delta * a.speed * 0.012;
    dummy.position.set(Math.cos(a.angle) * a.r, a.y, Math.sin(a.angle) * a.r);
    dummy.scale.setScalar(a.scale);
    dummy.rotation.set(a.rotX + delta * 0.3, a.angle * 2, a.rotZ);
    dummy.updateMatrix();
    asteroidMesh.setMatrixAt(i, dummy.matrix);
  }
  asteroidMesh.instanceMatrix.needsUpdate = true;
}

// ============================================================
// SECTION 8: SPACESHIP
// A futuristic ship built from Three.js geometry primitives
// ============================================================
function buildSpaceship() {
  shipGroup = new THREE.Group();

  // Hull — the main body (pointy cone facing forward)
  const hullGeo = new THREE.ConeGeometry(2.5, 14, 8);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8, roughness: 0.3 });
  const hull = new THREE.Mesh(hullGeo, metalMat);
  hull.rotation.z = -Math.PI / 2; // point the cone forward (along -Z)
  hull.position.set(-3, 0, 0);
  shipGroup.add(hull);

  // Body cylinder
  const bodyGeo = new THREE.CylinderGeometry(2, 2.5, 10, 8);
  const body = new THREE.Mesh(bodyGeo, metalMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(3, 0, 0);
  shipGroup.add(body);

  // Wings (left and right)
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.7, roughness: 0.4 });
  for (const side of [-1, 1]) {
    const wingGeo = new THREE.BoxGeometry(8, 0.4, 5);
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(2, 0, side * 6);
    wing.rotation.y = side * 0.15; // slight sweep angle
    shipGroup.add(wing);

    // Engine nacelle at the end of each wing
    const nacGeo = new THREE.CylinderGeometry(0.9, 1.1, 4, 8);
    const nacMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.9, roughness: 0.2 });
    const nac = new THREE.Mesh(nacGeo, nacMat);
    nac.rotation.z = Math.PI / 2;
    nac.position.set(2, -0.5, side * 9);
    shipGroup.add(nac);

    // Engine glow sphere (emissive = triggers bloom effect)
    const glowGeo = new THREE.SphereGeometry(1.1, 16, 16);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      emissive: new THREE.Color(0x2255ff),
      emissiveIntensity: 3.0,
      transparent: true,
      opacity: 0.9
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(5.5, -0.5, side * 9);
    shipGroup.add(glow);

    // Point light from each engine
    const engineLight = new THREE.PointLight(0x4488ff, 2.0, 40);
    engineLight.position.set(5.5, -0.5, side * 9);
    shipGroup.add(engineLight);
  }

  // Cockpit bubble (tinted blue glass)
  const cockpitGeo = new THREE.SphereGeometry(1.6, 16, 16);
  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff, metalness: 0.1, roughness: 0,
    transparent: true, opacity: 0.6
  });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(-4, 1.5, 0);
  shipGroup.add(cockpit);

  // Position ship in front of the camera
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  shipGroup.position.copy(camera.position).addScaledVector(forward, 60);
  shipGroup.quaternion.copy(camera.quaternion);

  scene.add(shipGroup);
}

function updateShipControls(delta) {
  if (!shipGroup) return;

  // Ship's forward direction
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(shipGroup.quaternion);
  const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(shipGroup.quaternion);
  const up      = new THREE.Vector3(0, 1, 0);

  const accel = new THREE.Vector3();
  if (keys['KeyW'])     accel.addScaledVector(forward,  flySpeed * 0.8);
  if (keys['KeyS'])     accel.addScaledVector(forward, -flySpeed * 0.8);
  if (keys['KeyA'])     accel.addScaledVector(right,   -flySpeed * 0.5);
  if (keys['KeyD'])     accel.addScaledVector(right,    flySpeed * 0.5);
  if (keys['Space'])    accel.addScaledVector(up,       flySpeed * 0.5);
  if (keys['ShiftLeft'])accel.addScaledVector(up,      -flySpeed * 0.5);

  shipVelocity.addScaledVector(accel, delta);
  // Ships have drag too (friction in free mode)
  shipVelocity.multiplyScalar(Math.pow(0.82, delta * 10));
  shipGroup.position.addScaledVector(shipVelocity, delta);

  // Rotate ship with mouse look
  const qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yaw);
  const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), pitch);
  shipGroup.quaternion.multiplyQuaternions(qYaw, qPitch);

  // Camera follows ship from behind and above
  const back   = new THREE.Vector3(0, 0, 1).applyQuaternion(shipGroup.quaternion);
  const shipUp = new THREE.Vector3(0, 1, 0).applyQuaternion(shipGroup.quaternion);
  camera.position.copy(shipGroup.position)
    .addScaledVector(back, 35)
    .addScaledVector(shipUp, 12);
  camera.lookAt(shipGroup.position);
}

// ============================================================
// SECTION 9: PHYSICS & CONTROLS
// Pointer lock, keyboard/mouse input, two movement modes
// ============================================================
function setupControls() {
  const canvas  = document.getElementById('solarCanvas');
  const blocker = document.getElementById('blocker');

  // Click the blocker to start (pointer lock requires user interaction)
  blocker.addEventListener('click', () => {
    canvas.requestPointerLock();
    // Start audio on first click (browser requires user gesture)
    if (!audioCtx) startMusic();
  });

  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
    if (pointerLocked) {
      blocker.style.display = 'none';
      // Fade out controls hint after 6 seconds
      setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) hint.style.opacity = '0';
      }, 6000);
    } else {
      // Only show blocker if search isn't open
      const search = document.getElementById('searchPanel');
      if (search.style.display === 'none') blocker.style.display = 'flex';
    }
  });

  // Mouse movement = look around
  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked || shipActive) return;
    yaw   -= e.movementX * 0.0022;
    pitch -= e.movementY * 0.0022;
    pitch  = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
  });

  // Mouse look for ship mode too
  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked || !shipActive) return;
    yaw   -= e.movementX * 0.0018;
    pitch -= e.movementY * 0.0018;
    pitch  = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
  });

  // Mouse wheel changes fly speed
  window.addEventListener('wheel', (e) => {
    flySpeed *= e.deltaY > 0 ? 0.88 : 1.14;
    flySpeed  = Math.max(5, Math.min(8000, flySpeed));
  });

  // Track which keys are pressed
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Digit1') setMode(1);
    if (e.code === 'Digit2') setMode(2);
    if (e.code === 'KeyF')   toggleShip();
    if (e.code === 'KeyM')   toggleMusic();
    if (e.code === 'Slash')  toggleSearch();
    if (e.code === 'Escape') closeSearch();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
}

function setMode(m) {
  currentMode = m;
  // Reset velocity when switching to avoid sudden lurching
  if (m === 1) velocity.multiplyScalar(0.1);
}

// Mode 1: Free flight — WASD accelerates, velocity has friction so you coast to a stop
function updateFreeMode(delta) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up      = new THREE.Vector3(0, 1, 0);

  const accel = new THREE.Vector3();
  if (keys['KeyW'])     accel.addScaledVector(forward,  flySpeed);
  if (keys['KeyS'])     accel.addScaledVector(forward, -flySpeed);
  if (keys['KeyA'])     accel.addScaledVector(right,   -flySpeed);
  if (keys['KeyD'])     accel.addScaledVector(right,    flySpeed);
  if (keys['Space'])    accel.addScaledVector(up,       flySpeed * 0.6);
  if (keys['ShiftLeft'])accel.addScaledVector(up,      -flySpeed * 0.6);

  velocity.addScaledVector(accel, delta);
  // Frame-rate independent friction: velocity decays toward zero when no keys held
  velocity.multiplyScalar(Math.pow(0.80, delta * 10));
  camera.position.addScaledVector(velocity, delta);
}

// Mode 2: Gravity — planets pull you toward them, WASD = thrusters, no friction
function updateGravityMode(delta) {
  // Gravitational pull from every body
  for (const body of celestialBodies) {
    const diff = new THREE.Vector3().subVectors(body.position, camera.position);
    const dist = diff.length();
    if (dist < body.userData.radius + 2) continue; // don't get sucked inside
    const forceMag = (G * body.userData.mass) / (dist * dist);
    velocity.addScaledVector(diff.normalize(), forceMag * delta);
  }

  // WASD still works as thrusters (half power)
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up      = new THREE.Vector3(0, 1, 0);
  if (keys['KeyW'])     velocity.addScaledVector(forward,  flySpeed * delta * 0.4);
  if (keys['KeyS'])     velocity.addScaledVector(forward, -flySpeed * delta * 0.4);
  if (keys['KeyA'])     velocity.addScaledVector(right,   -flySpeed * delta * 0.4);
  if (keys['KeyD'])     velocity.addScaledVector(right,    flySpeed * delta * 0.4);
  if (keys['Space'])    velocity.addScaledVector(up,       flySpeed * delta * 0.3);
  if (keys['ShiftLeft'])velocity.addScaledVector(up,      -flySpeed * delta * 0.3);

  // No friction in gravity mode — real space!
  camera.position.addScaledVector(velocity, delta);
}

// Build camera quaternion from yaw and pitch angles
function updateCameraOrientation() {
  const qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
  camera.quaternion.multiplyQuaternions(qYaw, qPitch);
}

// ============================================================
// SECTION 10: SEARCH & FLY-TO ANIMATION
// Open the search panel and fly the camera to any body
// ============================================================
function setupSearch() {
  const input = document.getElementById('searchInput');

  input.addEventListener('input', () => showSearchResults(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeSearch();
  });

  // Show all bodies on open
  showSearchResults('');
}

function toggleSearch() {
  const panel = document.getElementById('searchPanel');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    document.exitPointerLock();
    const input = document.getElementById('searchInput');
    input.value = '';
    showSearchResults('');
    setTimeout(() => input.focus(), 50);
  } else {
    closeSearch();
  }
}

function closeSearch() {
  const panel = document.getElementById('searchPanel');
  panel.style.display = 'none';
  const canvas = document.getElementById('solarCanvas');
  canvas.requestPointerLock();
}

function showSearchResults(query) {
  const results = document.getElementById('searchResults');
  const q = query.toLowerCase();
  const matches = celestialBodies
    .filter(b => b.userData.name.toLowerCase().includes(q))
    .slice(0, 12);

  results.innerHTML = matches.map(b =>
    `<div class="search-result" data-name="${b.userData.name}">${b.userData.name}</div>`
  ).join('');

  results.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => {
      flyToBody(el.dataset.name);
      closeSearch();
    });
  });
}

function flyToBody(name) {
  const body = celestialBodies.find(b => b.userData.name === name);
  if (!body) return;

  flyToStart.copy(camera.position);
  flyToTarget = body;
  flyToProgress = 0;
  velocity.set(0, 0, 0); // stop drifting when we start flying
  shipActive = false;     // exit ship mode during fly-to
}

function updateFlyTo(delta) {
  if (flyToProgress >= 1.0 || !flyToTarget) return;

  flyToProgress += delta * 0.45; // ~2.2 second travel
  flyToProgress = Math.min(flyToProgress, 1.0);

  // Cubic ease-in-out: slow at start and end, fast in middle
  const t = flyToProgress * flyToProgress * (3 - 2 * flyToProgress);

  // Update end position each frame because the planet is moving
  const offset = new THREE.Vector3(0, flyToTarget.userData.radius * 1.8, flyToTarget.userData.radius * 3.5);
  flyToEnd.copy(flyToTarget.position).add(offset);

  camera.position.lerpVectors(flyToStart, flyToEnd, t);

  // Point camera at target during fly-to
  camera.lookAt(flyToTarget.position);
  // Sync yaw/pitch so mouse-look continues from this angle after arrival
  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  yaw   = euler.y;
  pitch = euler.x;
}

// ============================================================
// SECTION 11: HUD
// Updates the on-screen info display
// ============================================================
function setupHUD() {
  // Nothing needed — DOM elements already exist in index.html
}

function updateHUD() {
  // Find nearest celestial body
  let nearest = null, nearDist = Infinity;
  for (const body of celestialBodies) {
    const d = camera.position.distanceTo(body.position);
    if (d < nearDist) { nearDist = d; nearest = body; }
  }

  const speedDisplay = velocity.length().toFixed(0);
  const modeNames    = { 1: 'FREE  ✦ no gravity', 2: 'GRAVITY  ✦ realistic' };

  document.getElementById('hud-speed').textContent   = `Speed : ${speedDisplay} u/s  (wheel to change)`;
  document.getElementById('hud-mode').textContent    = `Mode  : ${modeNames[currentMode]}`;
  document.getElementById('hud-nearest').textContent = `Near  : ${nearest ? nearest.userData.name : '–'}`;
  document.getElementById('hud-ship').textContent    = shipGroup
    ? (shipActive ? 'Ship  : PILOTING  (F to exit)' : 'Ship  : nearby  (F to board)')
    : 'Ship  : F to spawn';
}

// ============================================================
// SECTION 12: AUDIO — Procedural space music
// Uses Web Audio API to generate ambient space music
// No copyrighted songs needed!
// ============================================================
function startMusic() {
  const AudioCtx = window.AudioContext || window['webkitAudioContext'];
  audioCtx = new AudioCtx();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = musicOn ? 0.35 : 0;
  masterGain.connect(audioCtx.destination);

  // Build a reverb effect using a synthesized impulse response
  const reverb = audioCtx.createConvolver();
  reverb.buffer = buildImpulse(audioCtx, 4, 2.5);
  reverb.connect(masterGain);

  // Layer 1: Two detuned drone oscillators — creates a slow, pulsing beat
  for (const freq of [55, 55.6]) {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(reverb);
    osc.start();
  }

  // Layer 2: High sub-bass drone
  const sub = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  sub.type = 'sine';
  sub.frequency.value = 27.5; // A0 — very deep
  subGain.gain.value = 0.06;
  sub.connect(subGain);
  subGain.connect(masterGain);
  sub.start();

  // Layer 3: Random shimmer notes (pentatonic scale = always sounds good)
  const shimmerNotes = [440, 523, 659, 784, 880, 1047, 1319];
  function playShimmer() {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = shimmerNotes[Math.floor(Math.random() * shimmerNotes.length)];
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);
    osc.connect(gain);
    gain.connect(reverb);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 3.5);
    // Schedule next shimmer note at a random interval
    setTimeout(playShimmer, 1200 + Math.random() * 3500);
  }
  playShimmer();

  // Layer 4: Slow pad — a chord that slowly shifts
  const padNotes = [110, 138.6, 164.8]; // A2, C#3, E3 — a major chord
  for (const freq of padNotes) {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.025;
    osc.connect(gain);
    gain.connect(reverb);
    osc.start();
  }
}

// Build a reverb impulse response using white noise (makes sounds echo in space)
function buildImpulse(ctx, duration, decay) {
  const rate   = ctx.sampleRate;
  const len    = Math.floor(rate * duration);
  const buf    = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function toggleMusic() {
  if (!audioCtx) { startMusic(); return; }
  musicOn = !musicOn;
  masterGain.gain.setTargetAtTime(musicOn ? 0.35 : 0, audioCtx.currentTime, 0.3);
}

// ============================================================
// SECTION 13: VIDEO RECORDING
// Captures the canvas as a video file you can download
// ============================================================
function setupRecording() {
  const btn = document.getElementById('recordBtn');

  btn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Stop recording
      mediaRecorder.stop();
      btn.textContent = '⏺ REC';
      btn.classList.remove('recording');
    } else {
      // Start recording the canvas
      const stream = document.getElementById('solarCanvas').captureStream(30);
      recordedChunks = [];

      // Try VP9 first, fall back to VP8
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9' : 'video/webm';

      mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = 'space-engine-recording.webm';
        a.click();
        URL.revokeObjectURL(url);
      };
      mediaRecorder.start();
      btn.textContent = '⏹ STOP';
      btn.classList.add('recording');
    }
  });
}

// ============================================================
// SECTION 14: SPACESHIP TOGGLE
// ============================================================
function toggleShip() {
  if (!shipGroup) {
    buildSpaceship();
    shipActive = true;
  } else {
    shipActive = !shipActive;
  }
}

// ============================================================
// SECTION 15: ORBITAL UPDATES
// Move planets and moons along their orbits each frame
// ============================================================
function updateOrbits(elapsed) {
  for (const body of celestialBodies) {
    const ud = body.userData;
    if (ud.isSun) continue;

    if (ud.isMoon && ud.parentBody) {
      // Moon orbits its parent planet
      ud.angle = (elapsed / (ud.orbitalPeriod * 365.25 * 8)) * Math.PI * 2;
      const parent = ud.parentBody;
      body.position.set(
        parent.position.x + Math.cos(ud.angle) * ud.orbitRadius,
        parent.position.y,
        parent.position.z + Math.sin(ud.angle) * ud.orbitRadius
      );
    } else if (ud.isPlanet) {
      // Planet orbits the sun
      ud.angle = (elapsed / (ud.orbitalPeriod * 365.25 * 8)) * Math.PI * 2;
      body.position.set(
        Math.cos(ud.angle) * ud.orbitRadius,
        0,
        Math.sin(ud.angle) * ud.orbitRadius
      );
    }

  }
}

// Update time uniforms on animated shaders (makes sun/clouds animate)
function updateShaderTimes(elapsed) {
  for (const mat of animatedMaterials) {
    if (mat.uniforms && mat.uniforms.time) {
      mat.uniforms.time.value = elapsed;
    }
  }
}

// ============================================================
// SECTION 16: MAIN RENDER LOOP
// This runs ~60 times per second to animate everything
// ============================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta   = Math.min(clock.getDelta(), 0.05); // cap at 50ms so huge lags don't break physics
  const elapsed = clock.getElapsedTime();

  frameCount++;

  // 1. Move all planets and moons along their orbits
  updateOrbits(elapsed);

  // 2. Update asteroids (every 2nd frame for performance)
  if (frameCount % 2 === 0) updateAsteroids(delta);

  // 3. Animate shader surfaces (sun flames, Earth clouds, etc.)
  updateShaderTimes(elapsed);

  // 4. Movement — fly-to takes priority, then ship, then free/gravity
  if (flyToProgress < 1.0) {
    updateFlyTo(delta);
  } else if (shipActive && shipGroup) {
    updateShipControls(delta);
  } else if (currentMode === 1) {
    updateFreeMode(delta);
    updateCameraOrientation();
  } else {
    updateGravityMode(delta);
    updateCameraOrientation();
  }

  // 5. Update HUD every 0.1 seconds (10 Hz) to avoid DOM spam
  hudTimer += delta;
  if (hudTimer >= 0.1) {
    updateHUD();
    hudTimer = 0;
  }

  // 6. Render the scene with bloom post-processing
  composer.render();
}

// ============================================================
// SECTION 17: INIT — Kick everything off
// ============================================================
function init() {
  setupScene();       // renderer, camera, scene, stars
  buildSolarSystem(); // sun, planets, moons, rings
  buildAsteroidBelt(); // asteroid belt
  setupControls();    // keyboard, mouse, pointer lock
  setupSearch();      // search panel
  setupHUD();         // HUD references
  setupRecording();   // record button
  animate();          // start the render loop
}

// Wait for the page HTML to fully load before starting
document.addEventListener('DOMContentLoaded', init);
