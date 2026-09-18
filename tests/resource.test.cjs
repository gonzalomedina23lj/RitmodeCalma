const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const resourceHtml = fs.readFileSync(
  path.join(root, 'recursos', 'volver-al-presente', 'index.html'),
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
  assert.match(home, /<span class="explore-status explore-status--resource">Primer recurso<\/span>/);
  assert.match(sitemap, /https:\/\/www\.ritmodecalma\.com\/recursos\/volver-al-presente\//);
});
