// Live match log for STU football (#/zapas/<day>/<HHMM>): lineup, clock, goals, subs, cards,
// undo, an offline queue and what other people see. The Google Apps Script backend is replaced by
// an in-page fetch mock that keeps its rows in localStorage, so a second page sees the same log.
// Needs the local server (python -m http.server 8765 in the repo root) and Node 22+.
// Usage: node tools/test_live.mjs [baseUrl]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CDP = process.env.CDP_LIB || join(homedir(), '.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs');
const { Browser, sleep } = await import(pathToFileURL(CDP).href);
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const STU = 'slovak-university-of-technology-in-bratislava';
const LIVE = 'https://live.test/exec';
const MATCH = '#/zapas/2026-11-06/0900';
const NOW = '?now=2026-11-06T08:50';

let failed = 0;
function check(name, ok, detail) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' ' + detail : ''}`);
}

// fetch mock of tools/live.gs: GET -> {ok, rows, roster}; POST {pin, op, ...}
const MOCK = (opts) => `(function () {
  window.WIUC_LIVE_URL = ${JSON.stringify(opts.url ? LIVE : '')};
  try {
    localStorage.setItem('wiuc.school', ${JSON.stringify(STU)}); localStorage.setItem('wiuc.lang', 'sk');
    ${opts.reader ? "localStorage.removeItem('wiuc.livePin'); localStorage.removeItem('wiuc.liveQueue');" : ''}
    ${opts.writer ? "localStorage.setItem('wiuc.livePin', '1234');" : ''}
    ${opts.seed ? `localStorage.setItem('__mock', ${JSON.stringify(JSON.stringify(opts.seed))});` : ''}
    ${opts.slow ? 'window.__liveDelay = 900;' : ''}
    ${opts.offline ? 'window.__liveOffline = true;' : ''}
    ${opts.fresh ? "localStorage.removeItem('__mock'); localStorage.removeItem('wiuc.livePin'); localStorage.removeItem('wiuc.liveQueue');" : ''}
  } catch (e) {}
  // the test match must not have an official result yet (the organiser fills it in on the day)
  var store;
  Object.defineProperty(window, 'WIUC_DATA', { configurable: true, get: function () { return store; }, set: function (v) {
    v.events.forEach(function (e) { if (e.sport === 'football' && e.day === '2026-11-06') { e.resA = ''; e.resB = ''; } });
    store = v;
  } });
  function db() { try { return JSON.parse(localStorage.getItem('__mock')) || { rows: [], roster: null }; } catch (e) { return { rows: [], roster: null }; } }
  function save(d) { localStorage.setItem('__mock', JSON.stringify(d)); }
  var real = window.fetch;
  window.__posts = 0;
  window.fetch = function (url, init) {
    if (String(url).indexOf(${JSON.stringify(LIVE)}) !== 0) return real.apply(this, arguments);
    if (window.__liveOffline) return Promise.reject(new TypeError('Failed to fetch'));
    var d = db(), out;
    if (init && init.method === 'POST') {
      window.__posts++;
      if (init.headers && /json/i.test(JSON.stringify(init.headers))) return Promise.reject(new TypeError('preflight'));
      var b = JSON.parse(init.body);
      if (b.pin !== '1234') out = { ok: false, error: 'pin' };
      else {
        if (b.op === 'add') b.rows.forEach(function (r) { if (!d.rows.some(function (x) { return x.id === r.id; })) d.rows.push(Object.assign({ deleted: 0 }, r)); });
        if (b.op === 'del') d.rows.forEach(function (r) { if (b.ids.indexOf(r.id) >= 0) r.deleted = 1; });
        if (b.op === 'roster') d.roster = b.roster;
        save(d); out = { ok: true };
      }
    } else out = { ok: true, rows: d.rows, roster: d.roster };
    if (window.__liveDelay && !(init && init.method === 'POST')) return new Promise(function (res) { setTimeout(function () { res(new Response(JSON.stringify(out), { status: 200 })); }, window.__liveDelay); });
    return Promise.resolve(new Response(JSON.stringify(out), { status: 200 }));
  };
})();`;

async function open(browser, opts, size = { width: 1440, height: 900 }) {
  const p = await browser.newPage(size);
  await p.send('Page.addScriptToEvaluateOnNewDocument', { source: MOCK(opts) });
  return p;
}
const txt = (sel) => `(() => { const n = document.querySelector(${JSON.stringify(sel)}); return n ? n.textContent.replace(/\\s+/g, ' ').trim() : ''; })()`;
async function click(p, sel) {
  const ok = await p.eval(`(() => { const n = document.querySelector(${JSON.stringify(sel)}); if (!n) return false; n.click(); return true; })()`);
  await sleep(250);
  return ok;
}
async function pick(p, nums, group) {
  for (const n of nums) await click(p, `.live-pick${group ? `[data-group="${group}"]` : ''} [data-num="${n}"]`);
}

const browser = await Browser.launch();
try {
  // --- without a backend address the feature stays hidden
  let p = await open(browser, { url: false, fresh: true });
  await p.goto(base + NOW + '#/s/' + STU, { settleMs: 700 });
  check('no backend: no match-log link', !(await p.eval(`!!document.querySelector('a[href^="#/zapas/"]')`)));
  await p.close();

  // --- writer
  p = await open(browser, { url: true, fresh: true });
  await p.goto(base + NOW + '#/s/' + STU, { settleMs: 700 });
  const links = await p.eval(`[...document.querySelectorAll('a[href^="#/zapas/"]')].map(a => a.getAttribute('href'))`);
  check('school view links STU football matches to the log', links.includes(MATCH), `(${links.join(', ')})`);
  await p.eval(`location.hash = ${JSON.stringify(MATCH)}`);
  await sleep(600);
  check('match page names the opponent', /Sciences Po Bordeaux/.test(await p.eval(txt('.dest h1'))), `(${await p.eval(txt('.dest h1'))})`);
  check('before kick-off 0 : 0', /0\s*:\s*0/.test(await p.eval(txt('.live-score'))), `(${await p.eval(txt('.live-score'))})`);
  check('readers get no writer controls', !(await p.eval(`!!document.querySelector('.live-write')`)));
  check('roster from the team list', /Fabian/.test(await p.eval(txt('.live-squad'))) && /Šága/.test(await p.eval(txt('.live-squad'))));

  await click(p, '[data-live="unlock"]');
  await p.eval(`(() => { const i = document.querySelector('#livePin'); i.value = '9999'; })()`);
  await click(p, '[data-live="pin-ok"]');
  await sleep(300);
  check('wrong PIN is refused', !(await p.eval(`!!document.querySelector('.live-write')`)) && /PIN/.test(await p.eval(txt('.live-msg'))), `(${await p.eval(txt('.live-msg'))})`);
  await p.eval(`(() => { const i = document.querySelector('#livePin'); i.value = '1234'; })()`);
  await click(p, '[data-live="pin-ok"]');
  await sleep(300);
  check('right PIN unlocks writing', await p.eval(`!!document.querySelector('.live-write')`));

  const pre = await p.eval(`[...document.querySelectorAll('.live-pick[data-group="lineup"] [data-num].on')].map(b => +b.dataset.num).sort((a, b) => a - b).join(',')`);
  check('half length defaults to 22.5 minutes', (await p.eval(`(document.getElementById('liveHalf') || {}).value`)) === '22.5');
  check('first-match starting XI is preselected', pre === '2,5,6,8,9,11,14,15,18,21,30', `(${pre})`);
  await click(p, '[data-live="lineup-save"]');
  await sleep(300);
  const field = await p.eval(`document.querySelectorAll('.live-field [data-num]').length`);
  check('lineup puts 11 players on the pitch', field === 11, `(${field})`);
  check('goalkeeper 30 is marked', await p.eval(`!!document.querySelector('.live-field [data-num="30"] .gk')`));

  await click(p, '[data-live="k1"]');
  await p.eval(`window.__liveSkew = 11.5 * 60000`);   // 11.5 minutes later
  await sleep(1200);
  check('clock runs in the first half', /1\. polčas/.test(await p.eval(txt('.live-clock'))) && /12'/.test(await p.eval(txt('.live-clock'))), `(${await p.eval(txt('.live-clock'))})`);

  await click(p, '[data-live="goal"]');
  await pick(p, [9], 'a'); await pick(p, [8], 'b');
  await click(p, '[data-live="save"]');
  check('STU goal: 1 : 0', /1\s*:\s*0/.test(await p.eval(txt('.live-score'))), `(${await p.eval(txt('.live-score'))})`);
  const top = await p.eval(txt('.live-timeline li'));
  check('timeline: scorer, assist, minute', /Drobný/.test(top) && /Hájnik/.test(top) && /12'/.test(top), `(${top})`);

  await click(p, '[data-live="ogoal"]');
  await click(p, '[data-live="save"]');
  check('opponent goal: 1 : 1', /1\s*:\s*1/.test(await p.eval(txt('.live-score'))), `(${await p.eval(txt('.live-score'))})`);

  await click(p, '[data-live="sub"]');
  const outChoices = await p.eval(`document.querySelectorAll('.live-pick[data-group="a"] [data-num]').length`);
  check('substitution offers only players on the pitch to go off', outChoices === 11, `(${outChoices})`);
  await pick(p, [11], 'a'); await pick(p, [17], 'b');
  await click(p, '[data-live="save"]');
  const onField = await p.eval(txt('.live-field'));
  const bench = await p.eval(txt('.live-bench'));
  check('substitution: Volf on, Cibira off', /Volf/.test(onField) && !/Cibira/.test(onField) && /Cibira/.test(bench), `(${onField})`);

  await click(p, '[data-live="yellow"]');
  await pick(p, [5], 'a');
  await click(p, '[data-live="save"]');
  check('yellow card on the player', await p.eval(`!!document.querySelector('.live-field [data-num="5"] .card-y')`));

  // offline: the goal counts at once and is sent later
  await p.eval(`window.__liveOffline = true`);
  await click(p, '[data-live="goal"]');
  await pick(p, [9], 'a');
  await click(p, '[data-live="save"]');
  await sleep(300);
  check('offline goal counts at once: 2 : 1', /2\s*:\s*1/.test(await p.eval(txt('.live-score'))), `(${await p.eval(txt('.live-score'))})`);
  check('unsent entries are shown', /1/.test(await p.eval(txt('.live-queue'))), `(${await p.eval(txt('.live-queue'))})`);
  await p.eval(`window.__liveOffline = false`);
  await click(p, '[data-live="retry"]');
  await sleep(500);
  const sent = await p.eval(`JSON.parse(localStorage.getItem('__mock')).rows.filter(r => r.type === 'goal').length`);
  check('queue is sent when back online', sent === 2 && !(await p.eval(txt('.live-queue'))), `(${sent} goals on the server)`);
  check('posts are plain text (no preflight)', await p.eval(`window.__posts > 0`));

  await click(p, '[data-live="undo"]');
  await sleep(400);
  check('undo removes the last entry: 1 : 1', /1\s*:\s*1/.test(await p.eval(txt('.live-score'))), `(${await p.eval(txt('.live-score'))})`);
  const del = await p.eval(`JSON.parse(localStorage.getItem('__mock')).rows.filter(r => r.deleted).length`);
  check('undo is a soft delete on the server', del === 1, `(${del})`);

  await click(p, '[data-live="h1"]');
  await p.eval(`window.__liveSkew = 40 * 60000`);
  await click(p, '[data-live="k2"]');
  await p.eval(`window.__liveSkew = 45 * 60000`);
  await sleep(1200);
  check('second half counts on from a 22.5-minute half', /2\. polčas/.test(await p.eval(txt('.live-clock'))) && /28'/.test(await p.eval(txt('.live-clock'))), `(${await p.eval(txt('.live-clock'))})`);
  // nobody pressed full time: well past the end the clock stops instead of counting 50+16'
  await p.eval(`window.__liveSkew = (40 + 22.5 + 16) * 60000`);
  await sleep(1200);
  const late = await p.eval(txt('.live-clock'));
  check('clock stops when full time was not entered', /skončil/.test(late) && !/\+/.test(late), `(${late})`);
  await p.close();

  // --- another person, phone size
  const r = await open(browser, { url: true, reader: true }, { width: 390, height: 844, dsf: 2, mobile: true });
  await r.goto(base + NOW + MATCH, { settleMs: 900 });
  check('reader sees the score', /1\s*:\s*1/.test(await r.eval(txt('.live-score'))), `(${await r.eval(txt('.live-score'))})`);
  check('reader sees the substitution', /Volf/.test(await r.eval(txt('.live-field'))));
  check('reader sees the timeline', (await r.eval(`document.querySelectorAll('.live-timeline li').length`)) >= 6);
  check('reader has no writer controls', !(await r.eval(`!!document.querySelector('.live-write')`)));
  check('phone: nothing wider than the screen', !(await r.eval(`document.documentElement.scrollWidth > innerWidth`)));

  // the next match: last result and the tournament totals per player
  await r.eval(`location.hash = '#/zapas/2026-11-06/1200'`);
  await sleep(900);
  const last = await r.eval(txt('.live-last'));
  check('next match shows the last result', /1\s*:\s*1/.test(last) && /Sciences Po Bordeaux/.test(last) && /Drobný/.test(last), `(${last})`);
  const stats = await r.eval(`[...document.querySelectorAll('.live-stats tbody tr')].map(tr => tr.textContent.replace(/\\s+/g, ' ').trim())`);
  const drob = stats.find((s) => /Drobný/.test(s)) || '';
  check('player totals: Drobný 1 goal (the undone one does not count)', /Drobný 1\b/.test(drob), `(${drob})`);
  check('player totals: Hájnik has an assist', stats.some((s) => /Hájnik 0 1/.test(s)), `(${stats.find((s) => /Hájnik/.test(s)) || ''})`);
  check('player totals: Maťoška has a yellow card', stats.some((s) => /Maťoška 0 0 1/.test(s)), `(${stats.find((s) => /Maťoška/.test(s)) || ''})`);
  check('player totals: matches played counted', /Volf/.test(stats.join('|')), `(${stats.length} rows)`);

  // the schedule shows the logged score until the organiser enters the result
  await r.eval(`location.hash = '#/s/${STU}'`);
  await sleep(900);
  const badge = await r.eval(`(() => { const a = document.querySelector('a[href="${MATCH}"]'); const li = a && a.closest('.ev'); const b = li && li.querySelector('.badge.logged'); return b ? b.textContent.replace(/\\s+/g, ' ').trim() : ''; })()`);
  check('schedule card shows the logged score', /1\s*:\s*1/.test(badge), `(${badge})`);
  const other = await r.eval(`(() => { const a = document.querySelector('a[href="#/zapas/2026-11-06/1200"]'); const li = a && a.closest('.ev'); return !!(li && li.querySelector('.badge.logged')); })()`);
  check('no logged score on a match without entries', !other);
  await r.close();

  // --- writer opens the page again while the log is still loading: no second line-up prompt
  const w2 = await open(browser, { url: true, writer: true, slow: true });
  await w2.goto(base + NOW + MATCH, { settleMs: 100 });
  await sleep(1600);
  check('slow load: saved line-up is used, no line-up prompt', !(await w2.eval(`!!document.querySelector('.live-pick[data-group="lineup"]')`)) &&
    (await w2.eval(`document.querySelectorAll('.live-field [data-num]').length`)) === 11);
  check('slow load: writer buttons appear', await w2.eval(`!!document.querySelector('[data-live="goal"]')`));
  await w2.close();

  // --- writer opens the page with no signal: can still write, says it is offline
  const w3 = await open(browser, { url: true, writer: true, offline: true });
  await w3.goto(base + NOW + MATCH, { settleMs: 900 });
  check('no signal: writer controls still there', await w3.eval(`!!document.querySelector('.live-write')`));
  check('no signal: says so', /Bez spojenia/.test(await w3.eval(txt('.live-upd'))), `(${await w3.eval(txt('.live-upd'))})`);
  await w3.close();

  // a match decided on penalties: the note on full time is shown
  const K = Date.UTC(2026, 10, 6, 16, 0, 0), M = 'football|2026-11-06|17:00';
  const seed = { roster: null, rows: [
    { id: 'p1', ts: K - 60000, match: M, type: 'lineup', minute: '', a: '2,3,4,6,11,12,14,15,18,19,22', b: '22', note: '22.5', deleted: 0 },
    { id: 'p2', ts: K, match: M, type: 'k1', minute: '', a: '', b: '', note: '', deleted: 0 },
    { id: 'p3', ts: K + 360000, match: M, type: 'goal', minute: '6', a: '12', b: '', note: '', deleted: 0 },
    { id: 'p4', ts: K + 2940000, match: M, type: 'ogoal', minute: '', a: '', b: '', note: '', deleted: 0 },
    { id: 'p5', ts: K + 3030000, match: M, type: 'ft', minute: '45', a: '', b: '', note: 'penalty 3 : 4', deleted: 0 },
  ] };
  const pen = await open(browser, { url: true, reader: true, seed });
  await pen.goto(base + '?now=2026-11-08T10:00#/zapas/2026-11-06/1700', { settleMs: 900 });
  const pc = await pen.eval(txt('.live-clock'));
  check('penalty result shown at full time', /Koniec zápasu/.test(pc) && /penalty 3 : 4/.test(pc), `(${pc})`);
  check('penalty result in the timeline', /penalty 3 : 4/.test(await pen.eval(txt('.live-timeline li'))));
  await pen.close();
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
