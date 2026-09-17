(() => {
  'use strict';

  const productionDomains = new Set(['ritmodecalma.com', 'www.ritmodecalma.com']);
  const trackedInMemory = new Set();

  function hasTracked(key) {
    if (trackedInMemory.has(key)) return true;

    try {
      return window.sessionStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }

  function markTracked(key) {
    trackedInMemory.add(key);

    try {
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Private browsing or disabled storage must not interrupt audio playback.
    }
  }

  function trackEvent(name, element) {
    if (!productionDomains.has(window.location.hostname)) return;

    const { content, contentType } = element.dataset;
    if (!content || !contentType) return;

    const key = `rdc:${name}:${contentType}:${content}`;
    if (hasTracked(key)) return;

    try {
      if (typeof window.umami?.track !== 'function') return;

      const result = window.umami.track(name, {
        content,
        content_type: contentType
      });
      markTracked(key);

      // The tracker may return a promise; rejected requests stay invisible to visitors.
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      // Analytics must never interfere with the native audio player.
    }
  }

  function watchAudio(audio) {
    let started = false;
    let completed = false;

    function reportProgress() {
      if (!started) return;

      trackEvent('audio_play', audio);

      const { currentTime, duration } = audio;
      if (Number.isFinite(duration) && duration > 0 && Number.isFinite(currentTime)
        && currentTime / duration >= 0.5) {
        trackEvent('audio_50', audio);
      }

      if (completed) trackEvent('audio_complete', audio);
    }

    audio.addEventListener('play', () => {
      started = true;
      reportProgress();
    });
    audio.addEventListener('timeupdate', reportProgress);
    audio.addEventListener('ended', () => {
      completed = true;
      reportProgress();
    });

    return reportProgress;
  }

  const reportAudioProgress = [...document.querySelectorAll('[data-analytics-audio]')]
    .map(watchAudio);

  [...document.querySelectorAll('[data-analytics-resource]')].forEach((link) => {
    link.addEventListener('click', () => {
      const eventName = link.dataset.analyticsResource;
      if (eventName === 'resource_open' || eventName === 'resource_download') {
        trackEvent(eventName, link);
      }
    });
  });

  // If Umami arrives after playback starts, report any milestone already reached.
  const trackerScript = document.querySelector('script[src="https://cloud.umami.is/script.js"]');
  trackerScript?.addEventListener('load', () => {
    reportAudioProgress.forEach((report) => report());
  });
})();
