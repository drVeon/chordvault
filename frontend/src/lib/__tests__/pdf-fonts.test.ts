import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { needsEmbeddedFont, unsupportedChars } from '../pdf-fonts';

function fontTables(filename: string) {
  const bytes = readFileSync(resolve(process.cwd(), 'src/assets', filename));
  const tables: Record<string, number> = {};
  for (let i = 0; i < bytes.readUInt16BE(4); i++) {
    const offset = 12 + i * 16;
    tables[bytes.toString('ascii', offset, offset + 4)] = bytes.readUInt32BE(offset + 8);
  }
  return { bytes, tables };
}

describe('embedded PDF faces', () => {
  it.each([['NotoSansTC.ttf', 400], ['NotoSansTC-Semibold.ttf', 600]])(
    'uses a static %s face at weight %i', (filename, weight) => {
      const { bytes, tables } = fontTables(filename as string);
      expect(bytes.readUInt16BE(tables['OS/2'] + 4)).toBe(weight);
      expect(tables.fvar).toBeUndefined();
    },
  );
});

describe('needsEmbeddedFont', () => {
  it('is false for a plain English song, newlines and all', () => {
    expect(needsEmbeddedFont('{title: Amazing Grace}\n{key: G}\n[G]sweet the [C]sound\n')).toBe(false);
  });
  it('is false for Latin-1 accents', () => {
    expect(needsEmbeddedFont('Café Días')).toBe(false);
  });
  it('is true for Chinese', () => {
    expect(needsEmbeddedFont('奇異恩典')).toBe(true);
  });
  it('is true for mixed content', () => {
    expect(needsEmbeddedFont('奇異恩典 Amazing Grace')).toBe(true);
  });
});

describe('unsupportedChars', () => {
  // Regression guard: an earlier draft treated \n as unsupported, so every
  // English export warned and users would have learned to ignore it.
  it('finds nothing in a real English song', () => {
    expect(unsupportedChars('{title: T}\n[G]la la\n\tx\r\n')).toEqual([]);
  });
  it('finds nothing in Chinese', () => {
    expect(unsupportedChars('奇異恩典 何等甘甜')).toEqual([]);
  });
  // Noto Sans TC covers kana but NOT hangul — verified against the real font
  it('finds nothing in Japanese kana', () => {
    expect(unsupportedChars('こんにちは')).toEqual([]);
  });
  it('flags Korean', () => {
    expect(unsupportedChars('안녕하세요').length).toBeGreaterThan(0);
  });
  it('flags Thai', () => {
    expect(unsupportedChars('สวัสดี').length).toBeGreaterThan(0);
  });
  it('deduplicates', () => {
    expect(unsupportedChars('안안안')).toEqual(['안']);
  });
});
