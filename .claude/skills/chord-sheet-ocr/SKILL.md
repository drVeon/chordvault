---
name: chord-sheet-ocr
description: Transcribe photographed chord sheets in a folder into ChordPro .cho files for ChordVault import.
disable-model-invocation: true
argument-hint: <folder>
---

# Chord sheet OCR

Turn each photo of a chord sheet in the folder `$ARGUMENTS` into a ChordPro file with the same basename (`20261002_220623.jpg` → `20261002_220623.cho`), written next to the image.

## Steps

1. **Collect.** List the images in the folder (`.jpg`, `.jpeg`, `.png`, `.webp`) that have no `.cho` with the same basename. Done when you have the list. If it is empty, say so and stop.
2. **Transcribe** each image in its own general-purpose subagent, pointing it at this file (`.claude/skills/chord-sheet-ocr/SKILL.md`), its Transcription rules, and the image and output paths. One subagent per image keeps photos out of your context and contains a blocked image (below) to that one song. The subagents run in parallel and share one scratchpad, so tell each to keep any crops or temporary files in a subfolder named after its image's basename (`scratchpad/20261004_094624/`), and to apply the photo's EXIF orientation before cropping (`magick in.jpg -auto-orient …`): phone photos are often stored sideways. Never merge two photos into one file, even if they look like pages of the same song. Done when every listed image has its `.cho` (full or skeleton) and each file passes the Import check.
3. **Report** one line per file: the song title, its key, its tags (with any suggested genre, see Tags), and its `# Check:` items. List every skeleton file separately under **Blocked**, so the user knows which songs need lyrics typed in or the app's own OCR (**Import from image or PDF** in the song editor). End by telling the user to import the files in ChordVault from **Settings → Import Songs**: select all the `.cho` files at once. The import runs as an admin, makes songs public, and skips songs already in the library.

### Blocked images

The API's output filter can block a reply that reproduces a well-known song's complete lyrics (seen with "I Want to Break Free"); the subagent then fails with `Output blocked by content filtering policy`. When a subagent fails that way, dispatch a fresh subagent for the same image to write a **skeleton** file instead:

- The full header and every section label, chord-only line, and `# Check:` item, exactly as a full transcription would have them.
- Each lyric line cut to its first two or three words as an anchor, keeping the chords that fall on those words, then `…` and the rest of that line's chords in order: `[G]I want to …[C] [G]`.
- Right after the header directives: `# Skeleton: lyrics left out because the transcription was blocked. Fill them in from the sheet.`

Retry a blocked image only as a skeleton, never as a second full transcription. If the skeleton is blocked too (seen with "Delilah"), dispatch one last subagent for a **chords-only** file: the same header and section labels, one bracketed chord line per lyric line, `# Check:` lines without quoted lyrics, no lyric words anywhere, and `# Chords only: lyrics left out because the transcription was blocked. Fill them in from the sheet.` after the header. Stop there; a block on that leaves the image for the app's own OCR.

## Transcription rules

### Chord names

Sheets use Central European notation:

- A lowercase letter is a minor chord: `a` → `Am`, `e` → `Em`, `c#` → `C#m`.
- `H`/`h` is B: `h` → `Bm`, `h7` → `Bm7`, `H` → `B`. Write `B`, never `H`.
- A printed `B` is ambiguous (B or B♭). Decide from the key: B in keys like E, A, D, G (where B or B7 is a diatonic chord); B♭ in F, B♭, E♭. Add a `# Check:` line whenever you had to decide.
- Melody note names (`H1 C#2 A1`, "VOKAL g h D E") are notes, not chords. They never go in brackets.

### Which key to write

- **Chord groups** like `G(F#)A` or `a(g#)h` give the same chord in two or three keys. Use the first chord of each group. The parenthesized key is usually the recording's.
- **Original key** is the recording's key: the key printed after the artist (`Siddharta (A)`, `Josh Turner (F#)`). A key printed `B` there means B♭ (`Gu Gu (B)` → `Bb`); B natural is printed `H`. When it differs from the key you write, set `{x_original_key: A}`.
- **Handwritten chords win.** Handwriting that renames every printed chord by one fixed interval (printed E, A, B7 with handwritten G, C, D7) is a transposition: write the whole song in the handwritten key by applying that interval to every chord, including ones without handwriting. Set `{x_original_key:}` to the key after the artist, or to the printed chords' key when no key follows the artist. A single handwritten chord written over a printed one (a `D7` above `D(E)`) is a correction: use the handwritten chord.

### Placement

- A chord goes immediately before the syllable under its **left edge**, inside the word if needed (`pre[D7]več`). Estimate where the left edge falls along the lyric line below it.
- A chord printed between two lines belongs to the line below it.
- A chord with nothing under it at the end of a line still goes at the end of that line: `ta [Gsus4]led [G]`.
- Chord-only lines (intro, solo, interlude) are space-separated bracketed chords: `[C] [D7] [Gsus4] [G]`. Write a chord-to-chord dash (`G-C`) as two chords.

