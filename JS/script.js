/* =========================================================
   ALPHA BROADCAST SERVICES — script.js
   ========================================================= */

// Troque aqui pelo número oficial (só números, com DDI e DDD)
const WHATSAPP_NUMBER = "552120105247";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------------------------------------------------------
   Estado de rolagem compartilhado (velocidade usada em várias animações)
   --------------------------------------------------------- */
const scrollState = { y: window.scrollY, lastY: window.scrollY, velocity: 0 };

/* =========================================================
   1. PRELOADER + entrada do hero
   ========================================================= */
(function preloader() {
  const el = $("#preloader");
  const count = $("#preloaderCount");
  const hero = $(".hero");
  document.body.classList.add("is-loading");

  const finish = () => {
    el.classList.add("is-done");
    document.body.classList.remove("is-loading");
    hero.classList.add("is-in");
    setTimeout(() => hero.classList.add("is-settled"), 1400);
    initReveal(); // só revela os blocos depois que o preloader sai
    setTimeout(() => $$("[data-scramble]").forEach(scrambleText), 300);
  };

  if (reduceMotion) { count.textContent = "100"; finish(); return; }

  let n = 0;
  const tick = () => {
    n += Math.random() * 14 + 4;
    if (n >= 100) { count.textContent = "100"; setTimeout(finish, 250); return; }
    count.textContent = Math.floor(n);
    setTimeout(tick, 70);
  };
  // espera a página carregar (ou no máximo 2.5s)
  let started = false;
  const start = () => { if (!started) { started = true; tick(); } };
  window.addEventListener("load", start);
  setTimeout(start, 2500);
})();

/* =========================================================
   2. Efeito "scramble" (texto embaralhando até formar a frase)
   ========================================================= */
function scrambleText(el) {
  const final = el.textContent;
  if (reduceMotion) return;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>";
  let frame = 0;
  const total = 34;
  const run = () => {
    const progress = frame / total;
    el.textContent = final
      .split("")
      .map((c, i) => {
        if (c === " " || c === "·") return c;
        return i / final.length < progress ? c : chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");
    frame++;
    if (frame <= total) requestAnimationFrame(run);
    else el.textContent = final;
  };
  run();
}

/* =========================================================
   3. Header (some ao descer, volta ao subir) + medidor lateral
   ========================================================= */
(function header() {
  const header = $("#header");
  const meterFill = $("#meterFill");
  const meterValue = $("#meterValue");
  const nav = $("#nav");

  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? y / max : 0;

    header.classList.toggle("is-scrolled", y > 40);
    if (!nav.classList.contains("is-open")) {
      header.classList.toggle("is-hidden", y > scrollState.lastY && y > 400);
    }

    meterFill.style.height = progress * 100 + "%";
    scrollState.lastY = y;
  };

  // o valor "HZ" sobe com a velocidade de rolagem e volta para 120
  let shown = 120;
  const loop = () => {
    const target = 120 + Math.min(Math.abs(scrollState.velocity) * 4, 360);
    shown += (target - shown) * 0.12;
    meterValue.textContent = Math.round(shown);
    requestAnimationFrame(loop);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
  loop();
})();

/* velocidade de rolagem suavizada */
(function trackVelocity() {
  let last = window.scrollY;
  const loop = () => {
    const y = window.scrollY;
    scrollState.velocity += (y - last - scrollState.velocity) * 0.2;
    last = y;
    requestAnimationFrame(loop);
  };
  loop();
})();

/* =========================================================
   4. Menu mobile
   ========================================================= */
(function mobileMenu() {
  const burger = $("#burger");
  const nav = $("#nav");

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("#header").classList.remove("is-hidden");
  };

  burger.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
  window.addEventListener("resize", () => window.innerWidth > 860 && setOpen(false));
})();

/* =========================================================
   5. Link ativo do menu conforme a seção visível
   ========================================================= */
(function activeLinks() {
  const links = $$(".nav__link");
  const sections = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => io.observe(s));
})();

/* =========================================================
   6. Revelar elementos ao rolar (com efeito cascata)
   ========================================================= */
