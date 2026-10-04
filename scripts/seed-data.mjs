/**
 * seed-data.mjs — Seeds ChordVault with demo data via direct DB access.
 *
 * Usage: node scripts/seed-data.mjs
 *
 * Creates a hidden _system owner and a demo admin user with sample data.
 * Uses CommonJS require for better-sqlite3 and bcryptjs (bundled in node_modules).
 */

import { createRequire } from 'module';
import crypto from 'crypto';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = './data/chordvault.db';

// Open DB — server.js hasn't started yet, so we init tables ourselves
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables (same schema as lib/db.js)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'user',
    disabled      INTEGER DEFAULT 0,
    gemini_api_key TEXT DEFAULT NULL,
    gemini_prompt  TEXT DEFAULT NULL,
    preferred_languages TEXT DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS songs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    artist          TEXT DEFAULT '',
    key             TEXT DEFAULT '',
    content         TEXT NOT NULL,
    visibility      TEXT DEFAULT 'public',
    parent_id       INTEGER REFERENCES songs(id) ON DELETE SET NULL,
    youtube_url     TEXT DEFAULT NULL,
    format_detected TEXT DEFAULT NULL,
    bpm             INTEGER DEFAULT NULL,
    tags            TEXT DEFAULT NULL,
    language        TEXT NOT NULL DEFAULT '',
    status          TEXT DEFAULT 'active',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS setlists (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    visibility TEXT DEFAULT 'private',
    event_date TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS setlist_songs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    setlist_id       INTEGER REFERENCES setlists(id) ON DELETE CASCADE,
    song_id          INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    position         INTEGER NOT NULL,
    transpose        INTEGER DEFAULT 0,
    nashville        INTEGER DEFAULT 0,
    content_override TEXT DEFAULT NULL
  );
  CREATE TABLE IF NOT EXISTS invites (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_by    INTEGER REFERENCES users(id) DEFAULT NULL,
    used_at    DATETIME DEFAULT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_songs_user_status ON songs(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_songs_visibility_status ON songs(visibility, status);
  CREATE INDEX IF NOT EXISTS idx_songs_parent_id ON songs(parent_id);
  CREATE INDEX IF NOT EXISTS idx_setlists_user ON setlists(user_id);
  CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist ON setlist_songs(setlist_id, position);
  CREATE INDEX IF NOT EXISTS idx_songs_language ON songs(language);
`);

// Settings
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('allow_registration', '0')").run();

// Step 1: Create hidden _system owner
const systemPassword = crypto.randomBytes(32).toString('hex');
const systemHash = bcrypt.hashSync(systemPassword, 10);
console.log('Creating hidden owner: _system');
db.prepare("INSERT INTO users (username, password_hash, role) VALUES ('_system', ?, 'owner')").run(systemHash);
const systemUser = db.prepare("SELECT id FROM users WHERE username = '_system'").get();
console.log(`  Created _system (id: ${systemUser.id}, role: owner)`);

// Step 2: Create demo admin user
const demoHash = bcrypt.hashSync('demopass123', 10);
console.log('Creating demo admin user...');
db.prepare("INSERT INTO users (username, password_hash, role) VALUES ('demo', ?, 'admin')").run(demoHash);
const demoUser = db.prepare("SELECT id FROM users WHERE username = 'demo'").get();
console.log(`  Created demo (id: ${demoUser.id}, role: admin)`);

// Step 3: Create songs owned by demo user
const songs = [
  {
    title: 'Amazing Grace',
    artist: 'John Newton',
    content: `{title: Amazing Grace}\n{artist: John Newton}\n{key: G}\n\n{start_of_verse: Verse 1}\n[G]Amazing grace, how [G7]sweet the [C]sound\nThat [C]saved a [G]wretch like [Em]me[D]\n[G]I once was lost, but [G7]now am [C]found\nWas [C]blind but [G]now [D]I [G]see\n{end_of_verse}\n\n{start_of_verse: Verse 2}\n[G]'Twas grace that [G7]taught my [C]heart to fear\nAnd [C]grace my [G]fears re[Em]lieved[D]\n[G]How precious [G7]did that [C]grace appear\nThe [C]hour I [G]first [D]be[G]lieved\n{end_of_verse}\n\n{start_of_verse: Verse 3}\n[G]Through many [G7]dangers, [C]toils and snares\nI [C]have al[G]ready [Em]come[D]\n[G]'Tis grace hath [G7]brought me [C]safe thus far\nAnd [C]grace will [G]lead [D]me [G]home\n{end_of_verse}`,
    key: 'G', language: 'en', tags: 'hymn,worship', bpm: 72, format_detected: 'ChordPro',
    youtube_url: 'https://www.youtube.com/watch?v=Jbe7OruLk8I',
  },
  {
    title: 'It Is Well with My Soul',
    artist: 'Horatio Spafford',
    content: `{title: It Is Well with My Soul}\n{artist: Horatio Spafford}\n{key: C}\n\n{start_of_verse: Verse 1}\nWhen [C]peace like a [F]river at[C]tendeth my way,\nWhen [Am]sorrows like [D7]sea billows [G]roll;\nWhat[C]ever my [F]lot, Thou hast [C]taught me to [Am]say,\nIt is [F]well, it is [G7]well with my [C]soul.\n{end_of_verse}\n\n{start_of_chorus}\nIt is [G]well (it is [C]well)\nWith my [G]soul (with my [C]soul),\nIt is [F]well, it is [G7]well with my [C]soul.\n{end_of_chorus}\n\n{start_of_verse: Verse 2}\nThough [C]Satan should [F]buffet, though [C]trials should come,\nLet [Am]this blest as[D7]surance con[G]trol,\nThat [C]Christ has re[F]garded my [C]helpless es[Am]tate,\nAnd hath [F]shed His own [G7]blood for my [C]soul.\n{end_of_verse}`,
    key: 'C', language: 'en', tags: 'hymn,worship', bpm: 72, format_detected: 'ChordPro',
  },
  {
    title: 'Blessed Assurance',
    artist: 'Fanny Crosby',
    content: `{title: Blessed Assurance}\n{artist: Fanny Crosby}\n{key: D}\n\n{start_of_verse: Verse 1}\n[D]Blessed as[G]surance, [D]Jesus is mine!\n[D]O what a [E7]foretaste of [A]glory divine!\n[D]Heir of sal[G]vation, [D]purchase of [Bm]God,\n[E7]Born of His [D]Spirit, [A7]washed in His [D]blood.\n{end_of_verse}\n\n{start_of_chorus}\n[D]This is my [G]story, [D]this is my song,\n[A]Praising my [E7]Savior all [A]the day long;\n[D]This is my [G]story, [D]this is my [Bm]song,\n[G]Praising my [D]Savior [A7]all the day [D]long.\n{end_of_chorus}\n\n{start_of_verse: Verse 2}\n[D]Perfect sub[G]mission, [D]perfect delight,\n[D]Visions of [E7]rapture now [A]burst on my sight;\n[D]Angels de[G]scending [D]bring from a[Bm]bove\n[E7]Echoes of [D]mercy, [A7]whispers of [D]love.\n{end_of_verse}`,
    key: 'D', language: 'en', tags: 'hymn,opener', bpm: 96, format_detected: 'ChordPro',
  },
  {
    title: 'Holy, Holy, Holy',
    artist: 'Reginald Heber',
    content: `{title: Holy, Holy, Holy}\n{artist: Reginald Heber}\n{key: D}\n\n{start_of_verse: Verse 1}\n[D]Holy, holy, [Bm]holy! [G]Lord God Al[D]mighty!\nEarly in the [G]morning our [E7]song shall rise to [A]Thee;\n[D]Holy, holy, [Bm]holy, [G]merciful and [D]mighty!\n[G]God in three [D]Persons, [A7]blessed Trini[D]ty!\n{end_of_verse}\n\n{start_of_verse: Verse 2}\n[D]Holy, holy, [Bm]holy! [G]All the saints a[D]dore Thee,\nCasting down their [G]golden crowns a[E7]round the glassy [A]sea;\n[D]Cherubim and [Bm]seraphim [G]falling down be[D]fore Thee,\n[G]Who wast, and [D]art, and [A7]evermore shalt [D]be.\n{end_of_verse}`,
    key: 'D', language: 'en', tags: 'hymn,worship', bpm: 84, format_detected: 'ChordPro',
  },
  {
    title: 'Come Thou Fount of Every Blessing',
    artist: 'Robert Robinson',
    content: `{title: Come Thou Fount of Every Blessing}\n{artist: Robert Robinson}\n{key: D}\n\n{start_of_verse: Verse 1}\n[D]Come, Thou Fount of [G]every [D]blessing,\nTune my heart to [A]sing Thy [D]grace;\nStreams of mercy, [G]never [D]ceasing,\nCall for songs of [A]loudest [D]praise.\n{end_of_verse}\n\n{start_of_bridge: Refrain}\n[A]Teach me some me[D]lodious [A]sonnet,\n[A]Sung by flaming [D]tongues a[A]bove;\n[D]Praise the mount! I'm [G]fixed up[D]on it,\nMount of Thy re[A]deeming [D]love.\n{end_of_bridge}`,
    key: 'D', language: 'en', tags: 'hymn,closer', bpm: 88, format_detected: 'ChordPro',
  },
  {
    title: 'Silent Night',
    artist: 'Franz Gruber',
    content: `{title: Silent Night}\n{artist: Franz Gruber}\n{key: C}\n\n{start_of_verse: Verse 1}\n[C]Silent night, holy [C]night\n[G7]All is calm, [C]all is bright\n[F]Round yon Virgin [C]Mother and Child\n[F]Holy Infant so [C]tender and mild\n[G7]Sleep in heavenly [Am]peace[F]\n[C]Sleep [G7]in heavenly [C]peace\n{end_of_verse}\n\n{start_of_verse: Verse 2}\n[C]Silent night, holy [C]night\n[G7]Shepherds quake [C]at the sight\n[F]Glories stream from [C]heaven afar\n[F]Heavenly hosts sing [C]Alleluia\n[G7]Christ the Savior is [Am]born[F]\n[C]Christ [G7]the Savior is [C]born\n{end_of_verse}\n\n{start_of_verse: Verse 3}\n[C]Silent night, holy [C]night\n[G7]Son of God, [C]love's pure light\n[F]Radiant beams from [C]Thy holy face\n[F]With the dawn of re[C]deeming grace\n[G7]Jesus, Lord, at Thy [Am]birth[F]\n[C]Jesus, [G7]Lord, at Thy [C]birth\n{end_of_verse}`,
    key: 'C', language: 'en', tags: 'hymn,christmas', bpm: 60, format_detected: 'ChordPro',
  },
];

