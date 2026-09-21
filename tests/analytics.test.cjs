const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'analytics.js'), 'utf8');

function createAudio(content, contentType) {
  const listeners = new Map();

  return {
    dataset: { content, contentType },
    currentTime: 0,
    duration: Number.NaN,
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
    emit(name) {
      listeners.get(name)?.();
    }
  };
}

function createResourceLink(eventName, content = 'volver-al-presente') {
  const listeners = new Map();

  return {
    dataset: {
      analyticsResource: eventName,
      content,
      contentType: 'resource'
    },
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
    emit(name) {
      listeners.get(name)?.();
    }
  };
}

function initialize({ hostname = 'www.ritmodecalma.com', audios = [], resources = [], storage = new Map(), tracker } = {}) {
  const events = [];
  let scriptLoaded;
  const window = {
    location: { hostname },
    sessionStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); }
    },
    umami: tracker === undefined
      ? { track(name, data) { events.push({ name, data }); } }
      : tracker
  };
  const document = {
    querySelectorAll(selector) {
      if (selector === '[data-analytics-audio]') return audios;
      if (selector === '[data-analytics-resource]') return resources;
      assert.fail(`Unexpected selector: ${selector}`);
    },
    querySelector(selector) {
      assert.equal(selector, 'script[src="https://cloud.umami.is/script.js"]');
      return { addEventListener(name, callback) {
        assert.equal(name, 'load');
        scriptLoaded = callback;
      } };
    }
  };

  vm.runInNewContext(source, { window, document, Set, Number });
  return { events, storage, window, scriptLoaded: () => scriptLoaded?.() };
}

test('tracks play, half and complete once per content and browser session', () => {
  const audio = createAudio('volver-al-centro', 'practice');
  const state = initialize({ audios: [audio] });

  audio.emit('play');
  audio.emit('play'); // Resuming after a pause is another native play event.
  audio.duration = 100;
  audio.currentTime = 50;
  audio.emit('timeupdate');
  audio.currentTime = 90;
  audio.emit('timeupdate');
  audio.currentTime = 100;
  audio.emit('ended');
  audio.emit('ended');

  assert.deepEqual(state.events.map(({ name }) => name), [
    'audio_play', 'audio_50', 'audio_complete'
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(state.events[0].data)), {
    content: 'volver-al-centro', content_type: 'practice'
  });
  assert.equal(state.storage.get('rdc:audio_play:practice:volver-al-centro'), '1');
  assert.equal(state.storage.get('rdc:audio_50:practice:volver-al-centro'), '1');
  assert.equal(state.storage.get('rdc:audio_complete:practice:volver-al-centro'), '1');

  const reloadedAudio = createAudio('volver-al-centro', 'practice');
  const reloaded = initialize({ audios: [reloadedAudio], storage: state.storage });
  reloadedAudio.duration = 100;
  reloadedAudio.currentTime = 100;
  reloadedAudio.emit('play');
  reloadedAudio.emit('timeupdate');
  reloadedAudio.emit('ended');
  assert.equal(reloaded.events.length, 0);

  const nextSessionAudio = createAudio('volver-al-centro', 'practice');
  const nextSession = initialize({ audios: [nextSessionAudio] });
  nextSessionAudio.emit('play');
  assert.deepEqual(nextSession.events.map(({ name }) => name), ['audio_play']);
});

test('waits for a valid duration, including when the listener seeks manually', () => {
  const audio = createAudio('cuando-los-pensamientos-ocupan-todo-el-espacio', 'reflection');
  const state = initialize({ audios: [audio] });

  audio.emit('play');
  audio.currentTime = 80;
  audio.emit('timeupdate');
  assert.deepEqual(state.events.map(({ name }) => name), ['audio_play']);

  audio.duration = 100;
  audio.emit('timeupdate');
  assert.deepEqual(state.events.map(({ name }) => name), ['audio_play', 'audio_50']);
});

test('recovers silently when Umami loads after the audio finishes', () => {
  const audio = createAudio('volver-al-centro', 'practice');
  const state = initialize({ audios: [audio], tracker: null });

  audio.duration = 100;
  audio.emit('play');
  audio.currentTime = 100;
  audio.emit('timeupdate');
  audio.emit('ended');
  assert.equal(state.storage.size, 0);

  state.window.umami = { track(name, data) { state.events.push({ name, data }); } };
  state.scriptLoaded();
  assert.deepEqual(state.events.map(({ name }) => name), [
    'audio_play', 'audio_50', 'audio_complete'
  ]);
});