function initReveal() {
  const items = $$(".reveal");
  if (reduceMotion) { items.forEach((el) => el.classList.add("is-visible")); return; }

  // dá um atraso crescente para irmãos que entram juntos
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = siblings.indexOf(el) * 0.09 + "s";
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/* =========================================================
   7. Onda de sinal animada no hero (canvas)
   - reage à velocidade de rolagem e ao mouse
   - clique no hero dispara um pulso
   ========================================================= */
(function signalWave() {
  const canvas = $("#wave");
  const hero = $(".hero");
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  const pulses = [];
  let mouseX = -9999, t = 0, energy = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // pulsos automáticos, tipo batimento de sinal
  const spawn = (x, power = 1) => pulses.push({ x, power, life: 1 });
  let autoTimer = 0;

  const ecg = (dx) => {
    // formato de "pico" parecido com o da referência
    const a = Math.exp(-((dx + 34) ** 2) / 260) * 0.9;
    const b = -Math.exp(-((dx) ** 2) / 90) * 1.4;
    const c = Math.exp(-((dx - 40) ** 2) / 500) * 0.5;
    return a + b + c;
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const mid = h * 0.55;
    energy += (Math.min(Math.abs(scrollState.velocity) / 40, 1) - energy) * 0.08;

    // linhas: uma forte e duas de "eco"
    const layers = [
      { amp: 1, alpha: 1, width: 1.6, color: "34,197,94", offset: 0 },
      { amp: 0.55, alpha: 0.35, width: 1, color: "142,240,12", offset: 0.6 },
      { amp: 0.3, alpha: 0.18, width: 1, color: "34,197,94", offset: 1.4 },
    ];

    layers.forEach((L) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        let y = 0;
        // ruído leve
        y += Math.sin(x * 0.012 + t * 1.4 + L.offset) * (3 + energy * 18);
        y += Math.sin(x * 0.031 - t * 2.1) * (1.5 + energy * 8);
        // pulsos
        pulses.forEach((p) => {
          const dx = x - p.x;
          if (Math.abs(dx) < 160) y += ecg(dx) * 60 * p.power * p.life;
        });
        // mouse por perto aumenta a amplitude
        const md = Math.abs(x - mouseX);
        if (md < 180) y += Math.sin(x * 0.08 + t * 6) * (1 - md / 180) * 16;

        const py = mid + y * L.amp;
        x === 0 ? ctx.moveTo(x, py) : ctx.lineTo(x, py);
      }
      ctx.strokeStyle = `rgba(${L.color},${L.alpha})`;
      ctx.lineWidth = L.width;
      ctx.shadowColor = `rgba(${L.color},${L.alpha})`;
      ctx.shadowBlur = L.alpha > 0.5 ? 12 : 0;
      ctx.stroke();
    });

    // pulsos andam para a direita e somem
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.x += 2.2 + energy * 6;
      p.life -= 0.0025;
      if (p.x > w + 200 || p.life <= 0) pulses.splice(i, 1);
    }

    autoTimer -= 1;
    if (autoTimer <= 0) { spawn(-150, 0.8 + Math.random() * 0.5); autoTimer = 90 + Math.random() * 80; }

    t += 0.016;
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);

  if (reduceMotion) {
    // desenha uma linha estática
    spawn(w * 0.2); spawn(w * 0.5); spawn(w * 0.8);
    ctx.strokeStyle = "rgba(34,197,94,.9)";
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      let y = 0;
      pulses.forEach((p) => { const dx = x - p.x; if (Math.abs(dx) < 160) y += ecg(dx) * 60; });
      x === 0 ? ctx.moveTo(x, h * 0.55 + y) : ctx.lineTo(x, h * 0.55 + y);
    }
    ctx.stroke();
    return;
  }

  hero.addEventListener("mousemove", (e) => { mouseX = e.clientX - canvas.getBoundingClientRect().left; });
  hero.addEventListener("mouseleave", () => { mouseX = -9999; });
  hero.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    spawn(e.clientX - canvas.getBoundingClientRect().left, 1.8);
  });
  [w * 0.1, w * 0.45, w * 0.75].forEach((x) => spawn(x, 1));
  draw();
})();

/* =========================================================
   8. Parallax da foto do hero
   ========================================================= */
