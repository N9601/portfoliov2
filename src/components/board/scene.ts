import * as THREE from "three";

/**
 * The motherboard scene. Ported from v1's Motherboard.tsx and split
 * into a builder that exposes a *parts registry* so the page's scroll
 * timeline can choreograph groups of parts (CPU, RAM, GPU, ports...)
 * independently.
 *
 * Nothing here knows about scroll. Two plain objects carry the
 * choreography state and the render loop reads them every frame:
 *
 *   state  - global: explode, rotY, rotX, scale, opacity, x, y, power
 *   parts  - per component: ex (0 assembled .. 1 exploded),
 *            focus (0 in place .. 1 pulled to the focus point)
 */

export type PartKind =
  | "cpu"
  | "heatsink"
  | "gpu"
  | "ram"
  | "cap"
  | "port"
  | "chip"
  | "resistor";

export type Part = {
  kind: PartKind;
  mesh: THREE.Object3D;
  basePos: THREE.Vector3;
  offsetSeed: THREE.Vector3;
  cracked: THREE.Vector3;
  explodeDir: THREE.Vector3;
  /** choreography: 0 assembled, 1 exploded */
  ex: number;
  /** choreography: 0 in place, 1 at the focus point */
  focus: number;
  /** boot fly-in only (1 scattered .. 0 landed); combined with `ex` */
  bootEx: number;
  /** index inside its kind group (ram 0..3 etc.) */
  slot: number;
};

export type BoardState = {
  explode: number;
  rotY: number;
  rotX: number;
  scale: number;
  opacity: number;
  x: number;
  y: number;
  /** LED / emissive multiplier, 1 = normal (scroll choreography) */
  power: number;
  /** boot-only multiplier, 0 dark .. 1 lit */
  bootPower: number;
  /** manual override from the terminal: extra explode amount 0..1 */
  kick: number;
  /** where focused parts travel to (world units) */
  focusX: number;
  focusY: number;
  focusZ: number;
};

export type BoardScene = {
  state: BoardState;
  parts: Part[];
  byKind: (kind: PartKind) => Part[];
  render: (t: number) => void;
  setPointer: (ndcX: number, ndcY: number) => void;
  bumpActivity: () => void;
  resize: () => void;
  dispose: () => void;
  canvas: HTMLCanvasElement;
};