### Text and structure

- Copy the lyrics exactly as printed: spelling, hyphens, dots, `…`, and the `_` beat markers that show where a chord lands before the words.
- Section labels are plain lines in English (the app recognizes these words): `Intro`, `Verse 1`, `Pre-Chorus`, `Chorus`, `Bridge`, `Solo`, `Refrain`, `Outro`. Translate sheet labels (`Uvod` → `Intro`). Put repeat marks in the label: `Intro (2x)`.
- An abbreviated repeat (`Baby lock the door…`) of a section written out earlier on the sheet: write it out in full at the end of the song, where the closing section is played. Earlier repeats may stay abbreviated as the sheet has them. A `…` that points to text not on the sheet stays `…`.
- Handwritten notes that aren't chords (melody notes, strum hints like "Up"/"Dol") become `#` comment lines just above the line they belong to.

### Header

Header directives in this order, then a blank line, then any `#` notes:

```chordpro
{title: Your Man}
{artist: Josh Turner}
{key: G}
{x_original_key: F#}
{tempo: 76}
{x_tags: medium}
{x_language: en}
# The sheet gives each chord in G, F# and A.
# Check: [D]mind and [D]to at the end of each bridge.
```

- `{title:}` in normal case (`LEDENA` → `Ledena`). The import rejects a file without it.
- `{key:}` is the key you wrote the chords in.
- `{tempo:}` only when the sheet gives a BPM (often a handwritten number by the artist). Count-ins ("1 2 3 4") are `#` comments where they appear.
- `{x_tags:}` as described under Tags.
- `{x_language:}` is the lyrics' ISO 639-1 code (`sl`, `en`, `hr`). The import rejects an invalid code.
- One `# Check:` line per spot you were unsure of: a guessed chord placement, an unreadable handwritten mark, an ambiguous `B`, text cut off at the page edge. These are the user's proofreading list.

### Tags

`{x_tags:}` is a comma-separated list, lowercase, no spaces: `{x_tags: rock,medium}`. Use only ChordVault's preset tags: `easy`, `medium`, `hard`, `instrumental`, `pop`, `rock`, `folk`, `singer-songwriter`, `country`, `christmas`. Leave the line out when no tag applies.

- **Genre**: one of `pop`, `rock`, `country`, `folk` (including klapa and other traditional styles) or `singer-songwriter` (kantavtor), from what you know of the artist and song; `folk,singer-songwriter` together when both clearly apply. Unsure of the artist: do one web search (`<artist> glasba žanr` for a Slovenian or other regional artist). When none fits (blues, soul, schlager), tag no genre and name the real one in your report as a suggestion; never invent a tag.
- **christmas**: the lyrics are about Christmas (Christmas, božič, sveta noč, Božiček, Jezušček).
- **instrumental**: the sheet has chords but no lyrics.
- **Difficulty** (exactly one, or none when the sheet has no chords at all) from the chords in the file. Count distinct chords with 7ths and sus variants folded in (`C7` counts as `C`). Barre chords: F, B, Bm, any chord with a sharp or flat root (F#m, C#, B♭, E♭, …), and any minor other than Am, Em, Dm.
  - `easy`: no barre chord and at most 5 distinct chords.
  - `medium`: one or two barre chords, 6–8 distinct chords, or a key change.
  - `hard`: three or more barre chords, 9 or more distinct chords, or jazz chords (dim, aug, m7b5, and maj7/9/11/13 chords that need a barre). Chords with an open shape count as their plain chord: `Cmaj7`, `Fmaj7`, `G9`, and a slash chord in a bass walk-down (`G/B`, `C/G`).
- **Artist names**: on these sheets "Don Holc", "Dom Holc" and "D.H." all mean **Dean Holc**; write `{artist: Dean Holc}` (not the better-known Domen Don Holc of Koala Voice).
- **Settled artists** keep the genre already chosen for them, over a fresh guess: `pop` for Andrej Šifrer, Brendi, Neca Falk, Pepel in kri, Gu Gu, Oliver Dragojević, Magnifico, Novi Fosili, Čudežna polja, Elvis Presley; `rock` for Siddharta, Queen, Creedence Clearwater Revival, Rod Stewart, The Beatles, Guns N' Roses, Status Quo, The Animals, Hazard, Bazar; `singer-songwriter` for Tomaž Domicelj, Adi Smolar, Aleksander Mežek, Cat Stevens, Dean Holc; `folk` for Klapa Sufit; `country` for Josh Turner, Chris Stapleton.

## Import check

Every file starts with `{title:}` and has a valid `{x_language:}`. Every bracket holds a chord name (no `H`, no melody notes). Every `# Check:` item is also in your report, and every skeleton file is under **Blocked**.
