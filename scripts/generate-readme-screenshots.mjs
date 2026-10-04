import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const { chromium } = createRequire(new URL('../frontend/package.json', import.meta.url))('playwright');
const base = process.env.CV_SCREENSHOT_BASE || 'http://127.0.0.1:3108';
const songId = process.env.CV_SCREENSHOT_SONG_ID;
const setlistId = process.env.CV_SCREENSHOT_SETLIST_ID;
if (!songId || !setlistId) throw new Error('Set CV_SCREENSHOT_SONG_ID and CV_SCREENSHOT_SETLIST_ID to public sample records in the disposable local instance.');
const output = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CV_SCREENSHOT_BROWSER_CHANNEL });

async function capture(filename, route, scheme, mobile = false) {
  // Fresh anonymous contexts share the server's five-second burst window.
  await setTimeout(5100);
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce',
  });
  await context.addInitScript((theme) => { localStorage.setItem('cv_theme', theme); localStorage.setItem('cv_fontsize', '0'); }, scheme);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/${route}`);
  await page.locator(`html[data-mantine-color-scheme="${scheme}"]`).waitFor();
  await page.locator(route ? '.chord-sheet .lyrics:not(:empty)' : '.song-card').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (route.includes('/play/')) await page.getByRole('button', { name: 'Fit', exact: true }).click();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (errors.length) throw new Error(errors.join('\n'));
  await page.screenshot({ path: `${output}${filename}`, fullPage: true });
  console.log(`Captured ${filename} (${scheme}, ${mobile ? '390x844 Chromium mobile layout' : '1280x900'})`);
  await context.close();
}

try {
  await capture('browse.png', '', 'dark');
  await capture('song-view.png', `#song/${songId}`, 'dark');
  await capture('song-view-light.png', `#song/${songId}`, 'light');
  await capture('mobile-song-view.png', `#song/${songId}`, 'light', true);
  await capture('setlist-play.png', `#setlist/${setlistId}/play/0`, 'dark');
  await capture('setlist-play-light.png', `#setlist/${setlistId}/play/0`, 'light');
} finally {
  await browser.close();
}
