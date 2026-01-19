// src/scripts/heroBg.ts
import * as THREE from "three";

type InitBackgroundAnimationOptions = {
  canvasSelector?: string;
};

const DEFAULT_CONFIG = {
  renderer: {
    alpha: true,
    antialias: true,
    powerPreference: "high-performance" as const,
    pixelRatioCap: 2,
    clearColor: 0x000000,
    clearAlpha: 0,
    sizeStability: { throttleMs: 120 },
  },
  camera: { fov: 45, near: 0.1, far: 100, position: [0, 0, 6] as const },
  lights: {
    ambient: { color: 0xffffff, intensity: 0.25 },
    directional: {
      color: 0xffffff,
      intensity: 0.85,
      position: [2, 2, 3] as const,
    },
  },
  geometry: { radius: 2.05, detail: 32 },
  motion: {
    timeScale: 0.2,
    rotY: 0.1,
    rotX: 0.05,
    reducedMotionMedia: "(prefers-reduced-motion: reduce)",
  },
  look: {
    gradient: {
      left: "#5379EC",
      right: "#D339DE",
      softness: 1,
      animate: true,
      hueSpeed: 0.015,
      hueRange: 0.08,
      huePhase: 0.22,
    },
    mark: {
      color: "#cfd7ff",
      opacity: 0.5,
      size: 0.12,
      thickness: 1,
      boost: 1,
    },
    fill: { opacity: 0.3, haloStrength: 0.42 },
    deform: {
      disp: 0.22,
      bumpAmp: 0.18,
      bumpSpeed: 0.1,
      bumpRadiusMin: 0.18,
      bumpRadiusMax: 0.55,
      bumpCount: 3,
    },
    alphaClampMax: 0.3,
    grad: {
      radiusTuned: 2.2,
      noiseAmp: 0.04,
      noiseFreqY: 12.0,
      noiseSpeed: 0.6,
    },
    silhouette: {
      rimPow: 1.7,
      fresPow: 2.1,
      edgeSmoothA: 0.78,
      edgeSmoothB: 1.05,
      fillFeatherAtten: 0.8,
      alphaFeatherStrength: 0.8,
    },
    shade: { fillMixA: 0.78, fillMixB: 0.22, postMulA: 0.92, postMulB: 0.08 },
  },
};

export function initBackgroundAnimation(
  opts: InitBackgroundAnimationOptions = {},
) {
  // Astroの<script type="module">は基本ブラウザで動くけど、保険
  if (typeof window === "undefined") return;

  const canvasSelector = opts.canvasSelector ?? ".js-bg";

  const canvas = getCanvas(canvasSelector);

  const RUN_SEED = (() => {
    const a = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(a);

    const v = a[0] || Math.floor(Math.random() * 0xffffffff);
    return (v >>> 0) / 0xffffffff;
  })();

  const renderer = createRenderer(canvas, DEFAULT_CONFIG.renderer);

  const scene = new THREE.Scene();

  const camera = createCamera(DEFAULT_CONFIG.camera);

  addLights(scene, DEFAULT_CONFIG.lights);

  const geometry = createBaryIcoSphere(
    DEFAULT_CONFIG.geometry.radius,
    DEFAULT_CONFIG.geometry.detail,
  );

  const material = createBlobMaterial(DEFAULT_CONFIG.look, RUN_SEED);

  const mesh = new THREE.Mesh(geometry, material);

  material.depthWrite = false;
  scene.add(mesh);

  const animateGradient = createGradientAnimator(
    material,
    DEFAULT_CONFIG.look.gradient,
    RUN_SEED,
  );

  const resizeStable = createStableResizer(canvas, renderer, camera, {
    throttleMs: DEFAULT_CONFIG.renderer.sizeStability.throttleMs,
    minAspect: 1.0,
    maxAspect: 2.6,
    minDeltaPx: 2,
    fit: "height",
  });

  const onResize = () => resizeStable();

  new ResizeObserver(onResize).observe(canvas);
  window.addEventListener("orientationchange", onResize, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  resizeStable(true);

  const prefersReduced = window.matchMedia(
    DEFAULT_CONFIG.motion.reducedMotionMedia,
  ).matches;

  const clock = new THREE.Clock();

  let raf = 0;

  const renderOnce = () => renderer.render(scene, camera);

  if (prefersReduced) {
    material.uniforms.uTime.value = 0;
    animateGradient(0);
    renderOnce();
  } else {
    const tick = () => {
      const t = clock.getElapsedTime();

      const ts = t * DEFAULT_CONFIG.motion.timeScale;

      material.uniforms.uTime.value = ts;
      animateGradient(t);

      mesh.rotation.y = ts * DEFAULT_CONFIG.motion.rotY;
      mesh.rotation.x = ts * DEFAULT_CONFIG.motion.rotX;

      renderOnce();
      raf = requestAnimationFrame(tick);
    };
    tick();
  }

  // もしページ遷移（View Transitions等）を使ってるなら、クリーンアップしたい時用に返してもOK
  return () => {
    cancelAnimationFrame(raf);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };
}

function getCanvas(selector: string) {
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLCanvasElement))
    throw new Error(`Canvas element "${selector}" not found`);
  return el;
}

