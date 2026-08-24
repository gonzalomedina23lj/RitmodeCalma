const header = document.querySelector('.site-header');
const progressBar = document.getElementById('progressBar');
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

function updateScrollUI() {
  const scrollTop = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${height > 0 ? (scrollTop / height) * 100 : 0}%`;
  header.classList.toggle('scrolled', scrollTop > 30);
}
window.addEventListener('scroll', updateScrollUI, { passive: true });
updateScrollUI();

menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

const modal = document.getElementById('pauseModal');
const startPause = document.getElementById('startPause');
const modalStart = document.getElementById('modalStart');
const modalTime = document.getElementById('modalTime');
const modalPhase = document.getElementById('modalPhase');
const modalInstruction = document.getElementById('modalInstruction');
const modalBreath = document.getElementById('modalBreath');

let timer = null;
let remaining = 60;
let running = false;

function formatTime(seconds) {
  return `00:${String(seconds).padStart(2, '0')}`;
}

function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  remaining = 60;
  running = false;
  modalTime.textContent = formatTime(remaining);
  modalPhase.textContent = 'Prepará el cuerpo';
  modalInstruction.textContent = 'Buscá una postura cómoda. Cuando estés listo, empezamos.';
  modalStart.textContent = 'Comenzar';
  modalBreath.classList.remove('inhale', 'exhale');
}

function closeModal() {
  clearInterval(timer);
  timer = null;
  running = false;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function setBreathPhase() {
  const elapsed = 60 - remaining;
  // 4 segundos inhalar, 6 segundos exhalar.
  const cycle = elapsed % 10;
  if (cycle < 4) {
    modalPhase.textContent = 'Inhalá';
    modalInstruction.textContent = 'Tomá aire suavemente por la nariz. Sin apurarte.';
    modalBreath.classList.add('inhale');
    modalBreath.classList.remove('exhale');
  } else {
    modalPhase.textContent = 'Exhalá';
    modalInstruction.textContent = 'Soltá el aire lento. Aflojá mandíbula, hombros y manos.';
    modalBreath.classList.add('exhale');
    modalBreath.classList.remove('inhale');
  }
}

function finishPause() {
  clearInterval(timer);
  timer = null;
  running = false;
  modalTime.textContent = '01:00';
  modalPhase.textContent = 'Volviste';
  modalInstruction.textContent = 'Un minuto. Eso fue todo. Notá cómo estás ahora, sin juzgarlo.';
  modalStart.textContent = 'Repetir pausa';
  modalBreath.classList.remove('inhale', 'exhale');
}

function runPause() {
  if (running) return;
  running = true;
  remaining = 60;
  modalStart.textContent = 'En curso…';
  setBreathPhase();
  modalTime.textContent = formatTime(remaining);

  timer = setInterval(() => {
    remaining -= 1;
    modalTime.textContent = formatTime(remaining);
    setBreathPhase();

    if (remaining <= 0) finishPause();
  }, 1000);
}

startPause.addEventListener('click', openModal);
modalStart.addEventListener('click', () => {
  if (!running) runPause();
});

document.querySelectorAll('[data-close-pause]').forEach(el => {
  el.addEventListener('click', closeModal);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

// Micro-interacción: parallax muy sutil del visual principal.
const heroVisual = document.querySelector('.hero-visual');
window.addEventListener('mousemove', (event) => {
  if (window.innerWidth < 850 || !heroVisual) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 8;
  const y = (event.clientY / window.innerHeight - 0.5) * 8;
  heroVisual.style.transform = `translate(${x}px, ${y}px)`;
}, { passive: true });
