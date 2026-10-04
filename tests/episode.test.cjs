const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const episodeRoute = path.join('en-voz-alta', 'cuanto-tiempo-estamos-realmente-presentes');
const episodeHtml = fs.readFileSync(path.join(root, episodeRoute, 'index.html'), 'utf8');
const episodeJs = fs.readFileSync(path.join(root, 'en-voz-alta', 'episode.js'), 'utf8');
const episodes = JSON.parse(fs.readFileSync(path.join(root, 'en-voz-alta', 'episodes.json'), 'utf8'));
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const stylesheet = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

test('places En voz alta after Explore and before Un minuto without adding a fourth card', () => {
  const exploreStart = home.indexOf('id="explorar"');
  const voiceStart = home.indexOf('id="en-voz-alta"');
  const pauseStart = home.indexOf('id="presencia"');

  assert.ok(exploreStart !== -1 && voiceStart > exploreStart && pauseStart > voiceStart);
  assert.equal((home.match(/class="explore-card(?:\s|")/g) ?? []).length, 3);
  assert.match(home, /Podcast · Ritmo de Calma/);
  assert.match(home, /href="en-voz-alta\/cuanto-tiempo-estamos-realmente-presentes\/"/);
  assert.match(home, /Escuchar episodio/);
});

test('publishes episode 01 with canonical podcast metadata', () => {
  assert.match(episodeHtml, /<title>¿Cuánto tiempo estamos realmente presentes\? \| En voz alta · Ritmo de Calma<\/title>/);
  assert.match(episodeHtml, /<link rel="canonical" href="https:\/\/www\.ritmodecalma\.com\/en-voz-alta\/cuanto-tiempo-estamos-realmente-presentes\/">/);
  assert.match(episodeHtml, /"@type": "PodcastEpisode"/);
  assert.match(episodeHtml, /"episodeNumber": 1/);
  assert.match(episodeHtml, /"duration": "PT16M6S"/);
  assert.match(episodeHtml, /"@type": "PodcastSeries"/);
  assert.match(sitemap, /https:\/\/www\.ritmodecalma\.com\/en-voz-alta\/cuanto-tiempo-estamos-realmente-presentes\//);
});

test('connects the native player to the optimized web audio without practice instructions', () => {
  assert.match(episodeHtml, /<audio class="episode-audio"[^>]*data-analytics-audio[^>]*controls preload="metadata">/);
  assert.match(episodeHtml, /data-content="cuanto-tiempo-estamos-realmente-presentes"/);
  assert.match(episodeHtml, /data-content-type="episode"/);
  assert.match(episodeHtml, /assets\/audio\/en-voz-alta\/cuanto-tiempo-estamos-realmente-presentes\.mp3/);
  assert.doesNotMatch(episodeHtml, /autoplay/);
  assert.doesNotMatch(episodeHtml, /Antes de empezar/);
});

test('keeps the web encode stable and compact', () => {
  const audio = fs.readFileSync(path.join(
    root,
    'assets',
    'audio',
    'en-voz-alta',
    'cuanto-tiempo-estamos-realmente-presentes.mp3'
  ));

  assert.equal(audio.length, 15455232);
  assert.equal(
    crypto.createHash('sha256').update(audio).digest('hex'),
    '8ec2328d5fa8889f6431f74c0446d80da0ca3aee9b62ea41fc8cda72ad0a29da'
  );
  assert.deepEqual([...audio.subarray(0, 2)], [0xff, 0xfb]);
});

test('provides a reusable episode manifest and optional references component', () => {
  assert.equal(episodes.series.name, 'En voz alta');
  assert.equal(episodes.episodes.length, 1);
  assert.deepEqual(
    Object.keys(episodes.episodes[0]).sort(),
    ['audio', 'description', 'durationLabel', 'durationSeconds', 'number', 'references', 'slug', 'title']
  );
  assert.deepEqual(episodes.episodes[0].references, []);
  assert.match(episodeHtml, /data-episode-references hidden/);
  assert.match(episodeJs, /fetch\('\.\.\/episodes\.json'\)/);
  assert.match(episodeJs, /if \(!references\.length\) return/);
});

test('uses a calm waveform with playback state and reduced-motion support', () => {
  assert.match(home, /class="voice-wave" aria-hidden="true"/);
  assert.match(episodeJs, /audio\.addEventListener\('play'/);
  assert.match(episodeJs, /\['pause', 'ended', 'emptied'\]/);
  assert.match(stylesheet, /\.episode-player-card\.is-playing \.voice-wave-lines/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
});