function createRenderer(
  canvasEl: HTMLCanvasElement,
  opts: typeof DEFAULT_CONFIG.renderer,
) {
  const r = new THREE.WebGLRenderer({
    canvas: canvasEl,
    alpha: opts.alpha,
    antialias: opts.antialias,
    powerPreference: opts.powerPreference,
  });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.pixelRatioCap));
  r.setClearColor(opts.clearColor, opts.clearAlpha);
  return r;
}

function createCamera(opts: typeof DEFAULT_CONFIG.camera) {
  const c = new THREE.PerspectiveCamera(opts.fov, 1, opts.near, opts.far);
  c.position.set(...opts.position);
  return c;
}

function addLights(sceneEl: THREE.Scene, opts: typeof DEFAULT_CONFIG.lights) {
  sceneEl.add(
    new THREE.AmbientLight(opts.ambient.color, opts.ambient.intensity),
  );

  const d = new THREE.DirectionalLight(
    opts.directional.color,
    opts.directional.intensity,
  );
  d.position.set(...opts.directional.position);
  sceneEl.add(d);
}

function createStableResizer(
  canvasEl: HTMLCanvasElement,
  rendererEl: THREE.WebGLRenderer,
  cameraEl: THREE.PerspectiveCamera,
  opts: {
    throttleMs?: number;
    minAspect?: number;
    maxAspect?: number;
    minDeltaPx?: number;
    fit?: "width" | "height";
  },
) {
  const throttleMs = opts?.throttleMs ?? 120;

  const minAspect = opts?.minAspect ?? 1.0;

  const maxAspect = opts?.maxAspect ?? 2.2;

  const minDeltaPx = opts?.minDeltaPx ?? 2;

  const fit = opts?.fit ?? "width";

  let raf = 0;
  let lastW = 0;
  let lastH = 0;
  let lastT = 0;

  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));

  const apply = (force = false) => {
    const now = performance.now();
    if (!force && now - lastT < throttleMs) return;
    lastT = now;

    const cw = canvasEl.clientWidth || 1;

    const ch = canvasEl.clientHeight || 1;

    const rawAspect = cw / ch;

    const aspect = clamp(rawAspect, minAspect, maxAspect);

    let targetW: number;
    let targetH: number;

    if (fit === "height") {
      targetH = ch;
      targetW = Math.round(ch * aspect);
    } else {
      targetW = cw;
      targetH = Math.round(cw / aspect);
    }

    if (
      !force &&
      Math.abs(targetW - lastW) < minDeltaPx &&
      Math.abs(targetH - lastH) < minDeltaPx
    )
      return;

    lastW = targetW;
    lastH = targetH;

    rendererEl.setSize(targetW, targetH, false);
    cameraEl.aspect = targetW / targetH;
    cameraEl.updateProjectionMatrix();
  };

  return (force = false) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => apply(force));
  };
}

