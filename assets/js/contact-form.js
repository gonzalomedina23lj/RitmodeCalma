(() => {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton?.querySelector('[data-contact-submit-label]');
  const status = document.getElementById('contactStatus');
  const idleLabel = submitLabel?.textContent || 'Enviar mensaje';
  let submitting = false;

  const setStatus = (message, state = '') => {
    if (!status) return;
    status.textContent = message;

    if (state) {
      status.dataset.state = state;
    } else {
      delete status.dataset.state;
    }
  };

  const trackSuccessfulSubmit = () => {
    try {
      if (typeof window.umami?.track !== 'function') return;
      const result = window.umami.track('contact_submit');
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      // Analytics must never affect form delivery or the visitor experience.
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitting = true;
    form.setAttribute('aria-busy', 'true');
    if (submitButton) submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Enviando…';
    setStatus('');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree responded with ${response.status}`);

      form.reset();
      setStatus('Gracias por escribir. Tu mensaje fue enviado.', 'success');
      trackSuccessfulSubmit();
    } catch {
      setStatus('No pudimos enviar el mensaje. Probá nuevamente en unos instantes.', 'error');
    } finally {
      submitting = false;
      form.removeAttribute('aria-busy');
      if (submitButton) submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = idleLabel;
    }
  });
})();
