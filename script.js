(() => {
  'use strict';

  const body = document.body;
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- Scroll UI ---------------------------------------------------------
  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;

    progressBar.style.width = `${Math.min(progress, 100)}%`;
    header.classList.toggle('scrolled', scrollTop > 24);
  };

  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  // ----- Mobile navigation -------------------------------------------------
  const closeMenu = () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('click', (event) => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  // ----- Reveal on scroll --------------------------------------------------
  const revealElements = document.querySelectorAll('.reveal');

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -30px 0px' });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }

  // ----- Active navigation -------------------------------------------------
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = [...document.querySelectorAll('[data-section]')];

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle('active', link.dataset.nav === visible.target.dataset.section);
      });
    }, { threshold: [0.25, 0.45, 0.65], rootMargin: '-22% 0px -52% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ----- Hero parallax -----------------------------------------------------
  const heroVisual = document.getElementById('heroVisual');

  if (heroVisual && !reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 10;
      const y = ((event.clientY / window.innerHeight) - 0.5) * 10;
      heroVisual.style.setProperty('--mx', `${x}px`);
      heroVisual.style.setProperty('--my', `${y}px`);
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      heroVisual.style.setProperty('--mx', '0px');
      heroVisual.style.setProperty('--my', '0px');
    });
  }

  // ----- Magnetic buttons --------------------------------------------------
  if (!reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.06}px, ${y * 0.09}px) translateY(-2px)`;
      });

      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  // ----- Subtle card tilt --------------------------------------------------
  if (!reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const ry = (px - 0.5) * 4;
        const rx = (0.5 - py) * 4;
        card.style.setProperty('--rx', `${rx}deg`);
        card.style.setProperty('--ry', `${ry}deg`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ----- Pause modal -------------------------------------------------------
  const modal = document.getElementById('pauseModal');
  const openPauseButtons = document.querySelectorAll('[data-open-pause]');
  const closePauseButtons = document.querySelectorAll('[data-close-pause]');
  const pauseStart = document.getElementById('pauseStart');
  const pauseReset = document.getElementById('pauseReset');
  const pauseTime = document.getElementById('pauseTime');
  const breathPhase = document.getElementById('breathPhase');
  const breathHint = document.getElementById('breathHint');
  const breathDisc = document.getElementById('breathDisc');
  const instruction = document.getElementById('modalInstruction');
  const progressCircle = document.getElementById('progressCircle');

  const TOTAL_SECONDS = 60;
  const RADIUS = 148;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const INHALE_SECONDS = 4;
  const EXHALE_SECONDS = 6;

  let remaining = TOTAL_SECONDS;
  let intervalId = null;
  let state = 'idle'; // idle | running | paused | complete
  let lastFocusedElement = null;

  progressCircle.style.strokeDasharray = String(CIRCUMFERENCE);
  progressCircle.style.strokeDashoffset = String(CIRCUMFERENCE);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const setProgress = () => {
    const elapsed = TOTAL_SECONDS - remaining;
    const fraction = elapsed / TOTAL_SECONDS;
    progressCircle.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - fraction));
  };

  const setBreathState = () => {
    if (state !== 'running') return;

    const elapsed = TOTAL_SECONDS - remaining;
    const cycle = elapsed % (INHALE_SECONDS + EXHALE_SECONDS);

    if (cycle < INHALE_SECONDS) {
      breathPhase.textContent = 'INHALÁ';
      breathHint.textContent = 'suave, por la nariz';
      instruction.textContent = 'Tomá aire de manera cómoda. No hace falta llenar los pulmones al máximo.';
      breathDisc.classList.add('inhale');
      breathDisc.classList.remove('exhale');
    } else {
      breathPhase.textContent = 'EXHALÁ';
      breathHint.textContent = 'lento, sin forzar';
      instruction.textContent = 'Dejá salir el aire lentamente y observá si podés aflojar hombros, mandíbula y manos.';
      breathDisc.classList.add('exhale');
      breathDisc.classList.remove('inhale');
    }
  };

  const renderTimer = () => {
    pauseTime.textContent = formatTime(remaining);
    setProgress();
    setBreathState();
  };

  const stopInterval = () => {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  const resetPause = () => {
    stopInterval();
    remaining = TOTAL_SECONDS;
    state = 'idle';
    pauseTime.textContent = '01:00';
    breathPhase.textContent = 'LISTO';
    breathHint.textContent = 'tomate un momento';
    instruction.textContent = 'Buscá una postura cómoda. Cuando quieras, empezamos.';
    pauseStart.textContent = 'Comenzar';
    pauseReset.disabled = true;
    breathDisc.classList.remove('inhale', 'exhale');
    setProgress();
  };

  const completePause = () => {
    stopInterval();
    state = 'complete';
    remaining = 0;
    pauseTime.textContent = '00:00';
    setProgress();
    breathPhase.textContent = 'VOLVISTE';
    breathHint.textContent = 'observá cómo estás';
    instruction.textContent = 'La práctica terminó. Quedate unos segundos más y notá cómo estás, sin necesidad de cambiar nada.';
    pauseStart.textContent = 'Repetir pausa';
    pauseReset.disabled = false;
    breathDisc.classList.remove('inhale', 'exhale');
  };

  const tick = () => {
    remaining -= 1;
    if (remaining <= 0) {
      completePause();
      return;
    }
    renderTimer();
  };

  const startOrTogglePause = () => {
    if (state === 'complete') {
      resetPause();
    }

    if (state === 'running') {
      stopInterval();
      state = 'paused';
      pauseStart.textContent = 'Continuar';
      breathPhase.textContent = 'PAUSA';
      breathHint.textContent = 'respirá natural';
      instruction.textContent = 'La pausa quedó detenida. Podés continuar cuando quieras.';
      breathDisc.classList.remove('inhale', 'exhale');
      return;
    }

    state = 'running';
    pauseStart.textContent = 'Pausar';
    pauseReset.disabled = false;
    setBreathState();

    if (!intervalId) {
      intervalId = window.setInterval(tick, 1000);
    }
  };

  const openModal = () => {
    lastFocusedElement = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    resetPause();
    window.setTimeout(() => pauseStart.focus(), 30);
  };

  const closeModal = () => {
    stopInterval();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    resetPause();
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  };

  openPauseButtons.forEach((button) => button.addEventListener('click', openModal));
  closePauseButtons.forEach((button) => button.addEventListener('click', closeModal));
  pauseStart.addEventListener('click', startOrTogglePause);
  pauseReset.addEventListener('click', resetPause);

  // Basic focus trap for the modal.
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = [...modal.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute('hidden'));

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // ----- Footer year -------------------------------------------------------
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();

// Retrato "Sobre mí": micro-parallax muy sutil en escritorio.
// Se desactiva automáticamente si el usuario prefiere movimiento reducido.
const profilePhotoArea = document.querySelector('[data-photo-parallax]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (profilePhotoArea && !prefersReducedMotion.matches) {
  profilePhotoArea.addEventListener('pointermove', (event) => {
    if (window.innerWidth < 980) return;

    const rect = profilePhotoArea.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    profilePhotoArea.style.setProperty('--photo-x', `${x * 7}px`);
    profilePhotoArea.style.setProperty('--photo-y', `${y * 5}px`);
  });

  profilePhotoArea.addEventListener('pointerleave', () => {
    profilePhotoArea.style.setProperty('--photo-x', '0px');
    profilePhotoArea.style.setProperty('--photo-y', '0px');
  });
}