const insertSong = db.prepare(`
  INSERT INTO songs (user_id, title, artist, key, content, language, tags, bpm, format_detected, youtube_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

console.log('\nCreating songs...');
const songIds = [];
for (const s of songs) {
  const result = insertSong.run(
    demoUser.id, s.title, s.artist, s.key, s.content,
    s.language, s.tags, s.bpm, s.format_detected, s.youtube_url || null
  );
  songIds.push(result.lastInsertRowid);
  console.log(`  ✓ ${s.title} (id: ${result.lastInsertRowid})`);
}

// Step 4: Create setlists
const insertSetlist = db.prepare(`
  INSERT INTO setlists (user_id, name, visibility, event_date)
  VALUES (?, ?, ?, ?)
`);
const insertSetlistSong = db.prepare(`
  INSERT INTO setlist_songs (setlist_id, song_id, position, transpose)
  VALUES (?, ?, ?, 0)
`);

console.log('\nCreating setlists...');

const sl1 = insertSetlist.run(demoUser.id, 'Sunday Morning Worship', 'public', '2026-03-23');
console.log(`  ✓ Sunday Morning Worship (id: ${sl1.lastInsertRowid}, public)`);
// Opens with a song that has a chorus, so playback shows every section style.
[1, 2, 3, 0].forEach((songIdx, position) => insertSetlistSong.run(sl1.lastInsertRowid, songIds[songIdx], position));
console.log('    Added 4 songs');

const sl2 = insertSetlist.run(demoUser.id, 'Christmas Eve Service', 'public', '2025-12-24');
console.log(`  ✓ Christmas Eve Service (id: ${sl2.lastInsertRowid}, public)`);
if (songIds[5]) insertSetlistSong.run(sl2.lastInsertRowid, songIds[5], 0);
if (songIds[0]) insertSetlistSong.run(sl2.lastInsertRowid, songIds[0], 1);
console.log('    Added 2 songs');

const sl3 = insertSetlist.run(demoUser.id, 'Personal Practice', 'private', '2026-03-19');
console.log(`  ✓ Personal Practice (id: ${sl3.lastInsertRowid}, private)`);
if (songIds[4]) insertSetlistSong.run(sl3.lastInsertRowid, songIds[4], 0);

db.close();
console.log('\n✅ Seed complete!');
