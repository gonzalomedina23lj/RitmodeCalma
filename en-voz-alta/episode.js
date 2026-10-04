(() => {
  'use strict';

  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const year = document.getElementById('year');
  const audio = document.querySelector('.episode-audio');
  const playerCard = audio?.closest('.episode-player-card');

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;

    if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
    if (header) header.classList.toggle('scrolled', scrollTop > 24);
  };

  const closeMenu = () => {
    if (!nav || !menuToggle) return;
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
  };

  if (nav && menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }

  if (audio && playerCard) {
    audio.addEventListener('play', () => playerCard.classList.add('is-playing'));
    ['pause', 'ended', 'emptied'].forEach((eventName) => {
      audio.addEventListener(eventName, () => playerCard.classList.remove('is-playing'));
    });
  }

  const referencesSection = document.querySelector('[data-episode-references]');
  const episodeSlug = document.body.dataset.episodeSlug;

  if (referencesSection && episodeSlug) {
    fetch('../episodes.json')
      .then((response) => {
        if (!response.ok) throw new Error('Episode manifest unavailable');
        return response.json();
      })
      .then(({ episodes = [] }) => {
        const episode = episodes.find(({ slug }) => slug === episodeSlug);
        const references = episode?.references ?? [];
        if (!references.length) return;

        const list = referencesSection.querySelector('ul');
        references.forEach(({ title, author, detail }) => {
          const item = document.createElement('li');
          const heading = document.createElement('strong');
          const description = document.createElement('span');
          heading.textContent = title;
          description.textContent = [author, detail].filter(Boolean).join(' · ');
          item.append(heading, description);
          list.append(item);
        });
        referencesSection.hidden = false;
      })
      .catch(() => {
        // References are supplementary and must never affect listening.
      });
  }

  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();
  if (year) year.textContent = String(new Date().getFullYear());
})();
