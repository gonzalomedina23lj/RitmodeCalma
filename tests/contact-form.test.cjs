const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/contact-form.js', 'utf8');

function createHarness({ fetchImpl, track, valid = true } = {}) {
  const listeners = new Map();
  const attributes = new Map();
  const tracked = [];
  const submitLabel = { textContent: 'Enviar mensaje' };
  const submitButton = {
    disabled: false,
    querySelector(selector) {
      assert.equal(selector, '[data-contact-submit-label]');
      return submitLabel;
    }
  };
  const status = { textContent: '', dataset: {} };
  const form = {
    action: 'https://formspree.io/f/mkjgnwpa',
    resetCalls: 0,
    reportCalls: 0,
    querySelector(selector) {
      assert.equal(selector, 'button[type="submit"]');
      return submitButton;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    checkValidity() {
      return valid;
    },
    reportValidity() {
      this.reportCalls += 1;
    },
    reset() {
      this.resetCalls += 1;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    }
  };

  class FakeFormData {
    constructor(receivedForm) {
      this.form = receivedForm;
    }
  }

  const window = {};
  if (track !== null) {
    window.umami = {
      track(...args) {
        tracked.push(args);
        return track?.(...args);
      }
    };
  }

  vm.runInNewContext(source, {
    document: {
      getElementById(id) {
        if (id === 'contactForm') return form;
        if (id === 'contactStatus') return status;
        return null;
      }
    },
    window,
    FormData: FakeFormData,
    fetch: fetchImpl || (async () => ({ ok: true, status: 200 }))
  });

  return {
    attributes,
    form,
    status,
    submitButton,
    submitLabel,
    tracked,
    submit() {
      return listeners.get('submit')({ preventDefault() {} });
    }
  };
}

test('submits to Formspree once, resets the form and tracks no personal data', async () => {
  let resolveRequest;
  const requests = [];
  const harness = createHarness({
    fetchImpl(url, options) {
      requests.push({ url, options });
      return new Promise((resolve) => { resolveRequest = resolve; });
    }
  });

  const pending = harness.submit();
  const duplicate = harness.submit();

  assert.equal(requests.length, 1);
  assert.equal(harness.submitButton.disabled, true);
  assert.equal(harness.submitLabel.textContent, 'Enviando…');
  assert.equal(harness.attributes.get('aria-busy'), 'true');
  await duplicate;

  resolveRequest({ ok: true, status: 200 });
  await pending;

  assert.equal(requests[0].url, 'https://formspree.io/f/mkjgnwpa');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers.Accept, 'application/json');
  assert.equal(requests[0].options.body.form, harness.form);
  assert.equal(harness.form.resetCalls, 1);
  assert.equal(harness.status.textContent, 'Gracias por escribir. Tu mensaje fue enviado.');
  assert.equal(harness.status.dataset.state, 'success');
  assert.deepEqual(harness.tracked, [['contact_submit']]);
  assert.equal(harness.submitButton.disabled, false);
  assert.equal(harness.submitLabel.textContent, 'Enviar mensaje');
  assert.equal(harness.attributes.has('aria-busy'), false);
});

test('shows an error without tracking and permits a later retry', async () => {
  const responses = [
    { ok: false, status: 500 },
    { ok: true, status: 200 }
  ];
  const harness = createHarness({ fetchImpl: async () => responses.shift() });

  await harness.submit();

  assert.equal(harness.form.resetCalls, 0);
  assert.equal(harness.status.textContent, 'No pudimos enviar el mensaje. Probá nuevamente en unos instantes.');
  assert.equal(harness.status.dataset.state, 'error');
  assert.equal(harness.tracked.length, 0);
  assert.equal(harness.submitButton.disabled, false);

  await harness.submit();

  assert.equal(harness.form.resetCalls, 1);
  assert.equal(harness.status.dataset.state, 'success');
  assert.deepEqual(harness.tracked, [['contact_submit']]);
});

test('keeps successful delivery working when Umami is unavailable', async () => {
  const harness = createHarness({ track: null });
  await harness.submit();

  assert.equal(harness.form.resetCalls, 1);
  assert.equal(harness.status.dataset.state, 'success');
  assert.equal(harness.tracked.length, 0);
});

test('uses native validation before sending', async () => {
  let fetchCalls = 0;
  const harness = createHarness({
    valid: false,
    fetchImpl: async () => {
      fetchCalls += 1;
      return { ok: true, status: 200 };
    }
  });

  await harness.submit();

  assert.equal(fetchCalls, 0);
  assert.equal(harness.form.reportCalls, 1);
  assert.equal(harness.tracked.length, 0);
});

test('includes the accessible Formspree contract and hidden honeypot', () => {
  const html = fs.readFileSync('index.html', 'utf8');

  assert.match(html, /action="https:\/\/formspree\.io\/f\/mkjgnwpa"/);
  assert.match(html, /type="email" name="email" autocomplete="email" required/);
  assert.match(html, /textarea[^>]+name="message"[^>]+required/);
  assert.match(html, /name="_gotcha" tabindex="-1" autocomplete="off"/);
  assert.match(html, /id="contactStatus"[^>]+aria-live="polite"/);
  assert.doesNotMatch(html, /data-nav="contacto"/);
});