(function parallax() {
  if (reduceMotion) return;
  const photo = $(".hero__photo");
  const content = $(".hero__content");
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      photo.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(${1 + y * 0.0002})`;
      content.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      content.style.opacity = Math.max(1 - y / (window.innerHeight * 0.8), 0);
    },
    { passive: true }
  );
})();

/* =========================================================
   9. Acordeões (serviços e FAQ) com altura animada
   ========================================================= */
function animateHeight(el, open) {
  const start = el.getBoundingClientRect().height;
  el.style.height = "auto";
  const end = open ? el.scrollHeight : 0;
  el.style.height = start + "px";
  el.offsetHeight; // força o navegador a aplicar a altura inicial
  el.style.height = end + "px";
  const done = (e) => {
    if (e.propertyName !== "height") return;
    if (open) el.style.height = "auto";
    el.removeEventListener("transitionend", done);
  };
  el.addEventListener("transitionend", done);
}

function setupAccordion(itemSel, headSel, bodySel) {
  const items = $$(itemSel);
  items.forEach((item) => {
    const head = $(headSel, item);
    const body = $(bodySel, item);
    if (!item.classList.contains("is-open")) body.style.height = "0px";

    head.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      // fecha os outros
      items.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          $(headSel, other).setAttribute("aria-expanded", "false");
          animateHeight($(bodySel, other), false);
        }
      });
      item.classList.toggle("is-open", willOpen);
      head.setAttribute("aria-expanded", willOpen);
      animateHeight(body, willOpen);
    });
  });
}
setupAccordion(".service", ".service__head", ".service__body");
setupAccordion(".faq__item", ".faq__q", ".faq__a");

/* =========================================================
   10. Faixa de segmentos infinita
   - acelera conforme a velocidade da rolagem
   - pausa com o mouse em cima
   ========================================================= */
(function marquee() {
  $$(".marquee__row").forEach((row) => {
    const track = $(".marquee__track", row);
    // duplica o conteúdo até preencher bem a tela
    const original = track.outerHTML;
    while (row.scrollWidth < window.innerWidth * 2.5) row.insertAdjacentHTML("beforeend", original);
    $$(".marquee__track", row).forEach((t, i) => i > 0 && t.setAttribute("aria-hidden", "true"));

    const dir = row.dataset.direction === "right" ? 1 : -1;
    const trackW = track.getBoundingClientRect().width;
    let x = dir === 1 ? -trackW : 0;
    let paused = false;
    row.addEventListener("mouseenter", () => (paused = true));
    row.addEventListener("mouseleave", () => (paused = false));

    if (reduceMotion) return;
    const loop = () => {
      const speed = paused ? 0 : 0.6 + Math.min(Math.abs(scrollState.velocity) * 0.25, 10);
      x += speed * dir;
      if (dir === -1 && x <= -trackW) x += trackW;
      if (dir === 1 && x >= 0) x -= trackW;
      row.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    };
    loop();
  });
})();

/* =========================================================
   11. Contador numérico (24/7)
   ========================================================= */
(function counters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      reduceMotion ? (el.textContent = target) : requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => io.observe(el));
})();

/* =========================================================
   12. Cards com inclinação 3D e holofote seguindo o mouse
   ========================================================= */
(function cardTilt() {
  if (!finePointer || reduceMotion) return;
  $$(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
      card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => (card.style.transform = ""));
  });
})();

/* =========================================================
   13. Botões magnéticos + efeito ripple no clique
   ========================================================= */
(function buttons() {
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
    });
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn, .service__head, .chip span");
    if (!btn || reduceMotion) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - r.left - size / 2 + "px";
    ripple.style.top = e.clientY - r.top - size / 2 + "px";
    if (getComputedStyle(btn).position === "static") btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
})();

/* =========================================================
   14. Brilho verde que segue o cursor
   ========================================================= */
(function cursorGlow() {
  const glow = $("#cursorGlow");
  if (!finePointer || reduceMotion) { glow.remove(); return; }
  let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty;
  window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
  const loop = () => {
    x += (tx - x) * 0.1;
    y += (ty - y) * 0.1;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
})();

/* =========================================================
   15. Formulário → WhatsApp com mensagem pronta
   ========================================================= */
(function whatsForm() {
  const form = $("#whatsForm");
  const error = $("#formError");

  // "Solicitar orçamento" dos serviços já marca o tipo no formulário
  $$("[data-service]").forEach((link) =>
    link.addEventListener("click", () => {
      const value = link.dataset.service;
      const radio = $(`input[name="tipo"][value="${value}"]`, form);
      if (radio) radio.checked = true;
      setTimeout(() => $('input[name="nome"]', form).focus({ preventScroll: true }), 900);
    })
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = (data.get("nome") || "").trim();
    const nameField = $('input[name="nome"]', form).closest(".field");

    if (!nome) {
      nameField.classList.remove("has-error");
      void nameField.offsetWidth; // reinicia a animação de tremer
      nameField.classList.add("has-error");
      error.textContent = "Digite seu nome para abrir a conversa.";
      $('input[name="nome"]', form).focus();
      return;
    }
    nameField.classList.remove("has-error");
    error.textContent = "";

    const linhas = [
      `Olá, Alpha Broadcast! Meu nome é ${nome}.`,
      `Tipo de atendimento: ${data.get("tipo")}`,
      data.get("equipamento") && `Equipamento/estrutura: ${data.get("equipamento")}`,
      data.get("cidade") && `Cidade e prazo: ${data.get("cidade")}`,
    ].filter(Boolean);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(linhas.join("\n"))}`;
    showToast("Abrindo o WhatsApp com sua mensagem…");
    setTimeout(() => window.open(url, "_blank", "noopener"), 500);
  });
})();