test('never sends preview events, even if a tracker is present', () => {
  const audio = createAudio('volver-al-centro', 'practice');
  const state = initialize({ hostname: 'localhost', audios: [audio] });
  audio.duration = 100;
  audio.emit('play');
  audio.currentTime = 100;
  audio.emit('timeupdate');
  audio.emit('ended');
  assert.equal(state.events.length, 0);
  assert.equal(state.storage.size, 0);
});

test('deduplicates in memory when sessionStorage is unavailable', () => {
  const audio = createAudio('volver-al-centro', 'practice');
  const state = initialize({ audios: [audio] });
  state.window.sessionStorage.getItem = () => { throw new Error('storage blocked'); };
  state.window.sessionStorage.setItem = () => { throw new Error('storage blocked'); };

  audio.emit('play');
  audio.emit('play');
  assert.deepEqual(state.events.map(({ name }) => name), ['audio_play']);
});

test('keeps separate counters for different content and swallows tracker failures', async () => {
  const reflection = createAudio('cuando-los-pensamientos-ocupan-todo-el-espacio', 'reflection');
  const practice = createAudio('volver-al-centro', 'practice');
  const calls = [];
  const state = initialize({
    audios: [reflection, practice],
    tracker: { track(name, data) {
      calls.push({ name, data });
      return Promise.reject(new Error('network blocked'));
    } }
  });

  reflection.emit('play');
  practice.emit('play');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(({ data }) => data.content_type), ['reflection', 'practice']);
  assert.equal(state.storage.size, 2);
});

test('does not disrupt playback or mark a failed synchronous tracker call', () => {
  const audio = createAudio('volver-al-centro', 'practice');
  const state = initialize({
    audios: [audio],
    tracker: { track() { throw new Error('tracker blocked'); } }
  });

  assert.doesNotThrow(() => audio.emit('play'));
  assert.equal(state.storage.size, 0);
  state.window.umami = { track(name, data) { state.events.push({ name, data }); } };
  audio.emit('timeupdate');
  assert.deepEqual(state.events.map(({ name }) => name), ['audio_play']);
});

test('tracks resource open and download once without personal data', () => {
  const open = createResourceLink('resource_open');
  const download = createResourceLink('resource_download');
  const state = initialize({ resources: [open, download] });

  open.emit('click');
  open.emit('click');
  download.emit('click');
  download.emit('click');

  assert.deepEqual(state.events.map(({ name }) => name), [
    'resource_open', 'resource_download'
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(state.events[0].data)), {
    content: 'volver-al-presente', content_type: 'resource'
  });
  assert.deepEqual(Object.keys(state.events[0].data).sort(), ['content', 'content_type']);
  assert.equal(state.storage.get('rdc:resource_open:resource:volver-al-presente'), '1');
  assert.equal(state.storage.get('rdc:resource_download:resource:volver-al-presente'), '1');
});

test('does not track resource events outside production', () => {
  const open = createResourceLink('resource_open');
  const state = initialize({ hostname: '127.0.0.1', resources: [open] });

  open.emit('click');

  assert.equal(state.events.length, 0);
  assert.equal(state.storage.size, 0);
});

test('tracks the second resource independently with the existing event names', () => {
  const open = createResourceLink('resource_open', 'tres-formas-de-volver-al-presente');
  const download = createResourceLink('resource_download', 'tres-formas-de-volver-al-presente');
  const state = initialize({ resources: [open, download] });

  open.emit('click');
  download.emit('click');

  assert.deepEqual(state.events.map(({ name }) => name), [
    'resource_open', 'resource_download'
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(state.events[0].data)), {
    content: 'tres-formas-de-volver-al-presente', content_type: 'resource'
  });
  assert.equal(
    state.storage.get('rdc:resource_open:resource:tres-formas-de-volver-al-presente'),
    '1'
  );
  assert.equal(
    state.storage.get('rdc:resource_download:resource:tres-formas-de-volver-al-presente'),
    '1'
  );
});
