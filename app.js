/* Fondo 3D: armilar de anillos dorados. Visible en el hero y se atenua al bajar. */
(function () {
  const canvas = document.querySelector("#webgl");
  if (!canvas || !window.THREE) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 3, 3); scene.add(key);
  const fill = new THREE.DirectionalLight(0xd3ac6e, 0.6); fill.position.set(-3, 1, -2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xf3ede0, 0.5); rim.position.set(0, -2, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const model = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd3ac6e, metalness: 0.85, roughness: 0.28, emissive: 0x3a2a12, emissiveIntensity: 0.15 });
  const deep = new THREE.MeshStandardMaterial({ color: 0xa9824c, metalness: 0.9, roughness: 0.32 });
  const defs = [
    { r: 1.35, t: 0.028, x: 0, y: 0, z: 0.15 },
    { r: 1.2, t: 0.024, x: Math.PI / 2.4, y: 0.3, z: 0 },
    { r: 1.05, t: 0.02, x: Math.PI / 1.7, y: -0.5, z: 0.4 },
    { r: 0.9, t: 0.018, x: Math.PI / 3.1, y: 1.1, z: -0.3 },
  ];
  const rings = defs.map((d) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(d.r, d.t, 24, 96), gold);
    m.rotation.set(d.x, d.y, d.z); model.add(m); return m;
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 0), deep); model.add(core);
  const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshBasicMaterial({ color: 0xf3ede0, wireframe: true, transparent: true, opacity: 0.22 }));
  model.add(halo);
  scene.add(model);

  const far = new THREE.MeshBasicMaterial({ color: 0xd3ac6e, transparent: true, opacity: 0.09 });
  const farRings = [[4.4, 0.012, Math.PI / 2.6, 0, -3.5], [5.6, 0.008, Math.PI / 1.8, 0.6, -4.5], [3.2, 0.01, Math.PI / 2, -0.8, -2.6]].map((a) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(a[0], a[1], 8, 128), far);
    m.rotation.x = a[2]; m.rotation.y = a[3]; m.position.z = a[4]; scene.add(m); return m;
  });

  const N = 420, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 3.5 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); pos[i * 3 + 2] = r * Math.cos(ph) - 3;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xd3ac6e, size: 0.028, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(particles);

  /* interaccion: arrastrar horizontalmente sobre el hero gira el objeto (el scroll vertical sigue libre) */
  const hero = document.querySelector(".hero");
  let dragging = false, lx = 0, ly = 0, manY = 0, manX = 0, auto = 0, mx = 0, my = 0;
  addEventListener("mousemove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  if (hero) {
    hero.addEventListener("pointerdown", (e) => { if (e.target.closest("a,button")) return; dragging = true; lx = e.clientX; ly = e.clientY; });
    addEventListener("pointermove", (e) => {
      if (!dragging) return;
      manY += (e.clientX - lx) * 0.006; manX += (e.clientY - ly) * 0.004; manX = Math.max(-0.8, Math.min(0.8, manX));
      lx = e.clientX; ly = e.clientY;
    });
    ["pointerup", "pointercancel"].forEach((n) => addEventListener(n, () => (dragging = false)));
  }

  let fade = 1;
  function onScroll() {
    const h = innerHeight;
    fade = Math.max(0.16, 1 - scrollY / (h * 0.9));
    canvas.style.opacity = fade.toFixed(3);
    const nav = document.querySelector(".nav");
    if (nav) nav.classList.toggle("solid", scrollY > 40);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const clock = new THREE.Clock(); let last = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (scrollY > innerHeight * 1.6 || document.hidden) return; // ahorro de bateria
    const t = clock.getElapsedTime(), dt = t - last; last = t;
    if (!dragging && !reduce) auto += dt * 0.18;
    model.rotation.y = auto + manY; model.rotation.x = manX;
    model.scale.setScalar(innerWidth < 700 ? 0.52 : 0.8);
    if (!reduce) {
      core.rotation.y = -t * 0.4; core.rotation.x = t * 0.15; halo.rotation.y = -t * 0.25; halo.rotation.x = t * 0.1;
      rings.forEach((r, i) => (r.rotation.z += 0.0009 * (i % 2 ? -1 : 1)));
      farRings[0].rotation.z = t * 0.03; farRings[1].rotation.z = -t * 0.02; farRings[2].rotation.z = t * 0.025;
      particles.rotation.y = t * 0.015;
    }
    camera.position.x += (mx * 1.1 - camera.position.x) * 0.03;
    camera.position.y += (-my * 0.7 - camera.position.y) * 0.03;
    // el objeto queda en el tercio superior, sobre el texto del hero
    camera.lookAt(0, innerWidth < 700 ? -1.55 : -1.75, 0);
    renderer.render(scene, camera);
  }
  frame();

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  });
})();
