const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const centerHtml = fs.readFileSync(path.join(root, 'practicas', 'volver-al-centro', 'index.html'), 'utf8');
const route = 'practicas/volver-a-lo-que-esta-ocurriendo/';
const practiceHtml = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
const discomfortRoute = 'practicas/quedarse-con-lo-incomodo/';
const discomfortHtml = fs.readFileSync(path.join(root, discomfortRoute, 'index.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const practiceJs = fs.readFileSync(path.join(root, 'practicas', 'practice.js'), 'utf8');
const stylesheet = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

test('publishes the new guided practice with canonical metadata', () => {
  assert.match(practiceHtml, /<title>Volver a lo que está ocurriendo — Práctica guiada \| Ritmo de Calma<\/title>/);
  assert.match(practiceHtml, /<link rel="canonical" href="https:\/\/www\.ritmodecalma\.com\/practicas\/volver-a-lo-que-esta-ocurriendo\/">/);
  assert.match(practiceHtml, /<meta name="description" content="Una práctica guiada para recuperar contacto/);
  assert.match(practiceHtml, /"@type": "AudioObject"/);
  assert.match(practiceHtml, /"duration": "PT12M19S"/);
  assert.match(practiceHtml, /"@type": "Person",\s+"name": "Gonzalo"/);
  assert.match(practiceHtml, /"@type": "Organization",\s+"name": "Ritmo de Calma"/);
});

test('connects the player to the approved MP3 and analytics events', () => {
  assert.match(practiceHtml, /data-analytics-audio/);
  assert.match(practiceHtml, /data-content="volver-a-lo-que-esta-ocurriendo"/);
  assert.match(practiceHtml, /data-content-type="practice"/);
  assert.match(practiceHtml, /src="\.\.\/\.\.\/assets\/audio\/ritmo-de-calma-volver-a-lo-que-esta-ocurriendo\.mp3"/);
  assert.match(practiceHtml, /src="\.\.\/\.\.\/assets\/js\/analytics\.js"/);
});

test('keeps the encoded web master intact', () => {
  const audio = fs.readFileSync(path.join(
    root,
    'assets',
    'audio',
    'ritmo-de-calma-volver-a-lo-que-esta-ocurriendo.mp3'
  ));

  assert.equal(audio.length, 14790898);
  assert.equal(
    crypto.createHash('sha256').update(audio).digest('hex'),
    'c5e28ac6f62ab6332632b247f80fb2615aa7efb70410e85811edc3e16772987a'
  );
  assert.equal(audio.subarray(0, 3).toString(), 'ID3');
});

test('shows all guided practices in Explore and preserves the original route', () => {
  assert.match(home, /<span class="explore-status explore-status--available">3 prácticas<\/span>/);
  assert.match(home, /href="practicas\/volver-al-centro\/"/);
  assert.match(home, /href="practicas\/volver-a-lo-que-esta-ocurriendo\/"/);
  assert.match(home, /<strong>Volver al centro<\/strong>/);
  assert.match(home, /<strong>Volver a lo que está ocurriendo<\/strong>/);
  assert.match(home, /href="practicas\/quedarse-con-lo-incomodo\/"/);
  assert.match(home, /<strong>Quedarse con lo incómodo<\/strong>/);
  assert.match(home, /Una práctica para observar una incomodidad cotidiana sin exigir que desaparezca\./);
  assert.ok(fs.existsSync(path.join(root, 'practicas', 'volver-al-centro', 'index.html')));
});

test('publishes Quedarse con lo incómodo with canonical metadata', () => {
  assert.match(discomfortHtml, /<title>Quedarse con lo incómodo \| Ritmo de Calma<\/title>/);
  assert.match(discomfortHtml, /<link rel="canonical" href="https:\/\/www\.ritmodecalma\.com\/practicas\/quedarse-con-lo-incomodo\/">/);
  assert.match(discomfortHtml, /"@type": "AudioObject"/);
  assert.match(discomfortHtml, /"duration": "PT15M4S"/);
  assert.match(discomfortHtml, /"@type": "Person",\s+"name": "Gonzalo"/);
  assert.match(discomfortHtml, /"@type": "Organization",\s+"name": "Ritmo de Calma"/);
});

test('connects Quedarse con lo incómodo to the approved MP3 and analytics', () => {
  assert.match(discomfortHtml, /data-analytics-audio/);
  assert.match(discomfortHtml, /data-content="quedarse-con-lo-incomodo"/);
  assert.match(discomfortHtml, /data-content-type="practice"/);
  assert.match(discomfortHtml, /src="\.\.\/\.\.\/assets\/audio\/quedarse-con-lo-incomodo\.mp3"/);
  assert.match(sitemap, /https:\/\/www\.ritmodecalma\.com\/practicas\/quedarse-con-lo-incomodo\//);
});

test('keeps the approved Quedarse con lo incómodo master byte-identical', () => {
  const audio = fs.readFileSync(path.join(root, 'assets', 'audio', 'quedarse-con-lo-incomodo.mp3'));

  assert.equal(audio.length, 8909183);
  assert.equal(
    crypto.createHash('sha256').update(audio).digest('hex'),
    '717adacf2f166930febc8b793e56ebdf87b25b9bc755b4ad9200e49246f8daf8'
  );
  assert.equal(audio.subarray(0, 3).toString(), 'ID3');
});

test('uses the reusable preparation and integration flow in every guided practice', () => {
  const pages = [centerHtml, practiceHtml, discomfortHtml];

  for (const page of pages) {
    assert.match(page, /class="practice-meta"/);
    assert.match(page, /Práctica guiada · Audio/);
    assert.match(page, /class="before-you-begin"/);
    assert.match(page, />Antes de empezar</);
    assert.match(page, /class="content-duration"/);
    assert.match(page, /class="post-practice-prompt"/);
    assert.match(page, />Antes de seguir</);
    assert.match(page, /<audio class="practice-audio"[^>]* controls preload="metadata">/);
  }

  assert.match(discomfortHtml, /Territorio · Habitar la incomodidad/);
  assert.match(discomfortHtml, /¿Notaste alguna diferencia entre la incomodidad y el impulso de querer que desapareciera\?/);
});

test('animates the practice mark only while audio is playing and respects reduced motion', () => {
  assert.match(practiceJs, /audio\.addEventListener\('play'/);
  assert.match(practiceJs, /\['pause', 'ended', 'emptied'\]/);
  assert.match(practiceJs, /card\.classList\.toggle\('is-playing', isPlaying\)/);
  assert.match(stylesheet, /\.practice-player-card\.is-playing \.practice-player-mark/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
});

test('links the related resource and includes the new practice in the sitemap', () => {
  assert.match(practiceHtml, /href="\.\.\/\.\.\/recursos\/tres-formas-de-volver-al-presente\/"/);
  assert.match(sitemap, /https:\/\/www\.ritmodecalma\.com\/practicas\/volver-a-lo-que-esta-ocurriendo\//);
});