function createGradientAnimator(
  materialEl: THREE.ShaderMaterial,
  gradientOpts: typeof DEFAULT_CONFIG.look.gradient,
  seed: number,
) {
  const g = gradientOpts;

  const baseLeft = new THREE.Color(g.left);

  const baseRight = new THREE.Color(g.right);

  const hslL = { h: 0, s: 0, l: 0 };

  const hslR = { h: 0, s: 0, l: 0 };

  baseLeft.getHSL(hslL);
  baseRight.getHSL(hslR);

  const tmpL = new THREE.Color();

  const tmpR = new THREE.Color();

  const wrap01 = (v: number) => ((v % 1) + 1) % 1;

  return (timeSec: number) => {
    if (!g.animate) return;

    const phase = timeSec * g.hueSpeed + seed;

    const s = phase * Math.PI * 2.0;

    const driftL = Math.sin(s) * g.hueRange;

    const driftR = Math.sin((phase + g.huePhase) * Math.PI * 2.0) * g.hueRange;

    tmpL.setHSL(wrap01(hslL.h + driftL), hslL.s, hslL.l);
    tmpR.setHSL(wrap01(hslR.h + driftR), hslR.s, hslR.l);

    materialEl.uniforms.uLeft.value.copy(tmpL);
    materialEl.uniforms.uRight.value.copy(tmpR);
  };
}

function createBaryIcoSphere(radius: number, detail: number) {
  const base = new THREE.IcosahedronGeometry(radius, detail);

  const geo = base.toNonIndexed();

  const vCount = geo.attributes.position.count;

  const bary = new Float32Array(vCount * 3);

  for (let i = 0; i < vCount; i += 3) {
    bary.set([1, 0, 0, 0, 1, 0, 0, 0, 1], i * 3);
  }

  geo.setAttribute("aBary", new THREE.BufferAttribute(bary, 3));
  return geo;
}

