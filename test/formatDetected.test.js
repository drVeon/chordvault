process.env.DB_PATH = ':memory:';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { db } = require('../lib/db');
const Song = require('../lib/models/song');
const { detectStoredFormat } = require('../lib/chordFormat');

const userId = db.prepare("INSERT INTO users (username, password_hash) VALUES ('fmt', 'x')").run().lastInsertRowid;
const formatOf = (id) => db.prepare('SELECT format_detected FROM songs WHERE id = ?').get(id).format_detected;
const meta = { title: 'T', artist: '', key: '', youtube_url: null, bpm: null, tags: null, language: 'en' };

test('detectStoredFormat: bracketed chords are ChordPro, lyrics only is null', () => {
  assert.equal(detectStoredFormat('{title: T}\n[G]Le kaj'), 'ChordPro');
  assert.equal(detectStoredFormat('{title: T}\nJust words'), null);
  assert.equal(detectStoredFormat(''), null);
});

test('imported songs record their format, so they no longer count as "No chords detected"', () => {
  const before = Song.countNoFormat();
  Song.importSongs(userId, [
    { index: 0, ...meta, title: 'With chords', content: '{title: With chords}\n[G]a [C]b', visibility: 'public' },
    { index: 1, ...meta, title: 'Lyrics only', content: '{title: Lyrics only}\njust words', visibility: 'public' },
  ]);
  const rows = db.prepare("SELECT title, format_detected FROM songs WHERE title IN ('With chords', 'Lyrics only') ORDER BY title").all();
  assert.deepEqual(rows, [
    { title: 'Lyrics only', format_detected: null },
    { title: 'With chords', format_detected: 'ChordPro' },
  ]);
  assert.equal(Song.countNoFormat(), before + 1);
});

test('versions and corrections record their format', () => {
  const parentId = db.prepare(
    "INSERT INTO songs (user_id, title, content, visibility, status, format_detected) VALUES (?, 'P', '[G]p', 'public', 'active', 'ChordPro')"
  ).run(userId).lastInsertRowid;
  const versionId = Song.createVersion(userId, parentId, meta, '[D]version', 'public').lastInsertRowid;
  const correctionId = Song.createCorrection(userId, parentId, meta, '[E]correction').lastInsertRowid;
  assert.equal(formatOf(versionId), 'ChordPro');
  assert.equal(formatOf(correctionId), 'ChordPro');
});

test('startup backfills format_detected for existing songs with chords', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-fmt-'));
  const dbPath = path.join(dir, 'test.db');
  const run = (code) => execFileSync(process.execPath, ['-e', code], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DB_PATH: dbPath },
    encoding: 'utf8',
  });
  try {
    // First start creates the schema; then plant rows as an old import left them.
    run(`
      const { db } = require('./lib/db');
      const u = db.prepare("INSERT INTO users (username, password_hash) VALUES ('old', 'x')").run().lastInsertRowid;
      const ins = db.prepare("INSERT INTO songs (user_id, title, content, visibility, status) VALUES (?, ?, ?, 'public', 'active')");
      ins.run(u, 'Old chords', '[G]a');
      ins.run(u, 'Old lyrics', 'words');
    `);
    const out = run(`
      const { db } = require('./lib/db');
      console.log(JSON.stringify(db.prepare('SELECT title, format_detected FROM songs ORDER BY title').all()));
    `);
    assert.deepEqual(JSON.parse(out), [
      { title: 'Old chords', format_detected: 'ChordPro' },
      { title: 'Old lyrics', format_detected: null },
    ]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
