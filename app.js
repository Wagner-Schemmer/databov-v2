// DataBov v2 — interações premium
const $ = id => document.getElementById(id);
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600); }

// menu mobile + reveal + relógio + barra de progresso + voltar ao topo
document.querySelectorAll('a[href="#topo"],#toTop').forEach((a) => {
  a.addEventListener("click", (e) => {
    const el = document.getElementById("inicio") || document.getElementById("topo");
    if (!el) return;
    e.preventDefault();
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      window.scrollTo(0, 0);
    }
  });
});
$("menuBtn").onclick = () => $("navLinks").classList.toggle("open");
$("navLinks").querySelectorAll("a").forEach(a => a.onclick = () => $("navLinks").classList.remove("open"));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));
setInterval(() => { $("dashClock").textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }, 1000);
addEventListener("scroll", () => {
  const h = document.documentElement;
  $("pbar").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%";
}, { passive: true });

// ---------- ROI ----------
const BRL = v => "R$ " + Math.round(v).toLocaleString("pt-BR");
function roi() {
  const q = +$("inQ").value, d = +$("inD").value;
  const cio = +$("inCio").value, cd = +$("inCd").value;
  $("vN").textContent = $("inN").value;
  $("vCio").textContent = BRL(cio); $("vQ").textContent = q;
  $("vD").textContent = d; $("vCd").textContent = BRL(cd);
  const ciosRec = Math.round(q * 0.6), casosEv = Math.round(d * 0.6);
  $("roiVal").textContent = BRL(ciosRec * cio + casosEv * cd) + "/ano";
  $("roiDetail").textContent = `${ciosRec} cios recuperados + ${casosEv} casos antecipados`;
}
["inN", "inCio", "inQ", "inD", "inCd"].forEach(id => $(id).addEventListener("input", roi));
roi();

// ---------- Dashboard mock: dial + chart animado ----------
(function () {
  const arc = $("dialArc"), C = 327;
  let s = 0; const target = 4.6 / 5;
  const t = setInterval(() => { s += .02; if (s >= target) { s = target; clearInterval(t); }
    arc.style.strokeDashoffset = C * (1 - s); $("dialNum").textContent = (s * 5).toFixed(1); }, 40);
  const cv = $("dashChart"), ctx = cv.getContext("2d");
  const data = Array(90).fill(1);
  function frame() {
    data.shift();
    const r = Math.random();
    data.push(1 + Math.sin(Date.now() / 900) * .5 + (r > .93 ? 1.6 : r * .4));
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#1d3a28"; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(cv.width, 60); ctx.stroke();
    ctx.strokeStyle = "#c8f04a"; ctx.lineWidth = 2; ctx.beginPath();
    data.forEach((v, i) => { const x = i / (data.length - 1) * cv.width, y = 150 - v * 38; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.lineWidth = 1;
    requestAnimationFrame(frame);
  }
  frame();
})();

// ---------- Demo acelerômetro ----------
(function () {
  const B = {
    ruminando: { f: "~0,9 Hz", e: "baixa", a: "nenhum", amp: .5, fr: 900 },
    comendo: { f: "~1,4 Hz", e: "média", a: "nenhum", amp: 1, fr: 500 },
    andando: { f: "~2,1 Hz", e: "alta", a: "nenhum", amp: 1.6, fr: 320 },
    cio: { f: "rajadas 3–5 Hz", e: "muito alta", a: "CIO — inseminar!", amp: 2.6, fr: 180 },
    repouso: { f: "~0,2 Hz", e: "mínima", a: "nenhum", amp: .2, fr: 2000 },
  };
  let cur = "ruminando";
  const cv = $("accel-chart"), ctx = cv.getContext("2d");
  const data = Array(120).fill(0);
  document.querySelectorAll("#behavior-buttons .chip").forEach(b => b.onclick = () => {
    cur = b.dataset.behavior;
    document.querySelectorAll("#behavior-buttons .chip").forEach(x => x.classList.toggle("on", x === b));
    const m = B[cur];
    $("current-behavior").textContent = cur; $("dominant-freq").textContent = m.f;
    $("signal-energy").textContent = m.e; $("alert-state").textContent = m.a;
  });
  (function frame() {
    const m = B[cur];
    data.shift();
    data.push(Math.sin(Date.now() / m.fr) * m.amp + Math.sin(Date.now() / (m.fr / 3.7)) * m.amp * .5 + (Math.random() - .5) * .3);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#f87171"; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(cv.width, 40); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#c8f04a"; ctx.lineWidth = 2; ctx.beginPath();
    data.forEach((v, i) => { const x = i / (data.length - 1) * cv.width, y = 130 - v * 32; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.lineWidth = 1;
    requestAnimationFrame(frame);
  })();
})();

// ---------- Lead → Supabase (fallback WhatsApp) ----------
$("leadForm").addEventListener("submit", async e => {
  e.preventDefault();
  const nome = $("lNome").value.trim(), email = $("lEmail").value.trim();
  const whatsapp = $("lWa").value.replace(/\D/g, ""), perfil = $("lPerfil").value;
  const rebanho = +$("lRebanho").value || 0;
  if (nome.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("leadMsg").textContent = "Confere nome e e-mail."; return; }
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.supabase) || {};
  const done = () => { $("leadMsg").textContent = "Recebido! Falamos em até 1 dia útil. ✔"; e.target.reset(); toast("Demonstração solicitada!"); };
  if (!cfg.url || !cfg.anonKey) return waFallback();
  try {
    const r = await fetch(`${cfg.url}/rest/v1/leads`, {
      method: "POST",
      headers: { apikey: cfg.anonKey, Authorization: "Bearer " + cfg.anonKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ nome, email, whatsapp, perfil, rebanho })
    });
    if (!r.ok) throw 0;
    done();
  } catch { waFallback(); }
  function waFallback() {
    const txt = encodeURIComponent(`Olá! Quero uma demonstração DataBov.\nNome: ${nome}\nPerfil: ${perfil}\nRebanho: ${rebanho} animais`);
    window.open("https://wa.me/5555997302586?text=" + txt, "_blank");
    $("leadMsg").textContent = "Abrimos seu WhatsApp — é só enviar! ✔";
  }
});

// float WhatsApp usa o número comercial configurado
(function () {
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.supabase) || {};
  const num = "5555997302586";
  $("floatWa").href = `https://wa.me/${num}?text=${encodeURIComponent("Olá! Quero uma demonstração DataBov.")}`;
  if (!cfg.url) return;
  fetch(`${cfg.url}/rest/v1/app_config?select=chave,valor`, { headers: { apikey: cfg.anonKey, Authorization: "Bearer " + cfg.anonKey } })
    .then(r => r.json()).then(rows => {
      if (!Array.isArray(rows)) return;
      const c = Object.fromEntries(rows.map(r => [r.chave, r.valor]));
      if (/^\d{10,13}$/.test(c.whatsapp_comercial || "")) {
        $("floatWa").href = `https://wa.me/${c.whatsapp_comercial}?text=${encodeURIComponent("Olá! Quero uma demonstração DataBov.")}`;
      }
    }).catch(() => {});
})();
$("year") && ($("year").textContent = new Date().getFullYear());
