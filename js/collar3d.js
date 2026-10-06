// Coleira 3D interativa — gira com o scroll e por arrasto; passos destacam módulos.
// Fallback: se o CDN falhar, mostra os cards estáticos.
(function () {
  const mount = document.getElementById("collar3d");
  const fallback = document.getElementById("collarFallback");
  const title = document.getElementById("stepTitle");
  const desc = document.getElementById("stepDesc");
  const chips = [...document.querySelectorAll("#collarSteps .chip")];
  const STEPS = [
    ["Sensor", "IMU 6 eixos + temperatura infravermelha captam cada movimento, 24h no pescoço."],
    ["Inteligência", "A IA classifica ruminação, alimentação, descanso, atividade e cio no padrão do próprio animal."],
    ["Alerta", "Cio, doença e estresse térmico chegam no dashboard e no celular, na hora."],
    ["Certificação", "Tudo vira o índice de bem-estar 1–5, auditável para o mercado."],
  ];
  function showStep(i) {
    chips.forEach((c, j) => c.classList.toggle("on", j === i));
    title.textContent = (i + 1) + " · " + STEPS[i][0];
    desc.textContent = STEPS[i][1];
    if (window.__collarFocus) window.__collarFocus(i);
  }
  chips.forEach((c, i) => c.onclick = () => showStep(i));

  async function boot() {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, .1, 100);
    cam.position.set(0, 1.4, 7.2);
    cam.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas: mount, alpha: true, antialias: true });
    const group = new THREE.Group();
    scene.add(group);
    const matBand = new THREE.MeshStandardMaterial({ color: 0x123f2a, roughness: .55, metalness: .25 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(2.1, .42, 24, 72), matBand);
    band.rotation.x = Math.PI / 2.15;
    group.add(band);
    const mods = [];
    const cols = [0xc8f04a, 0x34d399, 0xfbbf24, 0xffffff];
    STEPS.forEach((_, i) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(.3, 24, 24),
        new THREE.MeshStandardMaterial({ color: cols[i], emissive: cols[i], emissiveIntensity: .25, roughness: .3 })
      );
      const a = (i / STEPS.length) * Math.PI * 2 + .6;
      m.position.set(Math.cos(a) * 2.1, .5, Math.sin(a) * 2.1);
      m.userData.i = i;
      group.add(m); mods.push(m);
    });
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc8f04a, 1.2);
    rim.position.set(-5, -2, -4);
    scene.add(rim);
    let focus = -1, auto = true, dragX = 0;
    window.__collarFocus = i => { focus = i; };
    function size() {
      const w = mount.clientWidth || 600, h = mount.clientHeight || 420;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    size(); addEventListener("resize", size);
    let px = 0, dragging = false;
    mount.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; mount.setPointerCapture(e.pointerId); });
    mount.addEventListener("pointermove", e => { if (dragging) { dragX += (e.clientX - px) * .01; px = e.clientX; } });
    mount.addEventListener("pointerup", () => dragging = false);
    const sec = document.getElementById("coleira3d");
    let scrollSpin = 0;
    addEventListener("scroll", () => {
      const r = sec.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, 1 - r.top / innerHeight));
      scrollSpin = p * Math.PI * 1.5;
    }, { passive: true });
    const clock = new THREE.Clock();
    (function loop() {
      const t = clock.getElapsedTime();
      if (!dragging && auto) dragX += .0035;
      group.rotation.y = dragX + scrollSpin;
      group.position.y = Math.sin(t * .8) * .12;
      mods.forEach((m, i) => {
        const on = i === focus;
        m.material.emissiveIntensity = on ? 1.4 : .25 + Math.sin(t * 2 + i) * .12;
        const s = on ? 1.5 : 1;
        m.scale.set(s, s, s);
      });
      renderer.render(scene, cam);
      requestAnimationFrame(loop);
    })();
    showStep(0);
  }
  boot().catch(() => { mount.style.display = "none"; fallback.style.display = ""; showStep(0); });
})();