/* =========================================================
   16. Toast, ano do rodapé e voltar ao topo
   ========================================================= */
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove("is-show"), 3000);
}

$("#year").textContent = new Date().getFullYear();
const goTop = () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
$("#toTop").addEventListener("click", goTop);

/* botão flutuante de voltar ao topo, com anel mostrando o progresso da página */
(function backTop() {
  const btn = $("#backTop");
  const ring = $("#backTopProgress");
  const length = 2 * Math.PI * 27;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    ring.style.strokeDashoffset = length * (1 - p);
    btn.classList.toggle("is-show", window.scrollY > window.innerHeight * 0.6);
  };
  btn.addEventListener("click", () => {
    btn.classList.remove("is-launch");
    void btn.offsetWidth;
    btn.classList.add("is-launch");
    goTop();
  });
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

/* =========================================================
   17. Botões de e-mail
   O link "mailto:" só funciona se o computador tiver um programa de
   e-mail configurado (Outlook, Mail...). Muita gente não tem, e aí o
   clique não faz nada. Por isso abrimos uma janelinha com opções.
   ========================================================= */
(function emailMenu() {
  const links = $$('a[href^="mailto:"]');
  if (!links.length) return;

  const ASSUNTO = "Contato pelo site - Alpha Broadcast";
  const enc = encodeURIComponent;

  const modal = document.createElement("div");
  modal.className = "mail-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "mailTitle");
  modal.innerHTML = `
    <div class="mail-modal__box">
      <button class="mail-modal__close" aria-label="Fechar">×</button>
      <p class="kicker kicker--plain">Enviar e-mail</p>
      <h3 id="mailTitle">Como você prefere enviar?</h3>
      <p class="mail-modal__addr"></p>
      <div class="mail-modal__opts">
        <a class="mail-opt" data-kind="gmail" target="_blank" rel="noopener"><b>Gmail</b><span>Abre no navegador</span></a>
        <a class="mail-opt" data-kind="outlook" target="_blank" rel="noopener"><b>Outlook</b><span>Abre no navegador</span></a>
        <a class="mail-opt" data-kind="app"><b>App de e-mail</b><span>Do computador ou celular</span></a>
        <button class="mail-opt" data-kind="copy" type="button"><b>Copiar endereço</b><span>Para colar onde quiser</span></button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const addrEl = $(".mail-modal__addr", modal);
  let lastFocus = null;

  const open = (email) => {
    addrEl.textContent = email;
    $('[data-kind="gmail"]', modal).href = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(email)}&su=${enc(ASSUNTO)}`;
    $('[data-kind="outlook"]', modal).href = `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(email)}&subject=${enc(ASSUNTO)}`;
    $('[data-kind="app"]', modal).href = `mailto:${email}?subject=${enc(ASSUNTO)}`;
    $('[data-kind="copy"]', modal).dataset.email = email;
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".mail-opt", modal).focus(), 50);
  };
  const close = () => {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  links.forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      open(link.getAttribute("href").replace("mailto:", "").split("?")[0]);
    })
  );

  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  $(".mail-modal__close", modal).addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
  $$(".mail-opt", modal).forEach((opt) => opt.addEventListener("click", () => { if (opt.dataset.kind !== "copy") setTimeout(close, 200); }));

  $('[data-kind="copy"]', modal).addEventListener("click", async (e) => {
    const email = e.currentTarget.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // plano B para navegadores que bloqueiam a área de transferência
      const t = document.createElement("textarea");
      t.value = email; document.body.appendChild(t); t.select();
      document.execCommand("copy"); t.remove();
    }
    close();
    showToast("E-mail copiado: " + email);
  });
})();
