import { createRequire } from 'node:module';

const { chromium } = createRequire(new URL('../frontend/package.json', import.meta.url))('playwright');
const base = process.env.CV_CHECK_BASE || 'http://localhost:5173';
const setlistId = process.env.CV_CHECK_SETLIST_ID;
if (!setlistId) throw new Error('Set CV_CHECK_SETLIST_ID to a local setlist containing a long-line English song, a Chinese song and a long bilingual title.');

const viewports = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'below-640', width: 639, height: 900, mobile: true },
  { name: 'above-640', width: 641, height: 900, mobile: true },
  { name: 'tablet-portrait', width: 768, height: 1024, mobile: true },
  { name: 'tablet-landscape', width: 1024, height: 768, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

function inspect() {
  const wrap = document.querySelector('.chord-sheet-wrap');
  const output = wrap.querySelector('#chord-output');
  const dock = document.querySelector('.playback-dock');
  const rows = [...document.querySelectorAll('#chord-output .row')].filter((row) => !row.querySelector('h3.label, .section-label'));
  const countWrapped = () => rows.filter((row) => {
    const tallest = Math.max(...[...row.children].map((c) => c.getBoundingClientRect().height), 0);
    return tallest > 0 && row.getBoundingClientRect().height > tallest * 1.5;
  }).length;
  const wrapped = countWrapped();

  // Does any size and column count fit the screen without wrapping? If not, Fit
  // is allowed to fall back to a wrapped layout and that is reported, not failed.
  const dockH = dock ? dock.getBoundingClientRect().height : 0;
  const avail = () => Math.min(innerHeight, visualViewport.height) - (output.getBoundingClientRect().top + scrollY) - dockH - 24;
  const twoCol = wrap.classList.contains('two-col');
  const scale = wrap.style.getPropertyValue('--font-scale');
  let cleanFitExists = false;
  for (let size = 3; size >= -3 && !cleanFitExists; size--) {
    for (const two of innerWidth >= 640 ? [true, false] : [false]) {
      wrap.classList.toggle('two-col', two);
      wrap.style.setProperty('--font-scale', String(1 + size * 0.12));
      if (output.scrollHeight <= avail() && wrap.scrollWidth <= wrap.clientWidth && !countWrapped()) { cleanFitExists = true; break; }
    }
  }
  wrap.classList.toggle('two-col', twoCol);
  if (scale) wrap.style.setProperty('--font-scale', scale); else wrap.style.removeProperty('--font-scale');

  window.scrollTo(0, document.documentElement.scrollHeight);
  const last = rows.at(-1)?.getBoundingClientRect().bottom ?? 0;
  const dockTop = dock ? dock.getBoundingClientRect().top : window.innerHeight;
  const title = document.querySelector('.playback-title-main');
  const bar = document.querySelector('.playback-topbar');
  return {
    barOverflow: bar.scrollWidth > bar.clientWidth,
    sheetOverflow: wrap.scrollWidth > wrap.clientWidth,
    pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
    wrappedChordRows: wrapped,
    cleanFitExists,
    lastLineHidden: last > dockTop + 1,
    hasDock: !!dock,
    titleTruncated: title ? getComputedStyle(title).textOverflow === 'ellipsis' : false,
  };
}

const browser = await chromium.launch({ channel: process.env.CV_CHECK_CHANNEL });
let failures = 0;
for (const scheme of ['light', 'dark']) {
  for (const vp of viewports) {
    for (const index of [0, 1, 2]) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
      await context.addInitScript((theme) => localStorage.setItem('cv_theme', theme), scheme);
      const page = await context.newPage();
      await page.goto(`${base}/#setlist/${setlistId}/play/${index}`);
      await page.locator('.chord-sheet .lyrics:not(:empty)').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.getByRole('button', { name: 'Fit', exact: true }).click();
      const r = await page.evaluate(inspect);
      const problems = [];
      if (r.sheetOverflow) problems.push('sheet scrolls sideways');
      if (r.pageOverflow) problems.push('page scrolls sideways');
      if (r.barOverflow) problems.push('top bar controls cut off');
      const notes = [];
      if (r.wrappedChordRows) (r.cleanFitExists ? problems : notes).push(`${r.wrappedChordRows} wrapped chord rows${r.cleanFitExists ? '' : ' (no layout fits without wrapping)'}`);
      if (r.lastLineHidden) problems.push('last line under the dock');
      if (r.hasDock !== vp.width < 1024) problems.push(`dock ${r.hasDock ? 'shown' : 'missing'}`);
      if (r.titleTruncated) problems.push('title truncated');
      const status = problems.length ? 'FAIL' : notes.length ? 'warn' : 'ok  ';
      const detail = [...problems, ...notes];
      console.log(`${status} ${scheme} ${vp.name} song ${index + 1}${detail.length ? ': ' + detail.join(', ') : ''}`);
      failures += problems.length ? 1 : 0;
      await context.close();
    }
  }
}
// Playback opened from inside the app runs the view-enter animation first; the
// dock must still sit on the bottom of the screen, not after the song.
// Touch screens also need 44px targets on every playback control.
for (const vp of viewports.filter((v) => v.mobile)) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${base}/#setlist/${setlistId}`);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.locator('.chord-sheet .lyrics:not(:empty)').first().waitFor();
  await page.waitForTimeout(400);
  const problems = await page.evaluate(() => {
    const out = [];
    const dock = document.querySelector('.playback-dock');
    if (dock && Math.abs(dock.getBoundingClientRect().bottom - innerHeight) > 1) out.push(`dock bottom at ${Math.round(dock.getBoundingClientRect().bottom)}, screen ends at ${innerHeight}`);
    const small = [...document.querySelectorAll('.playback-topbar button, .playback-topbar a, .playback-dock button')]
      .filter((b) => b.offsetParent && Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height) < 44)
      .map((b) => `${b.getAttribute('aria-label') || b.textContent.trim()} ${Math.round(b.getBoundingClientRect().height)}px`);
    if (small.length) out.push(`small targets: ${small.join(', ')}`);
    return out;
  });
  await page.getByRole('button', { name: 'Setlist defaults' }).click();
  const smallInPanel = await page.locator('.mantine-Popover-dropdown button').evaluateAll((els) => els
    .filter((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height) < 44)
    .map((b) => b.getAttribute('aria-label') || b.textContent.trim()));
  if (smallInPanel.length) problems.push(`small defaults targets: ${smallInPanel.join(', ')}`);
  console.log(`${problems.length ? 'FAIL' : 'ok  '} in-app ${vp.name}${problems.length ? ': ' + problems.join('; ') : ''}`);
  failures += problems.length ? 1 : 0;
  await context.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
