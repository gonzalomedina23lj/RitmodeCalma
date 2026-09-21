const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const resourceHtml = fs.readFileSync(
  path.join(root, 'recursos', 'volver-al-presente', 'index.html'),
  'utf8'
);
const threeWaysHtml = fs.readFileSync(
  path.join(root, 'recursos', 'tres-formas-de-volver-al-presente', 'index.html'),
  'utf8'
);

test('publishes the approved resource with canonical metadata', () => {
  assert.match(resourceHtml, /<title>Volver al presente — Recurso PDF \| Ritmo de Calma<\/title>/);
  assert.match(resourceHtml, /<link rel="canonical" href="https:\/\/www\.ritmodecalma\.com\/recursos\/volver-al-presente\/">/);
  assert.match(resourceHtml, /<meta name="description" content="Volver al presente es una guía breve de Ritmo de Calma/);
  assert.match(resourceHtml, /"@type": "DigitalDocument"/);
  assert.match(resourceHtml, /"encodingFormat": "application\/pdf"/);
});

test('provides accessible open and download actions with anonymous analytics', () => {
  assert.match(resourceHtml, /class="button button-primary resource-open"\s+href="[^\"]+ritmo-de-calma-volver-al-presente\.pdf\?v=lectura-guiada-v2"/);
  assert.match(resourceHtml, /class="resource-download"\s+href="[^\"]+ritmo-de-calma-volver-al-presente\.pdf\?v=lectura-guiada-v2"/);
  assert.match(resourceHtml, /target="_blank"\s+rel="noopener"\s+data-analytics-resource="resource_open"/);
  assert.match(resourceHtml, /download\s+data-analytics-resource="resource_download"/);
  assert.match(resourceHtml, /data-content="volver-al-presente"/);
  assert.match(resourceHtml, /data-content-type="resource"/);
  assert.doesNotMatch(resourceHtml, /data-(?:email|name|message)=/);
});

test('keeps the approved PDF intact and includes its lightweight cover', () => {
  const pdf = fs.readFileSync(path.join(
    root,
    'assets',
    'recursos',
    'volver-al-presente',
    'ritmo-de-calma-volver-al-presente.pdf'
  ));
  const cover = fs.readFileSync(path.join(
    root,
    'assets',
    'recursos',
    'volver-al-presente',
    'portada-volver-al-presente.png'
  ));

  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.equal(pdf.length, 6603181);
  assert.deepEqual([...cover.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(cover.length < 600000);
  assert.match(resourceHtml, /portada-volver-al-presente\.png\?v=lectura-guiada-v2/);
  assert.match(resourceHtml, /Recurso 01 · PDF · 4 páginas/);
});

test('links the resource from Explore and includes it in the sitemap', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

  assert.match(home, /href="recursos\/volver-al-presente\/"/);
  assert.match(home, /<span class="explore-status explore-status--resource">2 recursos<\/span>/);
  assert.match(sitemap, /https:\/\/www\.ritmodecalma\.com\/recursos\/volver-al-presente\//);
});

test('publishes Tres formas de volver al presente with canonical metadata', () => {
  assert.match(threeWaysHtml, /<title>Tres formas de volver al presente — Recurso PDF \| Ritmo de Calma<\/title>/);
  assert.match(threeWaysHtml, /<link rel="canonical" href="https:\/\/www\.ritmodecalma\.com\/recursos\/tres-formas-de-volver-al-presente\/">/);
  assert.match(threeWaysHtml, /<meta name="description" content="Tres formas de volver al presente es un recurso PDF de Ritmo de Calma/);
  assert.match(threeWaysHtml, /"@type": "DigitalDocument"/);
  assert.match(threeWaysHtml, /"encodingFormat": "application\/pdf"/);
});

test('provides open and download actions for the second resource', () => {
  assert.match(threeWaysHtml, /class="button button-primary resource-open"\s+href="[^\"]+ritmo-de-calma-tres-formas-de-volver-al-presente\.pdf"/);
  assert.match(threeWaysHtml, /class="resource-download"\s+href="[^\"]+ritmo-de-calma-tres-formas-de-volver-al-presente\.pdf"/);
  assert.match(threeWaysHtml, /target="_blank"\s+rel="noopener"\s+data-analytics-resource="resource_open"/);
  assert.match(threeWaysHtml, /download\s+data-analytics-resource="resource_download"/);
  assert.match(threeWaysHtml, /data-content="tres-formas-de-volver-al-presente"/);
  assert.match(threeWaysHtml, /data-content-type="resource"/);
  assert.doesNotMatch(threeWaysHtml, /data-(?:email|name|message)=/);
});

test('keeps the approved second PDF byte-identical and uses its derived cover', () => {
  const pdf = fs.readFileSync(path.join(
    root,
    'assets',
    'recursos',
    'tres-formas-de-volver-al-presente',
    'ritmo-de-calma-tres-formas-de-volver-al-presente.pdf'
  ));
  const cover = fs.readFileSync(path.join(
    root,
    'assets',
    'recursos',
    'tres-formas-de-volver-al-presente',
    'portada-tres-formas-de-volver-al-presente.png'
  ));

  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.equal(pdf.length, 3780056);
  assert.equal(
    crypto.createHash('sha256').update(pdf).digest('hex'),
    '196cc64de825636e4549ecaadb0d24548040367bc6d09d79d6a68e74b1740dfb'
  );
  assert.deepEqual([...cover.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(cover.length < 600000);
  assert.match(threeWaysHtml, /portada-tres-formas-de-volver-al-presente\.png/);
  assert.match(threeWaysHtml, /Recurso 02 · PDF · 6 páginas/);
});

test('shows both resources in Explore and includes the new route in the sitemap', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

  assert.match(home, /href="recursos\/volver-al-presente\/"/);
  assert.match(home, /href="recursos\/tres-formas-de-volver-al-presente\/"/);
  assert.match(home, /<strong>Volver al presente<\/strong>/);
  assert.match(home, /<strong>Tres formas de volver al presente<\/strong>/);
  assert.match(sitemap, /https:\/\/www\.ritmodecalma\.com\/recursos\/tres-formas-de-volver-al-presente\//);
});
