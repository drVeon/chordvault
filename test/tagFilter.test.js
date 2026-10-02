process.env.DB_PATH = ':memory:';
const test = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('../lib/db');
const Song = require('../lib/models/song');

const insertUser = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, 'x')");
const insertSong = db.prepare(
  "INSERT INTO songs (user_id, title, content, visibility, status, tags) VALUES (?, ?, ?, ?, ?, ?)"
);

const u = insertUser.run('tagger').lastInsertRowid;
insertSong.run(u, 'Ledena', '[G]a', 'public', 'active', 'rock,hard');
insertSong.run(u, 'Silent Night', '[G]a', 'public', 'active', 'christmas,easy');
insertSong.run(u, 'Blue Suede', '[G]a', 'public', 'active', 'rockabilly');
insertSong.run(u, 'Untagged', '[G]a', 'public', 'active', null);
insertSong.run(u, 'Secret Rock', '[G]a', 'private', 'active', 'rock');

const publicTitles = (opts) => Song.listPublic(opts).map((r) => r.title).sort();
const myTitles = (opts) => Song.listForUser(u, opts).map((r) => r.title).sort();

test('tag filter matches first and last tag in the list', () => {
  assert.deepEqual(publicTitles({ tag: 'rock' }), ['Ledena']);
  assert.deepEqual(publicTitles({ tag: 'easy' }), ['Silent Night']);
});

test('tag filter matches whole tags only', () => {
  assert.deepEqual(publicTitles({ tag: 'roc' }), []);
  assert.deepEqual(publicTitles({ tag: 'rockabilly' }), ['Blue Suede']);
});

test('tag filter is case- and whitespace-insensitive', () => {
  assert.deepEqual(publicTitles({ tag: '  Rock ' }), ['Ledena']);
});

test('empty or non-string tag means no filter', () => {
  assert.equal(publicTitles({ tag: '' }).length, 4);
  assert.equal(publicTitles({ tag: ['rock', 'easy'] }).length, 4);
});

test('tag filter combines with text search', () => {
  assert.deepEqual(publicTitles({ tag: 'christmas', q: 'silent' }), ['Silent Night']);
  assert.deepEqual(publicTitles({ tag: 'rock', q: 'silent' }), []);
});

test('my songs tag filter includes private songs', () => {
  assert.deepEqual(myTitles({ tag: 'rock' }), ['Ledena', 'Secret Rock']);
});

test('tag filter works with pagination counts', () => {
  const res = Song.listForUser(u, { tag: 'rock', page: 1, limit: 20 });
  assert.equal(res.total, 2);
});
