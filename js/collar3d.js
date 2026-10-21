// Coleira 3D — a peça real do DataBov: caixa impressa em 3D, fita de nylon e fivela.
// Gira com scroll e arrasto; os passos destacam cada parte (a radiografia mostra o interior).
(function () {
  const mount = document.getElementById("collar3d");
  const fallback = document.getElementById("collarFallback");
  const title = document.getElementById("stepTitle");
  const desc = document.getElementById("stepDesc");
  const chips = [...document.querySelectorAll("#collarSteps .chip")];
  const STEPS = [
    ["Caixa", "Impressa em 3D, preta, fechada contra poeira e água. Logo DataBov de alta visibilidade no campo."],
    ["Sensores", "MPU6050 (IMU 6 eixos) e MAX30102 (oximetria e frequência cardíaca) no mesmo barramento I2C. A radiografia mostra o interior."],
    ["Fita e fivela", "Fita de nylon 25mm com fivela de liberação rápida: coloca e tira em segundos, ajuste na hora no curral."],
    ["Bateria", "Duas células 18650 em paralelo (1S2P) com carregador TP4056 — dias de autonomia sem recarregar."],
  ];
  const CHIP_TXT = ["1 · Caixa", "2 · Sensores", "3 · Fita e fivela", "4 · Bateria"];
  function showStep(i) {
    chips.forEach((c, j) => { c.classList.toggle("on", j === i); c.textContent = CHIP_TXT[j]; });
    title.textContent = (i + 1) + " · " + STEPS[i][0];
    desc.textContent = STEPS[i][1];
    if (window.__collarFocus) window.__collarFocus(i);
  }
  chips.forEach((c, i) => (c.onclick = () => showStep(i)));

  async function boot() {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, .1, 100);
    cam.position.set(0, 1.6, 11.5);
    cam.lookAt(0, .5, 0);
    const renderer = new THREE.WebGLRenderer({ canvas: mount, alpha: true, antialias: true });
    const root = new THREE.Group();
    scene.add(root);
    const std = (c, r = .5, m = .3) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

    // ---------- helpers ----------
    // caixa com cantos arredondados (impressão 3D)
    function roundedBox(w, h, d, ra = .18, bevel = .06) {
      const s = new THREE.Shape();
      const x = -w / 2, y = -h / 2, r = Math.min(ra, w / 2 - .01, h / 2 - .01);
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      const g = new THREE.ExtrudeGeometry(s, {
        depth: d - bevel * 2, bevelEnabled: true, bevelSize: bevel,
        bevelThickness: bevel, bevelSegments: 3, curveSegments: 12,
      });
      g.center();
      return g;
    }
    // fita: ribbon achatado seguindo uma curva
    function ribbon(pts, largura = 1.25, espess = .09) {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
      const s = new THREE.Shape();
      s.moveTo(-espess / 2, -largura / 2); s.lineTo(espess / 2, -largura / 2);
      s.lineTo(espess / 2, largura / 2); s.lineTo(-espess / 2, largura / 2); s.closePath();
      return new THREE.ExtrudeGeometry(s, { extrudePath: curve, steps: 90, bevelEnabled: false });
    }

    // ---------- 1. CAIXA (preta, 3D impressa) ----------
    const caixa = new THREE.Group();
    const W = 3.8, H = 2.8, D = .72;
    const corpo = new THREE.Mesh(roundedBox(W, H, D, .22, .07), std(0x141414, .88, .05));
    caixa.add(corpo);
    // relevo das bordas (camadas de impressão)
    for (let i = 0; i < 3; i++) {
      const linha = new THREE.Mesh(roundedBox(W - .02 - i * .012, H - .02 - i * .012, D - .02, .22, .03),
        std(0x1d1d1d, .95, .02));
      linha.position.z = .001 * i;
      caixa.add(linha);
    }
    // logo impresso
    const tex = new THREE.TextureLoader().load("assets/collar-logo.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    const logoMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .96 });
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.85), logoMat);
    logo.position.set(.05, .12, D / 2 + .012);
    caixa.add(logo);
    // 4 parafusos
    const screwMat = std(0x2a2a2a, .55, .55);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .07, 16), screwMat);
      sc.rotation.x = Math.PI / 2;
      sc.position.set(sx * (W / 2 - .28), sy * (H / 2 - .26), D / 2 + .01);
      caixa.add(sc);
    }
    // furos de passagem da fita (lados)
    for (const sx of [-1, 1]) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(.12, .8, D + .04), std(0x000000, 1, 0));
      slot.position.set(sx * (W / 2), -.55, 0);
      caixa.add(slot);
    }
    caixa.position.set(0, 0, 0);
    caixa.rotation.set(-.12, .34, .05);
    root.add(caixa);

    // ---------- 2. INTERNO (MPU6050 + MAX30102) ----------
    const interno = new THREE.Group();
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, .08), std(0x1a56c9, .6, .15));
    pcb.rotation.x = Math.PI / 2; interno.add(pcb);
    const imu = new THREE.Mesh(new THREE.BoxGeometry(.42, .42, .12), std(0x141414, .4, .6));
    imu.position.set(-.35, .12, 0); imu.rotation.x = Math.PI / 2; interno.add(imu);
    const max = new THREE.Mesh(new THREE.BoxGeometry(.75, .55, .12), std(0x1d7a3a, .55, .15));
    max.position.set(.5, -.05, 0); max.rotation.x = Math.PI / 2; interno.add(max);
    const olho = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .08, 20), std(0x8a1f1f, .3, .4));
    olho.position.set(.5, -.05, .1); interno.add(olho);
    interno.position.set(0, .1, 0);
    interno.rotation.set(-.12, .34, .05);
    root.add(interno);

    // ---------- 3. BATERIA (18650 em paralelo) ----------
    const bateria = new THREE.Group();
    const cellMat = std(0xb08b2a, .45, .6);
    for (const dx of [-.42, .42]) {
      const cell = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.9, 24), cellMat);
      cell.rotation.z = Math.PI / 2; cell.position.set(dx, 0, 0);
      bateria.add(cell);
    }
    const tp = new THREE.Mesh(new THREE.BoxGeometry(.9, .6, .08), std(0x1d7a3a, .6, .15));
    tp.position.set(0, .75, 0); tp.rotation.x = Math.PI / 2; bateria.add(tp);
    bateria.position.set(0, .1, 0);
    bateria.rotation.set(-.12, .34, .05);
    root.add(bateria);

    // ---------- 4. FITA + FIVELA ----------
    const fita = new THREE.Group();
    const webbing = std(0x121212, .92, .02);
    // lado direito: da caixa até a fivela
    const dir = new THREE.Mesh(ribbon([
      [1.85, -.55, 0], [2.8, -.7, .25], [3.6, .0, .2], [3.9, 1.0, -.1], [3.55, 1.75, -.25], [2.7, 1.95, -.2],
    ]), webbing);
    fita.add(dir);
    // lado esquerdo: da caixa, contornando
    const esq = new THREE.Mesh(ribbon([
      [-1.85, -.55, 0], [-2.9, -.75, .3], [-3.7, .0, .25], [-3.95, 1.1, -.1], [-3.3, 1.95, -.25], [-2.2, 2.1, -.2],
    ]), webbing);
    fita.add(esq);
    // fivela de liberação rápida
    const fivela = new THREE.Group();
    const corpoFiv = new THREE.Mesh(roundedBox(1.05, .78, .42, .1, .04), std(0x1b1b1b, .7, .08));
    fivela.add(corpoFiv);
    const fenda = new THREE.Mesh(new THREE.BoxGeometry(1.1, .16, .46), std(0x000000, 1, 0));
    fenda.position.y = -.06; fivela.add(fenda);
    fivela.position.set(2.75, 2.02, -.2);
    fivela.rotation.set(.1, -.35, .12);
    fita.add(fivela);
    // passador de ajuste
    const passador = new THREE.Mesh(roundedBox(.55, .42, .22, .06, .03), std(0x242424, .75, .06));
    passador.position.set(-3.55, .95, .1);
    passador.rotation.set(.2, .5, .3);
    fita.add(passador);
    fita.rotation.set(-.06, 0, 0);
    root.add(fita);

    // ---------- luzes ----------
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(4, 6, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc8f04a, 1.25);
    rim.position.set(-6, -1, -4); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, .7);
    fill.position.set(-3, 3, 4); scene.add(fill);

    // grupos na ordem dos passos
    const groups = [caixa, interno, fita, bateria];
    const nomes = ["caixa", "interno", "fita", "bateria"];

    let focus = -1;
    window.__collarFocus = i => {
      focus = i;
      // passo 2 = radiografia: a caixa fica translúcida e o interior aparece
      const xray = i === 1;
      corpo.material.transparent = xray;
      corpo.material.opacity = xray ? .17 : 1;
      corpo.material.depthWrite = !xray;
      logoMat.opacity = xray ? .1 : .96;
      logo.visible = !xray;
      interno.visible = xray;
      bateria.visible = xray;
    };

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
      if (!dragging) dragX += .003;
      root.rotation.y = dragX + scrollSpin;
      root.position.y = Math.sin(t * .7) * .09 - .3;
      groups.forEach((g, i) => {
        const on = focus === i;
        g.traverse(o => {
          if (o.isMesh && o.material && o.material.emissive) {
            o.material.emissiveIntensity = on ? .38 : 0;
          }
        });
      });
      renderer.render(scene, cam);
      requestAnimationFrame(loop);
    })();
    showStep(0);
  }
  boot().catch(() => { mount.style.display = "none"; fallback.style.display = ""; showStep(0); });
})();
