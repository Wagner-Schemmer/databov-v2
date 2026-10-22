// Caixa da coleira DataBov em 3D — a peça real: caixa impressa em 3D com o logo.
// Gira sozinho, e também com arrasto do mouse e com a rolagem da página.
(function () {
  const mount = document.getElementById("collar3d");
  const fallback = document.getElementById("collarFallback");

  async function boot() {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, .1, 100);
    cam.position.set(0, .2, 5.9);
    cam.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas: mount, alpha: true, antialias: true });
    const root = new THREE.Group();
    scene.add(root);
    const std = (c, r = .5, m = .3) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

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

    // ---------- CAIXA (preta, 3D impressa) ----------
    const caixa = new THREE.Group();
    const W = 3.8, H = 2.8, D = .72;
    const corpo = new THREE.Mesh(roundedBox(W, H, D, .22, .07), std(0x171717, .82, .06));
    caixa.add(corpo);
    // relevo das bordas (camadas de impressão)
    for (let i = 0; i < 3; i++) {
      const linha = new THREE.Mesh(roundedBox(W - .02 - i * .012, H - .02 - i * .012, D - .02, .22, .03),
        std(0x272727, .92, .03));
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
    caixa.rotation.set(-.1, .2, .04);
    root.add(caixa);

    // ---------- luzes ----------
    scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(4, 6, 7); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc8f04a, 1.5);
    rim.position.set(-6, -1, -5); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, .8);
    fill.position.set(-4, 3, 5); scene.add(fill);
    // foco suave no logo (frente da caixa)
    const spot = new THREE.PointLight(0xffffff, 7, 12, 2);
    spot.position.set(.4, 1.2, 3.6); scene.add(spot);

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
      root.position.y = Math.sin(t * .7) * .09;
      renderer.render(scene, cam);
      requestAnimationFrame(loop);
    })();
  }
  boot().catch(() => {
    mount.style.display = "none";
    if (fallback) fallback.style.display = "";
  });
})();