export function createBoardScene(mount: HTMLElement): BoardScene {
  const width = mount.clientWidth || 1;
  const height = mount.clientHeight || 1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080808, 0.022);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 9.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarse ? 1.25 : 1.5));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  mount.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0x556677, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 6, 7);
  scene.add(key);
  const coolRim = new THREE.DirectionalLight(0x4488ff, 1.3);
  coolRim.position.set(-5, 2, 3);
  scene.add(coolRim);
  const warmRim = new THREE.DirectionalLight(0xff6622, 1.0);
  warmRim.position.set(6, -1, 2);
  scene.add(warmRim);
  const center = new THREE.PointLight(0x0066ff, 6, 9, 1.6);
  center.position.set(0, 0, 0.8);
  scene.add(center);
  const redLight = new THREE.PointLight(0xff1133, 1.8, 6, 2);
  redLight.position.set(2.2, -1, 1.4);
  scene.add(redLight);

  const root = new THREE.Group();
  root.rotation.x = -0.18;
  root.rotation.y = 0.05;
  scene.add(root);

  // PCB
  const pcbW = 7.2;
  const pcbH = 4.6;
  const pcbGeo = new THREE.BoxGeometry(pcbW, pcbH, 0.18, 1, 1, 1);
  const pcbMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCursor: { value: new THREE.Vector2(0.5, 0.5) },
      uIdle: { value: 0 },
      uIdleSweep: { value: 0 },
      uColorA: { value: new THREE.Color(0x0066ff) },
      uColorB: { value: new THREE.Color(0xff5500) },
      uColorR: { value: new THREE.Color(0xff1133) },
      uColorBase: { value: new THREE.Color(0x070710) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform float uTime;
      uniform vec2 uCursor;
      uniform float uIdle;
      uniform float uIdleSweep;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorR;
      uniform vec3 uColorBase;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float circuit(vec2 p, float scale) {
        p *= scale;
        vec2 g = fract(p) - 0.5;
        vec2 id = floor(p);
        float r = hash(id);
        float trace = 0.0;
        if (r < 0.33) {
          trace = smoothstep(0.04, 0.0, abs(g.x));
        } else if (r < 0.66) {
          trace = smoothstep(0.04, 0.0, abs(g.y));
        } else {
          float a = smoothstep(0.04, 0.0, abs(g.x));
          float b = smoothstep(0.04, 0.0, abs(g.y));
          trace = max(a * step(0.0, g.y), b * step(0.0, g.x));
        }
        float node = smoothstep(0.13, 0.07, length(g));
        return max(trace, node * 0.85);
      }
      float dataPulse(vec2 p, float t) {
        float v = sin(p.x * 6.2832 + t * 3.5) * 0.5 + 0.5;
        v *= sin(p.y * 6.2832 - t * 2.8) * 0.5 + 0.5;
        return pow(v, 6.0);
      }
      void main() {
        float front = max(vNormal.z, 0.0);
        vec2 uv = vUv * 2.0 - 1.0;
        float c1 = circuit(uv, 7.0);
        float c2 = circuit(uv + 3.7, 14.0) * 0.55;
        float c3 = circuit(uv * 0.5 - 1.1, 3.5) * 0.7;
        float c = max(max(c1, c2), c3);
        float p1 = dataPulse(uv, uTime);
        float p2 = dataPulse(uv * 1.3 + 2.0, uTime * 0.7);
        vec2 cp = vUv - uCursor;
        float halo = smoothstep(0.55, 0.0, length(cp));
        float sweepDist = abs(vUv.x - uIdleSweep);
        float sweepCore = smoothstep(0.045, 0.0, sweepDist) * uIdle;
        float sweepTrail = smoothstep(0.16, 0.0, sweepDist) * uIdle * 0.45;
        float sweep = max(sweepCore, sweepTrail);
        float redFlick = step(0.985, hash(vec2(floor(uTime * 20.0), 0.0)));
        vec3 traceCol = mix(uColorA, uColorB, p1);
        traceCol = mix(traceCol, uColorR, redFlick * 0.6);
        vec3 col = uColorBase;
        col += traceCol * c * (0.85 + p2 * 1.2 + halo * 1.8 + sweep * 2.5);
        col += uColorA * sweep * 0.6;
        col += uColorA * 0.04 * (sin(uv.x * 3.0 + uTime * 0.5) * 0.5 + 0.5);
        col += vec3(0.02) * (sin(vUv.y * 600.0) * 0.5 + 0.5);
        float edgeX = smoothstep(0.97, 1.0, abs(uv.x));
        float edgeY = smoothstep(0.97, 1.0, abs(uv.y));
        col += vec3(0.15, 0.2, 0.4) * max(edgeX, edgeY);
        float vig = 1.0 - dot(uv * 0.5, uv * 0.5) * 0.7;
        col *= vig;
        col = mix(vec3(0.04, 0.05, 0.07), col, front);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  pcb.position.z = -0.4;
  root.add(pcb);
  pcb.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(pcbGeo),
      new THREE.LineBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.55 })
    )
  );

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x6a7280, roughness: 0.32, metalness: 0.94, emissive: 0x101520, emissiveIntensity: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc8923a, roughness: 0.28, metalness: 0.96, emissive: 0x5a3a14, emissiveIntensity: 0.55 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.42, metalness: 0.85, emissive: 0x0a0c14, emissiveIntensity: 0.35 });
  const blueGlow = new THREE.MeshStandardMaterial({ color: 0x223060, roughness: 0.3, metalness: 0.9, emissive: 0x0066ff, emissiveIntensity: 1.6 });
  const orangeGlow = new THREE.MeshStandardMaterial({ color: 0x502a10, roughness: 0.38, metalness: 0.85, emissive: 0xff5500, emissiveIntensity: 1.4 });
  const redGlow = new THREE.MeshStandardMaterial({ color: 0x4a1018, roughness: 0.4, metalness: 0.8, emissive: 0xff1133, emissiveIntensity: 1.5 });
  const edgeMatBlue = new THREE.LineBasicMaterial({ color: 0x88bbff, transparent: true, opacity: 0.65 });

  // LED materials get collected so `power` can drive them
  const leds: { mat: THREE.MeshStandardMaterial; base: number }[] = [];
  const led = (m: THREE.MeshStandardMaterial) => {
    const c = m.clone();
    leds.push({ mat: c, base: c.emissiveIntensity });
    return c;
  };

  const parts: Part[] = [];
  const slotCount: Partial<Record<PartKind, number>> = {};
  const addPart = (kind: PartKind, mesh: THREE.Object3D, x: number, y: number, z: number) => {
    mesh.position.set(x, y, z);
    root.add(mesh);
    const slot = slotCount[kind] ?? 0;
    slotCount[kind] = slot + 1;
    parts.push({
      kind,
      mesh,
      slot,
      basePos: new THREE.Vector3(x, y, z),
      offsetSeed: new THREE.Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100),
      cracked: new THREE.Vector3(),
      explodeDir: new THREE.Vector3(
        x * 0.7 + (Math.random() - 0.5) * 2.0,
        y * 0.7 + (Math.random() - 0.5) * 2.0,
        1.0 + Math.random() * 2.4
      ),
      ex: 0,
      focus: 0,
      bootEx: 1, // starts scattered; the boot flies everything in
    });
  };
  const wrapEdges = (mesh: THREE.Mesh) => {
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMatBlue.clone()));
  };

  // CPU
  const cpuGroup = new THREE.Group();
  const cpuBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.22), darkMat.clone());
  wrapEdges(cpuBase);
  cpuGroup.add(cpuBase);
  const cpuTop = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 0.1), goldMat);
  cpuTop.position.z = 0.16;
  cpuGroup.add(cpuTop);
  const cpuChip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.03), led(blueGlow));
  cpuChip.position.z = 0.22;
  cpuGroup.add(cpuChip);
  for (let i = 0; i < 16; i++) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), i % 3 === 0 ? led(blueGlow) : metalMat.clone());
    const a = (i / 16) * Math.PI * 2;
    pad.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.13);
    cpuGroup.add(pad);
  }
  addPart("cpu", cpuGroup, 0, 0, 0.55);

  // Heatsink
  const heatsink = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.04), metalMat.clone());
    fin.position.z = i * 0.13;
    heatsink.add(fin);
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.06), darkMat.clone());
  cap.position.z = 9 * 0.13;
  heatsink.add(cap);
  addPart("heatsink", heatsink, 0, 0, 1.4);

  // GPU
  const gpuGroup = new THREE.Group();
  const gpu = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.85, 0.32), darkMat.clone());
  wrapEdges(gpu);
  gpuGroup.add(gpu);
  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.22), metalMat.clone());
    fin.position.x = -1.15 + i * 0.46;
    fin.position.z = 0.22;
    gpuGroup.add(fin);
  }
  const gpuLed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 0.05), led(blueGlow));
  gpuLed.position.set(0, -0.42, 0.18);
  gpuGroup.add(gpuLed);
  addPart("gpu", gpuGroup, -1.65, -1.45, 0.4);

  // RAM x4
  for (let i = 0; i < 4; i++) {
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.9, 0.18), darkMat.clone());
    wrapEdges(stick);
    const shim = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.08), led(i % 2 === 0 ? blueGlow : orangeGlow));
    shim.position.z = 0.13;
    stick.add(shim);
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), metalMat.clone());
    notch.position.set(0, -0.7, 0.16);
    stick.add(notch);
    addPart("ram", stick, 2.0 + i * 0.32, 0.4, 0.4);
  }

  // Capacitors
  for (let i = 0; i < 10; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 14), metalMat.clone());
    c.rotation.x = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 14), led(i % 3 === 0 ? blueGlow : orangeGlow));
    ring.position.z = 0.21;
    c.add(ring);
    const a = (i / 10) * Math.PI * 2 + 0.7;
    addPart("cap", c, Math.cos(a) * 2.6 - 0.2, Math.sin(a) * 1.6 + 0.1, 0.25);
  }

  // Ports
  for (let i = 0; i < 5; i++) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.28), darkMat.clone());
    wrapEdges(port);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), led(i % 2 === 0 ? blueGlow : i === 3 ? redGlow : orangeGlow));
    l.position.set(-0.18, 0.08, 0.18);
    port.add(l);
    addPart("port", port, -3.0, 1.4 - i * 0.45, 0.3);
  }

  // SMD chips
  for (let i = 0; i < 18; i++) {
    const w = 0.12 + Math.random() * 0.2;
    const h = 0.06 + Math.random() * 0.1;
    const r = Math.random();
    const chip = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), r < 0.15 ? led(blueGlow) : r < 0.3 ? led(orangeGlow) : darkMat.clone());
    addPart("chip", chip, (Math.random() - 0.5) * 6.2, (Math.random() - 0.5) * 3.8, 0.18);
  }

  // Resistors
  for (let i = 0; i < 12; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.05), darkMat.clone());
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.06), goldMat);
    t1.position.x = -0.13;
    r.add(t1);
    const t2 = t1.clone();
    t2.position.x = 0.13;
    r.add(t2);
    r.rotation.z = Math.random() < 0.5 ? 0 : Math.PI / 2;
    addPart("resistor", r, (Math.random() - 0.5) * 5.8, (Math.random() - 0.5) * 3.4, 0.13);
  }

  // Connector arcs
  const connectorPoints: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(0, 0, 0.6), new THREE.Vector3(-1.65, -1.45, 0.4)],
    [new THREE.Vector3(0, 0, 0.6), new THREE.Vector3(2.0, 0.4, 0.4)],
    [new THREE.Vector3(0, 0, 0.6), new THREE.Vector3(-3.0, 0.5, 0.3)],
    [new THREE.Vector3(-1.65, -1.45, 0.4), new THREE.Vector3(-3.0, 0.5, 0.3)],
  ];
  const connectorLines: THREE.Line[] = [];
  for (const [a, b] of connectorPoints) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const mid = a.clone().lerp(b, t);
      mid.z += Math.sin(t * Math.PI) * 0.6;
      pts.push(mid);
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.5 })
    );
    root.add(line);
    connectorLines.push(line);
  }

  // Particles
  const particleCount = 130;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const seeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
    positions[i * 3 + 2] = (Math.random() - 0.2) * 2;
    seeds[i] = Math.random() * 100;
  }
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0x44aaff, size: 0.04, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  root.add(new THREE.Points(particleGeo, particleMat));

  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(32 * 3);
  for (let i = 0; i < 32; i++) {
    sparkPos[i * 3 + 0] = (Math.random() - 0.5) * 7;
    sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 4.4;
    sparkPos[i * 3 + 2] = Math.random() * 1.6;
  }
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({ color: 0xff7733, size: 0.07, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  root.add(new THREE.Points(sparkGeo, sparkMat));

  // Pointer / pick plane
  const ndc = new THREE.Vector2(0, 0);
  const ndcTarget = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const cursorWorld = new THREE.Vector3(99, 99, 0);
  const pickPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ visible: false }));
  pickPlane.position.z = 0.4;
  root.add(pickPlane);

  let lastActivity = performance.now();
  const IDLE_DELAY = 5000;

  const state: BoardState = {
    explode: 0,
    rotY: 0,
    rotX: 0,
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
    power: 1,
    bootPower: 1,
    kick: 0,
    focusX: 1.8,
    focusY: 0,
    focusZ: 2.6,
  };

  const worldPos = new THREE.Vector3();
  const focusPt = new THREE.Vector3();

  const render = (t: number) => {
    ndc.x += (ndcTarget.x - ndc.x) * 0.1;
    ndc.y += (ndcTarget.y - ndc.y) * 0.1;
    camera.position.x = ndc.x * 0.5;
    camera.position.y = 0.4 + ndc.y * 0.35;
    camera.lookAt(0, 0, 0);

    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(pickPlane, false);
    if (hits.length) {
      cursorWorld.copy(hits[0].point);
      pcbMat.uniforms.uCursor.value.set(cursorWorld.x / pcbW + 0.5, cursorWorld.y / pcbH + 0.5);
    }
    pcbMat.uniforms.uTime.value = t;
    const idleMs = performance.now() - lastActivity;
    const targetIdle = idleMs > IDLE_DELAY ? 1 : 0;
    const currIdle = pcbMat.uniforms.uIdle.value;
    pcbMat.uniforms.uIdle.value = currIdle + (targetIdle - currIdle) * 0.05;
    pcbMat.uniforms.uIdleSweep.value = (t * 0.32) % 1;

    const power = state.power * state.bootPower;
    center.intensity = (5 + Math.sin(t * 2.2) * 1.8) * power;
    redLight.intensity = (1.4 + Math.sin(t * 3.2 + 1) * 1.0) * power;
    for (const l of leds) l.mat.emissiveIntensity = l.base * power;

    const g = Math.max(state.explode, state.kick);
    pcb.position.z = -0.4 - g * 3.0;
    for (const line of connectorLines) (line.material as THREE.LineBasicMaterial).opacity = 0.5 * (1 - g);
    particleMat.opacity = 0.75 * (1 - g * 0.85);
    sparkMat.opacity = (0.5 + Math.sin(t * 6) * 0.3) * (1 - g);

    // focus point is expressed in root space; keep it facing the camera
    focusPt.set(state.focusX, state.focusY, state.focusZ);

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.mesh.getWorldPosition(worldPos);
      const dx = worldPos.x - cursorWorld.x;
      const dy = worldPos.y - cursorWorld.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = Math.max(0, 1 - dist / 2.2);
      const push = force * force * 0.7;
      const len = Math.max(dist, 0.0001);
      const floatX = Math.sin(t * 0.6 + p.offsetSeed.x) * 0.012;
      const floatY = Math.cos(t * 0.5 + p.offsetSeed.y) * 0.012;
      const floatZ = Math.sin(t * 0.8 + p.offsetSeed.z) * 0.04 + Math.cos(t * 0.4) * 0.02;
      p.cracked.x += ((dx / len) * push + floatX - p.cracked.x) * 0.12;
      p.cracked.y += ((dy / len) * push + floatY - p.cracked.y) * 0.12;
      p.cracked.z += (force * force * 1.0 + floatZ - p.cracked.z) * 0.1;

      const exAmt = Math.max(p.ex, p.bootEx, state.kick);
      const ex = exAmt * 2.4;
      let x = p.basePos.x + p.cracked.x + p.explodeDir.x * ex;
      let y = p.basePos.y + p.cracked.y + p.explodeDir.y * ex;
      let z = p.basePos.z + p.cracked.z + p.explodeDir.z * ex;
      if (p.focus > 0) {
        const f = p.focus;
        x += (focusPt.x - x) * f;
        y += (focusPt.y - y) * f;
        z += (focusPt.z - z) * f;
      }
      p.mesh.position.set(x, y, z);
      const spin = exAmt * (1 - p.focus);
      p.mesh.rotation.z = p.cracked.x * 0.3 + spin * ((p.offsetSeed.x % 2) - 1) * 1.4;
      p.mesh.rotation.x = p.cracked.y * 0.2 + spin * ((p.offsetSeed.y % 2) - 1) * 1.1;
      p.mesh.rotation.y = spin * ((p.offsetSeed.z % 2) - 1) * 1.2 + p.focus * Math.sin(t * 0.7) * 0.25;
      const s = 1 + p.focus * 0.35;
      p.mesh.scale.setScalar(s);
    }

    const pp = particleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      pp[i * 3 + 1] += 0.005 * (0.5 + seeds[i] * 0.01);
      pp[i * 3 + 2] += Math.sin(t * 0.5 + seeds[i]) * 0.001;
      if (pp[i * 3 + 1] > 2.6) pp[i * 3 + 1] = -2.6;
    }
    particleGeo.attributes.position.needsUpdate = true;

    root.rotation.y = ndc.x * 0.18 + Math.sin(t * 0.15) * 0.04 + state.rotY;
    root.rotation.x = -0.18 + ndc.y * 0.08 + state.rotX;
    root.scale.setScalar(state.scale);
    root.position.set(state.x, state.y, 0);
    renderer.domElement.style.opacity = String(state.opacity);
    renderer.render(scene, camera);
  };

  return {
    state,
    parts,
    byKind: (kind) => parts.filter((p) => p.kind === kind),
    render,
    canvas: renderer.domElement,
    setPointer: (x, y) => {
      ndcTarget.set(x, y);
      lastActivity = performance.now();
    },
    bumpActivity: () => {
      lastActivity = performance.now();
    },
    resize: () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    dispose: () => {
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
          else (m.material as THREE.Material).dispose();
        }
      });
      renderer.domElement.remove();
    },
  };
}
