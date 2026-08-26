// ==========================================
// 0. FONDO — ESFERA DE NODOS (animación distinta a las demás páginas)
// ==========================================
(function initNodeGlobe() {
  const canvas = document.getElementById("node-globe");
  const ctx = canvas.getContext("2d");
  let width, height, cx, cy;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FOCAL = 480;

  let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cx = width / 2;
    cy = height * 0.42;
  }

  function rotateY(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
  }
  function rotateX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }
  function project(p) {
    const scale = FOCAL / (FOCAL + p.z + 300);
    return { x: cx + p.x * scale, y: cy + p.y * scale, scale };
  }

  /* Esfera formada por varios "anillos" concéntricos de puntos,
     igual que la referencia: círculos superpuestos con distinta
     inclinación, dando la ilusión de un globo de nodos. */
  let rings = [];

  function initRings() {
    rings = [];
    const ringCount = 9;
    for (let r = 0; r < ringCount; r++) {
      const radius = 130 + r * 26;
      const tilt = (r / ringCount) * Math.PI;
      const dots = 46;
      const pts = [];
      for (let i = 0; i < dots; i++) {
        const a = (i / dots) * Math.PI * 2;
        let p = { x: Math.cos(a) * radius, y: 0, z: Math.sin(a) * radius };
        p = rotateX(p, tilt);
        pts.push(p);
      }
      rings.push(pts);
    }
  }

  function drawGlobe(t) {
    ctx.clearRect(0, 0, width, height);

    tiltX += (targetTiltX - tiltX) * 0.04;
    tiltY += (targetTiltY - tiltY) * 0.04;

    const spin = t * 0.00012;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    rings.forEach((ring, ringIdx) => {
      const proj = ring.map((p) => {
        let q = rotateY(p, spin);
        q = rotateX(q, tiltY * 0.4);
        q = rotateY(q, tiltX * 0.4);
        return project(q);
      });

      ctx.strokeStyle = "rgba(34, 229, 197, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      proj.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.globalAlpha = 0.35;
      ctx.stroke();

      proj.forEach((p) => {
        ctx.globalAlpha = 0.75 * p.scale;
        ctx.beginPath();
        ctx.fillStyle = ringIdx % 3 === 0 ? "#22e5c5" : ringIdx % 3 === 1 ? "#3A64FF" : "#8b6bff";
        ctx.arc(p.x, p.y, 1.8 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Núcleo brillante
    const pulse = 1 + Math.sin(t * 0.0018) * 0.15;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90 * pulse);
    grad.addColorStop(0, "rgba(34,229,197,0.55)");
    grad.addColorStop(1, "transparent");
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 90 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Estrellas de fondo sutiles
    if (!prefersReducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + t * 0.01) % width;
        const sy = (i * 53) % height;
        ctx.globalAlpha = 0.15 + 0.15 * Math.sin(t * 0.002 + i);
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      ctx.restore();
    }

    requestAnimationFrame(drawGlobe);
  }

  window.addEventListener("resize", () => { resize(); initRings(); });
  window.addEventListener("mousemove", (e) => {
    targetTiltX = ((e.clientX / window.innerWidth) - 0.5) * 1.4;
    targetTiltY = ((e.clientY / window.innerHeight) - 0.5) * 1.4;
  });

  resize();
  initRings();
  requestAnimationFrame(drawGlobe);
})();

// ==========================================
// 1. MENÚ (móvil)
// ==========================================
const menuBtn = document.getElementById("menuBtn");
const menuLateral = document.getElementById("menuLateral");
const menuOverlay = document.getElementById("menuOverlay");

menuBtn.addEventListener("click", () => {
  menuLateral.classList.toggle("active");
  menuOverlay.classList.toggle("active");
});
menuOverlay.addEventListener("click", () => {
  menuLateral.classList.remove("active");
  menuOverlay.classList.remove("active");
});
document.querySelectorAll(".menu-lateral a").forEach((a) => {
  a.addEventListener("click", () => {
    menuLateral.classList.remove("active");
    menuOverlay.classList.remove("active");
  });
});

// ==========================================
// 2. REVELADO DE SECCIONES AL HACER SCROLL
// ==========================================
const sections = document.querySelectorAll(".section");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        sectionObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
sections.forEach((s) => sectionObserver.observe(s));

// ==========================================
// 2.1 TRANSICIONES DEL FORMULARIO (estilo del video)
// ==========================================
// Al volver a la sección, reinicia la entrada escalonada del formulario.
const loginDemo = document.querySelector(".login-demo");
const practicaSection = document.getElementById("practica");
if (loginDemo && practicaSection) {
  const loginObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loginDemo.classList.remove("replay-login");
        void loginDemo.offsetWidth;
        loginDemo.classList.add("replay-login");
      }
    },
    { threshold: 0.35 }
  );
  loginObserver.observe(practicaSection);
}