function createBlobMaterial(look: typeof DEFAULT_CONFIG.look, seed: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uLeft: { value: new THREE.Color(look.gradient.left) },
      uRight: { value: new THREE.Color(look.gradient.right) },
      uMark: { value: new THREE.Color(look.mark.color) },
      uFillAlpha: { value: look.fill.opacity },
      uMarkAlpha: { value: look.mark.opacity },
      uNodeWidth: { value: look.mark.thickness },
      uNodeLen: { value: look.mark.size },
      uCrossBoost: { value: look.mark.boost },
      uHaloStrength: { value: look.fill.haloStrength },
      uGradSoftness: { value: look.gradient.softness },
      uDisp: { value: look.deform.disp },
      uBumpAmp: { value: look.deform.bumpAmp },
      uBumpSpeed: { value: look.deform.bumpSpeed },
      uBumpRadiusMin: { value: look.deform.bumpRadiusMin },
      uBumpRadiusMax: { value: look.deform.bumpRadiusMax },
      uBumpCount: { value: look.deform.bumpCount },
      uAlphaMax: { value: look.alphaClampMax },
      uRadiusTuned: { value: look.grad.radiusTuned },
      uNoiseAmp: { value: look.grad.noiseAmp },
      uNoiseFreqY: { value: look.grad.noiseFreqY },
      uNoiseSpeed: { value: look.grad.noiseSpeed },
      uRimPow: { value: look.silhouette.rimPow },
      uFresPow: { value: look.silhouette.fresPow },
      uEdgeA: { value: look.silhouette.edgeSmoothA },
      uEdgeB: { value: look.silhouette.edgeSmoothB },
      uFillMixA: { value: look.shade.fillMixA },
      uFillMixB: { value: look.shade.fillMixB },
      uPostMulA: { value: look.shade.postMulA },
      uPostMulB: { value: look.shade.postMulB },
      uAlphaFeatherStrength: { value: look.silhouette.alphaFeatherStrength },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSeed;
      uniform float uDisp;
      uniform float uBumpAmp;
      uniform float uBumpSpeed;
      uniform float uBumpRadiusMin;
      uniform float uBumpRadiusMax;
      uniform float uBumpCount;

      attribute vec3 aBary;

      varying vec3 vBary;
      varying vec3 vNormalW;
      varying vec3 vPosW;

      float n3(vec3 p){
        float s = uSeed * 19.123;
        return
          0.55*sin(p.x*1.7 + uTime*1.25 + s*1.1) +
          0.35*sin(p.y*2.1 + uTime*1.65 + s*1.7) +
          0.25*sin(p.z*2.7 + uTime*1.05 + s*2.3) +
          0.15*sin((p.x+p.y+p.z)*3.1 + uTime*1.95 + s*3.1);
      }

      vec3 bumpCenter(float t, float seed){
        float s = (t + seed + uSeed) * 6.2831853;
        return normalize(vec3(
          sin(s*0.73 + seed*4.1),
          sin(s*0.51 + 1.7 + seed*2.7),
          sin(s*0.62 + 3.1 + seed*3.3)
        ));
      }

      float bumpField(vec3 dir, float t, float seed, float sign){
        vec3 c = bumpCenter(t, seed);
        float d = clamp(dot(dir, c), -1.0, 1.0);
        float ang = acos(d);
        float rT = 0.5 + 0.5*sin((t + seed)*1.7);
        float radius = mix(uBumpRadiusMin, uBumpRadiusMax, rT);
        float m = smoothstep(radius, 0.0, ang);
        m = m*m;
        return m * sign;
      }

      void main(){
        vBary = aBary;

        vec3 n = normalize(normal);
        vec3 dir = normalize(position);

        float base = n3(position * 0.9) * uDisp;

        float t = uTime * uBumpSpeed;
        float b = bumpField(dir, t, 0.11, -1.0);
        if (uBumpCount > 1.5) b += bumpField(dir, t, 0.63, 1.0);
        if (uBumpCount > 2.5) b += bumpField(dir, t, 1.07, -1.0);

        float bump = b * uBumpAmp;
        vec3 pos = position + n * (base + bump);

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vPosW = worldPos.xyz;
        vNormalW = normalize(mat3(modelMatrix) * n);

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uLeft;
      uniform vec3 uRight;
      uniform vec3 uMark;

      uniform float uTime;
      uniform float uFillAlpha;
      uniform float uMarkAlpha;

      uniform float uNodeWidth;
      uniform float uNodeLen;

      uniform float uCrossBoost;
      uniform float uHaloStrength;

      uniform float uGradSoftness;

      uniform float uAlphaMax;
      uniform float uRadiusTuned;
      uniform float uNoiseAmp;
      uniform float uNoiseFreqY;
      uniform float uNoiseSpeed;

      uniform float uRimPow;
      uniform float uFresPow;
      uniform float uEdgeA;
      uniform float uEdgeB;

      uniform float uFillMixA;
      uniform float uFillMixB;

      uniform float uPostMulA;
      uniform float uPostMulB;

      uniform float uAlphaFeatherStrength;

      varying vec3 vBary;
      varying vec3 vNormalW;
      varying vec3 vPosW;

      float edgeLine(float b){
        float w = fwidth(b) * uNodeWidth;
        return 1.0 - smoothstep(0.0, w, b);
      }

      float vertexMark(vec3 bary){
        float x = bary.x;
        float y = bary.y;
        float z = bary.z;

        float nearA = smoothstep(1.0 - uNodeLen, 1.0, x);
        float nearB = smoothstep(1.0 - uNodeLen, 1.0, y);
        float nearC = smoothstep(1.0 - uNodeLen, 1.0, z);

        float markA = nearA * max(edgeLine(y), edgeLine(z));
        float markB = nearB * max(edgeLine(z), edgeLine(x));
        float markC = nearC * max(edgeLine(x), edgeLine(y));

        return max(markA, max(markB, markC));
      }

      void main(){
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vPosW);

        float gs = max(0.0, uGradSoftness);
        float noise = sin(vPosW.y * uNoiseFreqY + uTime * uNoiseSpeed) * uNoiseAmp;
        float g = smoothstep(-uRadiusTuned - gs, uRadiusTuned + gs, vPosW.x + noise);
        vec3 baseCol = mix(uLeft, uRight, g);

        float fres = pow(1.0 - max(0.0, dot(N, V)), uFresPow);
        float mark = vertexMark(vBary);

        float rim = pow(1.0 - max(0.0, dot(N, V)), uRimPow);
        float r = length(vPosW) / uRadiusTuned;
        float edge = smoothstep(uEdgeA, uEdgeB, r);
        float feather = max(rim, edge);

        vec3 fill = baseCol * (uFillMixA + uFillMixB * fres);
        vec3 halo = baseCol * (uHaloStrength * feather);
        vec3 fillCol = fill + halo;

        vec3 finalCol = fillCol + uMark * (mark * uCrossBoost);
        finalCol *= (uPostMulA + uPostMulB * (1.0 - fres));

        float alphaFill = uFillAlpha * (1.0 - uAlphaFeatherStrength * feather);
        float alpha = alphaFill + (uMarkAlpha * mark);

        gl_FragColor = vec4(finalCol, clamp(alpha, 0.0, uAlphaMax));
      }
    `,
  });
}
