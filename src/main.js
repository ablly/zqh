import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const phases = [
  { name: '宇宙', sub: '零点之前，时间像星尘一样漂浮。' },
  { name: '旋涡', sub: '两条轨迹被引力捕获，开始围绕彼此旋转。' },
  { name: '心形', sub: '引力塌缩为可见轮廓，爱有了形状。' },
  { name: '心跳', sub: '每一次脉冲都成为情感数据的采样点。' },
  { name: '爆发', sub: '关键瞬间释放能量，时间线产生跃迁。' },
  { name: '照片粒子', sub: '记忆被拆成像素云，形成可检索的照片时刻。' },
  { name: '文字粒子', sub: '誓言与对话成为漂浮语义，参与叙事。' },
  { name: '余韵', sub: '情绪沉降为光晕，形成可回放的爱情归档。' }
];

const titleEl = document.getElementById('phase-title');
const subEl = document.getElementById('phase-sub');
const milestonesEl = document.getElementById('milestones');
const progressEl = document.getElementById('timeline-progress');

milestonesEl.innerHTML = phases.map((phase) => `<li>${phase.name}</li>`).join('');
const milestoneNodes = [...milestonesEl.querySelectorAll('li')];

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.z = 23;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.25, 0.45, 0.85);
composer.addPass(bloom);

const root = new THREE.Group();
scene.add(root);

function makeDataTexture(draw) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.needsUpdate = true;
  return tx;
}

const heartTexture = makeDataTexture((ctx, size) => {
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  g.addColorStop(0, '#ffdbe8');
  g.addColorStop(0.5, '#ff5fab');
  g.addColorStop(1, 'rgba(255,95,171,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  const s = size / 5.2;
  const ox = size / 2;
  const oy = size / 2 + 8;
  ctx.moveTo(ox, oy + s);
  for (let i = 0; i < Math.PI * 2; i += 0.02) {
    const x = 16 * Math.pow(Math.sin(i), 3);
    const y =
      13 * Math.cos(i) -
      5 * Math.cos(2 * i) -
      2 * Math.cos(3 * i) -
      Math.cos(4 * i);
    ctx.lineTo(ox + x * s * 0.95, oy - y * s * 0.95);
  }
  ctx.closePath();
  ctx.fill();
});

const photoTexture = makeDataTexture((ctx, size) => {
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#8de4ff');
  grad.addColorStop(1, '#ffd1ec');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(24, 24, size - 48, size - 48);
  ctx.fillStyle = 'rgba(255,141,194,0.65)';
  ctx.fillRect(38, size - 96, size - 76, 40);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, size - 48, size - 48);
});

const textTexture = makeDataTexture((ctx, size) => {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 46px Noto Sans SC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff8dcc';
  ctx.shadowBlur = 14;
  ctx.fillText('爱', size / 2, size / 2 - 20);
  ctx.font = '500 28px Noto Sans SC';
  ctx.fillText('Timeline', size / 2, size / 2 + 26);
});

const galaxyGeo = new THREE.BufferGeometry();
const galaxyCount = 22000;
const gPos = new Float32Array(galaxyCount * 3);
const gScale = new Float32Array(galaxyCount);
for (let i = 0; i < galaxyCount; i += 1) {
  const i3 = i * 3;
  const r = Math.pow(Math.random(), 0.5) * 28;
  const angle = r * 0.5 + (i % 4) * (Math.PI / 2);
  const noise = (Math.random() - 0.5) * 3;
  gPos[i3] = Math.cos(angle) * r + noise;
  gPos[i3 + 1] = (Math.random() - 0.5) * 8 + noise * 0.2;
  gPos[i3 + 2] = Math.sin(angle) * r + noise;
  gScale[i] = Math.random();
}
galaxyGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
galaxyGeo.setAttribute('aScale', new THREE.BufferAttribute(gScale, 1));

const pointVS = `
attribute float aScale;
uniform float uTime;
uniform float uSize;
uniform float uPulse;
uniform float uTwist;
varying float vSpark;
void main(){
  vec3 pos = position;
  float theta = atan(pos.z, pos.x) + uTwist;
  float radius = length(pos.xz);
  pos.x = cos(theta) * radius;
  pos.z = sin(theta) * radius;
  pos.y += sin(uTime * 0.8 + radius * 0.2) * 0.18 * uPulse;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (aScale + 0.35) * (1.0 / -mv.z);
  vSpark = aScale;
}
`;

const pointFS = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying float vSpark;
void main(){
  float d = distance(gl_PointCoord, vec2(0.5));
  float alpha = smoothstep(0.5, 0.0, d);
  vec3 c = mix(uColorA, uColorB, vSpark);
  gl_FragColor = vec4(c, alpha * uOpacity);
}
`;

const galaxyMat = new THREE.ShaderMaterial({
  vertexShader: pointVS,
  fragmentShader: pointFS,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uSize: { value: 30 },
    uPulse: { value: 0 },
    uTwist: { value: 0 },
    uOpacity: { value: 0.96 },
    uColorA: { value: new THREE.Color('#75beff') },
    uColorB: { value: new THREE.Color('#ff77d9') }
  }
});

const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
root.add(galaxy);

function makeSpriteCloud(tex, count = 2200, radius = 12, ySpread = 6) {
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  const s = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const rr = Math.random() * radius;
    const a = Math.random() * Math.PI * 2;
    p[i3] = Math.cos(a) * rr;
    p[i3 + 1] = (Math.random() - 0.5) * ySpread;
    p[i3 + 2] = Math.sin(a) * rr;
    s[i] = 0.6 + Math.random() * 1.2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(s, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uTex: { value: tex },
      uOpacity: { value: 0 },
      uPulse: { value: 0 },
      uSize: { value: 30 }
    },
    vertexShader: `