// ==========================================
// 2.2 ACCESO CON ESCANEO FACIAL (demo local)
// ==========================================
// La cámara se procesa únicamente en el navegador: no se guarda ni se envía
// ninguna imagen. FaceDetector se usa cuando el navegador lo ofrece; en otros
// navegadores se mantiene la verificación visual de cámara como compatibilidad.
(function initFaceGate() {
  const auth = document.getElementById("faceAuth");
  const video = document.getElementById("faceVideo");
  const scanBtn = document.getElementById("faceScanBtn");
  const status = document.getElementById("faceStatus");
  const hint = document.getElementById("faceHint");
  const fields = [
    document.getElementById("loginUser"),
    document.getElementById("loginPass"),
  ];
  const submit = document.querySelector(".login-demo__btn");
  if (!auth || !video || !scanBtn || !submit) return;

  let stream = null;
  let detector = null;
  let scanning = false;

  function unlock(message) {
    scanning = false;
    auth.classList.remove("is-scanning");
    auth.classList.add("is-verified");
    status.textContent = "✓ Rostro verificado";
    hint.textContent = message || "Formulario desbloqueado. Ya puedes iniciar sesión.";
    scanBtn.textContent = "✓ Verificación completada";
    fields.forEach((field) => { field.disabled = false; });
    submit.disabled = false;
    if (stream) stream.getTracks().forEach((track) => track.stop());
  }

  async function scanFace() {
    if (scanning) return;
    scanning = true;
    auth.classList.add("is-scanning");
    status.textContent = "Escaneando rostro…";
    hint.textContent = "Mira al centro y mantén la cara dentro del marco.";
    scanBtn.disabled = true;

    try {
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        video.srcObject = stream;
        auth.classList.add("has-camera");
        await video.play();
      }

      const started = performance.now();
      let found = false;
      while (performance.now() - started < 4500) {
        if ("FaceDetector" in window) {
          if (!detector) detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(video);
          found = faces.length > 0;
        } else {
          // Fallback visual para navegadores sin FaceDetector.
          found = video.readyState >= 2;
        }
        if (found) break;
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
      if (found) {
        unlock("Identidad confirmada localmente. La cámara ya puede cerrarse.");
      } else {
        throw new Error("No se detectó un rostro");
      }
    } catch (error) {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      stream = null;
      auth.classList.remove("is-scanning", "has-camera");
      status.textContent = "No se pudo completar el escaneo";
      hint.textContent = "Permite el acceso a la cámara, coloca tu rostro en el marco e inténtalo de nuevo.";
      scanBtn.textContent = "↻ Intentar de nuevo";
      scanBtn.disabled = false;
      scanning = false;
    }
  }

  scanBtn.addEventListener("click", scanFace);
})();

// ==========================================
// 3. CARRUSEL INFINITO — HERRAMIENTAS
// ==========================================
(function buildToolsMarquee() {
  const track = document.getElementById("toolsTrack");
  const tools = [
    " Java", " MySQL", " NetBeans", " Spring", " Git & GitHub",
    " VS Code", " Python", " JavaScript", " UML", " phpMyAdmin"
  ];
  const full = [...tools, ...tools]; // duplicado para el loop infinito
  full.forEach((t) => {
    const pill = document.createElement("span");
    pill.className = "tool-pill";
    pill.textContent = t;
    track.appendChild(pill);
  });
})();

// ==========================================
// 4. CARRUSEL INFINITO — FORMULARIOS (imágenes subidas)
// ==========================================
(function buildFormsCarousel() {
  const track = document.getElementById("formsTrack");
  const forms = [
    { src: "Captura de pantalla 2026-08-17 214138.png", title: "Formulario de Empleados", desc: "CRUD completo: buscar, actualizar, eliminar y guardar empleados." },
    { src: "Captura de pantalla 2026-08-17 214621.png", title: "Formulario de Pedidos", desc: "Gestión de pedidos ligada a clientes y empleados." },
    { src: "Captura de pantalla 2026-08-17 214814.png", title: "Formulario de Bienvenida / Login", desc: "Pantalla de acceso al sistema, la puerta de entrada de tu aplicación." }
  ];
  const full = [...forms, ...forms]; // duplicado para el loop infinito
  full.forEach((f) => {
    const slide = document.createElement("div");
    slide.className = "form-slide";
    slide.innerHTML = `
      <img src="${f.src}" alt="${f.title}">
      <div class="form-slide__caption">
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
      </div>
    `;
    track.appendChild(slide);
  });
})();

// ==========================================
// 5. LOGIN DEMO (formulario de práctica)
// ==========================================
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (document.getElementById("loginUser").disabled) return;
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (!user || !pass) {
    loginMsg.textContent = "⚠️ Completa usuario y contraseña para simular el ingreso.";
    loginMsg.className = "login-demo__msg err";
    return;
  }

  loginMsg.textContent = `✅ ¡Bienvenido, ${user}! Inicio de sesión simulado con éxito.`;
  loginMsg.className = "login-demo__msg ok";
});