// Play-off bracket (#/playoff): rounds in order, winners carried into the next round,
// draws and unfinished games left open, finals built from the semi-finals.
// Results are injected before app.js runs, because the real play-off has not been played yet.
// Needs the local server (python -m http.server 8765 in the repo root) and Node 22+.
// Usage: node tools/test_playoff.mjs [baseUrl]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CDP = process.env.CDP_LIB || join(homedir(), '.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs');
const { Browser, sleep } = await import(pathToFileURL(CDP).href);
const base = process.argv[2] || 'http://127.0.0.1:8765/';

let failed = 0;
function check(name, ok, detail) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' ' + detail : ''}`);
}

// Football men: 1/8 games 1 and 2 played, game 3 a draw (decided on penalties, not in the data).
// Both semi-finals played with names filled in by the organiser.
const PATCH = `(function () {
  var S = function (id) { return { label: id, school: id, squad: null }; };
  function ko(e, sport, cat, game) { return e.sport === sport && e.cat === cat && !e.pool && e.game === game; }
  // the organiser fills in names and results during the tournament: start from the published placeholders
  var R16 = { 1: ['1A', '2G'], 2: ['1B', '2F'], 3: ['1C', '2E'], 4: ['1D', '2H'], 5: ['1E', '2D'], 6: ['1F', '2C'], 7: ['1G', '2B'], 8: ['1H', '2A'] };
  var QF = { 9: ['(1)', '(2)'], 10: ['(3)', '(4)'], 11: ['(5)', '(6)'], 12: ['(7)', '(8)'] };
  var P = function (label) { return { label: label, school: null, squad: null }; };
  // quarter-finals by kick-off time, as first published (the organiser renumbered them later)
  var QF_AT = { '08:40': ['10'], '09:00': ['11', '12'], '09:40': ['9'] };
  function reset(d) {
    var seen09 = 0;
    d.events.forEach(function (e) {
      if (e.sport !== 'football' || e.cat !== 'M') return;
      e.resA = ''; e.resB = '';
      if (e.pool) return;
      var pair = null;
      if (/1\\/8/i.test(e.stage)) pair = R16[e.game];
      else if (/^quarter/i.test(e.stage)) { var g = QF_AT[e.time] && QF_AT[e.time][e.time === '09:00' ? seen09++ : 0]; if (g) { e.game = g; pair = QF[g]; } }
      else if (/^semi/i.test(e.stage)) { e.game = ''; pair = e.time === '11:00' ? ['(11)', '(12)'] : ['(9)', '(10)']; }
      else if (/final/i.test(e.stage)) pair = ['', ''];
      if (pair) { e.a = P(pair[0]); e.b = P(pair[1]); }
    });
  }
  function fix(d) {
    reset(d);
    var semis = [];
    d.events.forEach(function (e) {
      if (ko(e, 'football', 'M', '1') && /1\\/8/i.test(e.stage)) { e.a = S('slovak-university-of-technology-in-bratislava'); e.b = S('czech-technical-university'); e.resA = '2'; e.resB = '1'; }
      if (ko(e, 'football', 'M', '2') && /1\\/8/i.test(e.stage)) { e.a = S('comenius-university-bratislava'); e.b = S('american-university-of-beirut'); e.resA = '0'; e.resB = '3'; }
      if (ko(e, 'football', 'M', '3') && /1\\/8/i.test(e.stage)) { e.a = S('astra-bocconi'); e.b = S('aix-marseille-universite'); e.resA = '1'; e.resB = '1'; }
      if (e.sport === 'football' && e.cat === 'M' && /^semi/i.test(e.stage)) semis.push(e);
    });
    semis.sort(function (x, y) { return x.time.localeCompare(y.time); });
    semis[0].a = S('brno-university-of-technology'); semis[0].b = S('astra-bocconi'); semis[0].resA = '2'; semis[0].resB = '0';
    semis[1].a = S('czech-technical-university'); semis[1].b = S('comenius-university-bratislava'); semis[1].resA = '1'; semis[1].resB = '4';
  }
  var store;
  Object.defineProperty(window, 'WIUC_DATA', { configurable: true, get: function () { return store; }, set: function (v) { fix(v); store = v; } });
  try { localStorage.setItem('wiuc.school', 'slovak-university-of-technology-in-bratislava'); localStorage.setItem('wiuc.lang', 'sk'); } catch (e) {}
})();`;

function readBracket() {
  return [...document.querySelectorAll('.bracket')].map((b) => ({
    title: (b.querySelector('h2') || {}).textContent || '',
    rounds: [...b.querySelectorAll('.round')].map((r) => ({
      name: (r.querySelector('h3') || {}).textContent.trim(),
      games: [...r.querySelectorAll('.bx')].map((g) => ({
        no: g.getAttribute('data-game') || '',
        sides: [...g.querySelectorAll('.bx-side')].map((s) => ({
          name: (s.querySelector('.bx-name') || {}).textContent.trim(),
          win: s.classList.contains('win'),
          me: s.classList.contains('me'),
        })),
      })),
    })),
  }));
}

const browser = await Browser.launch();
try {
  const page = await browser.newPage({ width: 1440, height: 900 });
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: PATCH });
  await page.goto(base + '?now=2026-11-06T12:00#/playoff', { settleMs: 800 });
  await page.eval(() => { const c = document.querySelector('.chips [data-sport="football"]'); if (c) c.click(); });
  await sleep(300);

  let B = await page.eval(readBracket);
  const men = B.find((b) => /muži/.test(b.title));
  check('football men bracket shown', !!men, `(${B.map((b) => b.title).join(' | ')})`);
  const names = men ? men.rounds.map((r) => r.name) : [];
  check('rounds in order', names.join(',') === 'Osemfinále,Štvrťfinále,Semifinále,Finále', `(${names.join(',')})`);
  const r16 = men && men.rounds[0], qf = men && men.rounds[1], fin = men && men.rounds[3];
  check('8 + 4 + 2 games', men && r16.games.length === 8 && qf.games.length === 4 && men.rounds[2].games.length === 2,
    men ? `(${men.rounds.map((r) => r.games.length).join('+')})` : '');
  const g1 = r16 && r16.games.find((g) => g.no === '1');
  check('played game marks the winner', g1 && g1.sides[0].win && !g1.sides[1].win);
  check('your university is highlighted', g1 && g1.sides[0].me && /STU/.test(g1.sides[0].name), g1 ? `(${g1.sides[0].name})` : '');
  const q9 = qf && qf.games.find((g) => g.no === '9');
  check('winners move into the quarter-final', q9 && /STU/.test(q9.sides[0].name) && /Beirut/.test(q9.sides[1].name),
    q9 ? `(${q9.sides.map((s) => s.name).join(' vs ')})` : '');
  const q10 = qf && qf.games.find((g) => g.no === '10');
  check('a draw stays open', q10 && /Víťaz zápasu 3/.test(q10.sides[0].name) && /Víťaz zápasu 4/.test(q10.sides[1].name),
    q10 ? `(${q10.sides.map((s) => s.name).join(' vs ')})` : '');
  const f12 = fin && fin.games.find((g) => g.no === 'F');
  const f34 = fin && fin.games.find((g) => g.no === '3rd');
  const both = (g, x, y) => g && g.sides.length === 2 && g.sides.some((s) => x.test(s.name)) && g.sides.some((s) => y.test(s.name));
  check('final = semi-final winners', both(f12, /Brno/, /Comenius|UK Bratislava/), f12 ? `(${f12.sides.map((s) => s.name).join(' vs ')})` : '');
  check('3rd place = semi-final losers', both(f34, /Bocconi/, /Czech Technical/), f34 ? `(${f34.sides.map((s) => s.name).join(' vs ')})` : '');
  const r16a = r16 && r16.games.find((g) => g.no === '4');
  check('group places read as text', r16a && /1\. sk\. D/.test(r16a.sides[0].name), r16a ? `(${r16a.sides[0].name})` : '');

  // other sports with their own quirks
  async function bracketOf(sport) {
    await page.eval((s) => document.querySelector(`.chips [data-sport="${s}"]`).click(), sport);
    await sleep(250);
    return page.eval(readBracket);
  }
  B = await bracketOf('basketball');
  const bm = B.find((b) => /muži/.test(b.title));
  check('basketball men: qualification first', bm && bm.rounds.map((r) => r.games.length).join('+') === '4+8+4+2+2' && bm.rounds[0].name === 'Kvalifikácia',
    bm ? `(${bm.rounds.map((r) => r.name + ' ' + r.games.length).join(', ')})` : '');
  B = await bracketOf('volleyball');
  const vm = B.find((b) => /muži/.test(b.title));
  check('volleyball men: rows without a round name still count', vm && vm.rounds[0].games.length === 8, vm ? `(${vm.rounds[0].games.length})` : '');
  B = await bracketOf('handball');
  const hw = B.find((b) => /ženy/.test(b.title));
  check('handball women: quarter-finals on Friday', hw && hw.rounds.map((r) => r.name).join(',') === 'Štvrťfinále,Semifinále,Finále', hw ? `(${hw.rounds.map((r) => r.name).join(',')})` : '');
  const chips = await page.eval(() => [...document.querySelectorAll('.chips [data-sport]')].map((c) => c.getAttribute('data-sport')));
  check('no chip for rugby or tennis', !chips.includes('rugby') && !chips.includes('tennis'), `(${chips.join(',')})`);

  // way in from the tables page and the menu
  const links = await page.eval(() => {
    location.hash = '#/tables';
    return new Promise((r) => setTimeout(() => r({
      fromTables: !!document.querySelector('#app a[href="#/playoff"]'),
      inMenu: !!document.querySelector('#menu a[href="#/playoff"]'),
    }), 300));
  });
  check('tables page links to the bracket', links.fromTables);
  check('menu links to the bracket', links.inMenu);
  await page.close();

  // phone: bracket scrolls sideways, the page does not
  const ph = await browser.newPage({ width: 390, height: 844, dsf: 2, mobile: true });
  await ph.send('Page.addScriptToEvaluateOnNewDocument', { source: PATCH });
  await ph.goto(base + '?now=2026-11-06T12:00#/playoff', { settleMs: 800 });
  const m = await ph.eval(() => {
    const sc = document.querySelector('.bracket-scroll');
    const tab = document.querySelector('.tabbar a[href="#/tables"]');
    return {
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      scrolls: !!sc && sc.scrollWidth > sc.clientWidth,
      tabOn: !!tab && tab.classList.contains('on'),
    };
  });
  check('phone: page not wider than the screen', !m.pageOverflow);
  check('phone: bracket scrolls sideways', m.scrolls);
  check('phone: Tabuľky tab marked', m.tabOn);
  await ph.eval(() => { document.getElementById('langBtn').click(); });
  await sleep(300);
  const en = await ph.eval(() => [...document.querySelectorAll('.bracket .round h3')].map((x) => x.textContent.trim()).slice(0, 4).join(','));
  check('English round names', /Quarter-finals/.test(en) && /Semi-finals/.test(en), `(${en})`);
  await ph.close();
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