attribute float aScale;
uniform float uTime;
uniform float uPulse;
uniform float uSize;
varying float vAlpha;
void main(){
  vec3 pos = position;
  float w = sin(uTime * 0.7 + pos.x * 0.2 + pos.z * 0.2) * 0.5;
  pos += normalize(pos + 0.001) * w * uPulse;
  vec4 mv = modelViewMatrix * vec4(pos,1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * (1.0 / -mv.z);
  vAlpha = aScale;
}`,
    fragmentShader: `
uniform sampler2D uTex;
uniform float uOpacity;
varying float vAlpha;
void main(){
  vec4 tex = texture2D(uTex, gl_PointCoord);
  float alpha = tex.a * uOpacity * smoothstep(0.1, 1.0, vAlpha);
  if(alpha < 0.01) discard;
  gl_FragColor = vec4(tex.rgb, alpha);
}`
  });

  return new THREE.Points(geo, mat);
}

const photoCloud = makeSpriteCloud(photoTexture, 1700, 11, 5);
const textCloud = makeSpriteCloud(textTexture, 1900, 10, 5.5);
const heartCloud = makeSpriteCloud(heartTexture, 2400, 9, 4);
root.add(photoCloud, textCloud, heartCloud);

const pointer = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
});

function seg(value, start, end) {
  return THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
}

function ease(x) {
  return x * x * (3 - 2 * x);
}

function updateNarrative(progress, t) {
  const idx = Math.min(phases.length - 1, Math.floor(progress * phases.length));
  titleEl.textContent = phases[idx].name;
  subEl.textContent = phases[idx].sub;
  milestoneNodes.forEach((node, i) => node.classList.toggle('active', i <= idx));
  progressEl.style.width = `${(progress * 100).toFixed(2)}%`;

  const cosmos = ease(seg(progress, 0.0, 0.12));
  const vortex = ease(seg(progress, 0.12, 0.25));
  const heart = ease(seg(progress, 0.25, 0.37));
  const beat = ease(seg(progress, 0.37, 0.5));
  const burst = ease(seg(progress, 0.5, 0.64));
  const photo = ease(seg(progress, 0.64, 0.76));
  const text = ease(seg(progress, 0.76, 0.89));
  const after = ease(seg(progress, 0.89, 1.0));

  galaxyMat.uniforms.uTime.value = t;
  galaxyMat.uniforms.uTwist.value = vortex * 3.2 + burst * 6.0;
  galaxyMat.uniforms.uPulse.value = beat * (0.5 + Math.sin(t * 8) * 0.5);
  galaxyMat.uniforms.uOpacity.value = 1.0 - photo * 0.65 - text * 0.5;
  galaxyMat.uniforms.uSize.value = 26 + cosmos * 12 + burst * 6;

  heartCloud.material.uniforms.uTime.value = t;
  heartCloud.material.uniforms.uOpacity.value = heart * 0.92 + beat * 0.75 - burst * 0.85;
  heartCloud.material.uniforms.uPulse.value = beat * (1.4 + Math.sin(t * 10) * 0.2);
  heartCloud.material.uniforms.uSize.value = 18 + heart * 20;
  heartCloud.rotation.y = t * 0.2;
  heartCloud.scale.setScalar(0.2 + heart * 1.4 + beat * 0.12 - burst * 0.55);

  photoCloud.material.uniforms.uTime.value = t;
  photoCloud.material.uniforms.uOpacity.value = photo * 0.95 + after * 0.2;
  photoCloud.material.uniforms.uPulse.value = photo * 0.8;
  photoCloud.material.uniforms.uSize.value = 26 + photo * 10;
  photoCloud.rotation.y = t * 0.15 + photo * 0.5;
  photoCloud.rotation.x = photo * 0.25;

  textCloud.material.uniforms.uTime.value = t;
  textCloud.material.uniforms.uOpacity.value = text * 0.98 + after * 0.35;
  textCloud.material.uniforms.uPulse.value = text * 1.1 + after * 0.25;
  textCloud.material.uniforms.uSize.value = 20 + text * 22;
  textCloud.rotation.y = -t * 0.13 - text * 0.4;

  const fluidDrift = Math.sin(t * 0.35) * 0.4 + pointer.x * 0.45;
  root.rotation.y = fluidDrift;
  root.rotation.x = pointer.y * 0.16;

  camera.position.z = 23 - burst * 5 - photo * 2 + after * 1.5;
  bloom.strength = 1.1 + beat * 0.8 + burst * 0.9 + after * 0.5;
  bloom.radius = 0.45 + after * 0.3;
  bloom.threshold = 0.85 - beat * 0.2;

  scene.fog = new THREE.FogExp2('#0a0914', 0.03 + burst * 0.04 + after * 0.02);
}

let progress = 0;
let renderedProgress = 0;
window.addEventListener('scroll', () => {
  const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  progress = scrollMax > 0 ? window.scrollY / scrollMax : 0;
});

const clock = new THREE.Clock();

function tick() {
  const t = clock.getElapsedTime();
  renderedProgress = THREE.MathUtils.damp(renderedProgress, progress, 8, 1 / 60);
  updateNarrative(renderedProgress, t);
  composer.render();
  requestAnimationFrame(tick);
}

tick();

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});
