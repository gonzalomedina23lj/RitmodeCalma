const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const route = 'practicas/volver-a-lo-que-esta-ocurriendo/';
const practiceHtml = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

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

test('shows both guided practices in Explore and preserves the original route', () => {
  assert.match(home, /<span class="explore-status explore-status--available">2 prácticas<\/span>/);
  assert.match(home, /href="practicas\/volver-al-centro\/"/);
  assert.match(home, /href="practicas\/volver-a-lo-que-esta-ocurriendo\/"/);
  assert.match(home, /<strong>Volver al centro<\/strong>/);
  assert.match(home, /<strong>Volver a lo que está ocurriendo<\/strong>/);
  assert.ok(fs.existsSync(path.join(root, 'practicas', 'volver-al-centro', 'index.html')));
});

test('links the related resource and includes the new practice in the sitemap', () => {
  assert.match(practiceHtml, /href="\.\.\/\.\.\/recursos\/tres-formas-de-volver-al-presente\/"/);
  assert.match(sitemap, /https:\/\/www\.ritmodecalma\.com\/practicas\/volver-a-lo-que-esta-ocurriendo\//);
});
