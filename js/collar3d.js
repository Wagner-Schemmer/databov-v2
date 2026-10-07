// Coleira 3D — os hardwares reais do DataBov (D1 Mini + MPU6050 + MAX30102).
// Gira com scroll e arrasto; os passos destacam cada módulo. Fallback estático incluso.
(function () {
  const mount = document.getElementById("collar3d");
  const fallback = document.getElementById("collarFallback");
  const title = document.getElementById("stepTitle");
  const desc = document.getElementById("stepDesc");
  const chips = [...document.querySelectorAll("#collarSteps .chip")];
  const STEPS = [
    ["Wemos D1 Mini", "O cérebro: ESP8266 com Wi-Fi. Lê os sensores e publica no dashboard."],
    ["MPU6050", "IMU 6 eixos: acelerômetro + giroscópio. Ruminação, cio, marcha e decúbito."],
    ["MAX30102", "Oximetria e frequência cardíaca por luz infravermelha, no mesmo barramento I2C."],
    ["Montagem", "VCC, GND, SCL e SDA ligam tudo. 4 fios e a coleira está viva."],
  ];
  const CHIP_TXT = ["1 · D1 Mini", "2 · MPU6050", "3 · MAX30102", "4 · Montagem"];
  function showStep(i) {
    chips.forEach((c, j) => { c.classList.toggle("on", j === i); c.textContent = CHIP_TXT[j]; });
    title.textContent = (i + 1) + " · " + STEPS[i][0];
    desc.textContent = STEPS[i][1];
    if (window.__collarFocus) window.__collarFocus(i);
  }
  chips.forEach((c, i) => c.onclick = () => showStep(i));

  async function boot() {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, .1, 100);
    cam.position.set(0, 2.4, 9.4);
    cam.lookAt(0, .2, 0);
    const renderer = new THREE.WebGLRenderer({ canvas: mount, alpha: true, antialias: true });
    const root = new THREE.Group();
    scene.add(root);
    const std = (c, r = .5, m = .3) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

    function board(w, h, d, color) {
      const g = new THREE.Group();
      const pcb = new THREE.Mesh(new THREE.BoxGeometry(w, .14, d), std(color, .55, .2));
      g.add(pcb);
      return g;
    }
    function chip(w, h, d, color = 0x141414) {
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, .4, .6));
    }

    // — D1 Mini (base azul + USB prata + shield ESP + pinos) —
    const d1 = new THREE.Group();
    d1.add(board(3.6, 0, 2.6, 0x1a56c9));
    const usb = chip(.7, .3, .6, 0xc0c8d0); usb.position.set(-1.1, .2, 0); d1.add(usb);
    const esp = chip(1.5, .22, 1.5, 0x1c1c22); esp.position.set(.5, .16, 0); d1.add(esp);
    const pinMat = std(0xd8b400, .35, .8);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .3, 10), pinMat);
      p.position.set(-1.5 + i * .43, .2, r ? .95 : -.95);
      d1.add(p);
    }
    d1.position.set(0, -1.5, 0);
    root.add(d1);

    // — MPU6050 (placa roxa + chip) —
    const mpu = new THREE.Group();
    mpu.add(board(1.7, 0, 1.5, 0x4b2fb3));
    const mpuChip = chip(.55, .14, .55); mpuChip.position.y = .14; mpu.add(mpuChip);
    mpu.position.set(-2.9, 1, -.4);
    mpu.rotation.set(.2, .5, -.12);
    root.add(mpu);

    // — MAX30102 (placa verde + sensor) —
    const max = new THREE.Group();
    max.add(board(1.9, 0, 1.6, 0x1d7a3a));
    const maxEye = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .1, 24), std(0x8a1f1f, .3, .4));
    maxEye.position.y = .12; max.add(maxEye);
    max.position.set(2.9, 1, -.4);
    max.rotation.set(.2, -.5, .12);
    root.add(max);

    // — Jumpers (VCC vermelho, GND preto, SCL verde, SDA azul/roxo) —
    const wires = new THREE.Group();
    function wire(from, to, color) {
      const mid1 = from.clone().lerp(to, .35); mid1.y += .9;
      const mid2 = from.clone().lerp(to, .7); mid2.y += .9;
      const curve = new THREE.CatmullRomCurve3([from, mid1, mid2, to]);
      wires.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, .045, 8), std(color, .5, .1)));
    }
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    wire(V(-.6, -1.3, .9), V(-3.3, 1.1, .1), 0xd43a2f);   // VCC
    wire(V(-.3, -1.3, .9), V(-3.1, 1.1, -.3), 0x222222);  // GND
    wire(V(0, -1.3, .9), V(-2.9, 1.1, -.6), 0x2fae5f);    // SCL
    wire(V(.3, -1.3, .9), V(-2.7, 1.1, -.9), 0x3b6fe0);   // SDA
    wire(V(.6, -1.3, .9), V(2.5, 1.1, -.2), 0xd43a2f);    // VIN
    wire(V(.9, -1.3, .9), V(2.7, 1.1, -.6), 0x222222);    // GND
    wire(V(1.2, -1.3, .9), V(2.9, 1.1, -.9), 0x2fae5f);   // SCL
    root.add(wires);

    const groups = [d1, mpu, max, root];
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc8f04a, 1.1);
    rim.position.set(-5, -2, -4);
    scene.add(rim);

    let focus = -1;
    window.__collarFocus = i => { focus = i; };
    function size() {
      const w = mount.clientWidth || 600, h = mount.clientHeight || 420;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    size(); addEventListener("resize", size);
    let dragX = 0, px = 0, dragging = false;
    mount.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; mount.setPointerCapture(e.pointerId); });
    mount.addEventListener("pointermove", e => { if (dragging) { dragX += (e.clientX - px) * .01; px = e.clientX; } });
    mount.addEventListener("pointerup", () => dragging = false);
    const sec = document.getElementById("coleira3d");
    let scrollSpin = 0;
    addEventListener("scroll", () => {
      const r = sec.getBoundingClientRect();
      scrollSpin = Math.min(1, Math.max(0, 1 - r.top / innerHeight)) * Math.PI * 1.5;
    }, { passive: true });
    const clock = new THREE.Clock();
    (function loop() {
      const t = clock.getElapsedTime();
      if (!dragging) dragX += .0032;
      root.rotation.y = dragX + scrollSpin;
      root.position.y = Math.sin(t * .8) * .1;
      groups.forEach((g, i) => {
        const on = focus === -1 ? false : (i === 3 ? true : i === focus);
        g.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = on ? .55 : 0; });
      });
      renderer.render(scene, cam);
      requestAnimationFrame(loop);
    })();
    showStep(0);
  }
  boot().catch(() => { mount.style.display = "none"; fallback.style.display = ""; showStep(0); });
})();
