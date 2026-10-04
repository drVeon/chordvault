// A bracketed ChordPro chord such as [G] or [F#m7]: the same test validateSongInput
// applies before saving a song that must have chords.
const CHORD_RE = /\[[A-G][^\]]*\]/;

// The editor sends the detected format with each save; imports, versions and
// corrections don't, so derive it from the content. The format is ChordPro
// once the content carries a bracketed chord.
function detectStoredFormat(content) {
  return content && CHORD_RE.test(content) ? 'ChordPro' : null;
}

module.exports = { CHORD_RE, detectStoredFormat };
