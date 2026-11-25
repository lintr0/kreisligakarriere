// Spiel-Engine: Spieler, Teams, Ligen, Matchsimulation, Saisonwechsel, Transfers.
// Läuft im Browser und in Node (für Tests).
(function () {
  'use strict';
  const G = globalThis.GameData;

  const MATCHDAYS = 18, SQUAD_MIN = 14, SQUAD_MAX = 24;
  const STATS = ['tempo', 'technik', 'kondition', 'nerven'];
  const STAT_LABEL = { tempo: 'Tempo', technik: 'Technik', kondition: 'Kondition', nerven: 'Nerven' };
  const POS = ['GK', 'DEF', 'MID', 'ATT'];
  const POS_LABEL = { GK: 'TW', DEF: 'AB', MID: 'MF', ATT: 'ST' };
  const POSPOOL = ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT'];
  const TRAITS = ['Kämpfer', 'Techniker', 'Sprinter', 'Nervenstark', 'Teamplayer', 'Heißsporn', 'Allrounder'];

  const WEIGHTS = {
    GK: { tempo: .15, technik: .25, kondition: .15, nerven: .45 },
    DEF: { tempo: .2, technik: .2, kondition: .3, nerven: .3 },
    MID: { tempo: .2, technik: .35, kondition: .25, nerven: .2 },
    ATT: { tempo: .3, technik: .3, kondition: .15, nerven: .25 }
  };
  const BONUS = {
    GK: { tempo: -6, technik: -2, kondition: 0, nerven: 8 },
    DEF: { tempo: 0, technik: -3, kondition: 4, nerven: 3 },
    MID: { tempo: 0, technik: 5, kondition: 1, nerven: 0 },
    ATT: { tempo: 5, technik: 2, kondition: -3, nerven: 1 }
  };
  const FORMATIONS = {
    '4-4-2': { DEF: 4, MID: 4, ATT: 2, atk: 1, def: 1, ctl: 1 },
    '4-3-3': { DEF: 4, MID: 3, ATT: 3, atk: 1.04, def: 0.97, ctl: 0.98 },
    '3-5-2': { DEF: 3, MID: 5, ATT: 2, atk: 1.01, def: 0.97, ctl: 1.05 },
    '5-3-2': { DEF: 5, MID: 3, ATT: 2, atk: 0.96, def: 1.05, ctl: 0.98 },
    '4-5-1': { DEF: 4, MID: 5, ATT: 1, atk: 0.97, def: 1.0, ctl: 1.05 }
  };
  const TACTICS = {
    off: { label: 'Offensiv', atk: 1.07, def: 0.93 },
    bal: { label: 'Ausgewogen', atk: 1, def: 1 },
    def: { label: 'Defensiv', atk: 0.93, def: 1.07 }
  };
  const TRAININGS = {
    balanced: 'Ausgeglichen', tempo: 'Tempo', technik: 'Technik',
    kondition: 'Kondition', nerven: 'Nerven', rest: 'Erholung'
  };

  // ---------- Helfer ----------
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const chance = p => Math.random() < p;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sum = a => a.reduce((x, y) => x + y, 0);
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let uid = 0;
  const newId = prefix => prefix + Date.now().toString(36) + (uid++).toString(36) + rnd(0, 999).toString(36);
  function wpick(items, weights) {
    const total = sum(weights);
    if (total <= 0) return items[0];
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  function fmtMoney(n) {
    n = Math.round(n);
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2).replace('.', ',') + ' Mio. €';
    return n.toLocaleString('de-DE') + ' €';
  }
  const scale = tier => Math.exp(0.15 * (G.TIER_BASE[tier - 1] - 38));

  // ---------- Spieler ----------
  function ovr(p, pos) {
    const w = WEIGHTS[pos || p.pos];
    return Math.round(p.tempo * w.tempo + p.technik * w.technik + p.kondition * w.kondition + p.nerven * w.nerven);
  }
  function playerValue(p) { return Math.max(100, Math.round(30 * Math.exp(0.15 * ovr(p)) / 10) * 10); }
  function playerWage(p) { return Math.max(10, Math.round(playerValue(p) * 0.0035 / 10) * 10); }
  function eff(p, slot) {
    const pos = slot || p.pos;
    let pen = 1;
    if (pos !== p.pos) {
      if (pos === 'GK' || p.pos === 'GK') pen = 0.5;
      else if (Math.abs(POS.indexOf(pos) - POS.indexOf(p.pos)) === 1) pen = 0.88;
      else pen = 0.78;
    }
    const mor = p.moral === undefined ? 70 : p.moral;
    return ovr(p) * pen * (0.85 + 0.15 * p.form / 100) * (0.8 + 0.2 * p.fitness / 100) * (0.92 + 0.08 * mor / 100);
  }
  function genName() { return pick(G.FIRST) + ' ' + pick(G.LAST); }
  function genPlayer(base, o) {
    o = o || {};
    const pos = o.pos || pick(POSPOOL);
    const b = base + rnd(-7, 7);
    const bo = BONUS[pos];
    const mk = k => clamp(Math.round(b + rnd(-9, 9) + bo[k]), 12, 96);
    const p = {
      id: newId('p'), name: o.name || genName(), pos,
      tempo: mk('tempo'), technik: mk('technik'), kondition: mk('kondition'), nerven: mk('nerven'),
      pot: 0, form: 60, fitness: 100, moral: 70, injured: 0, susp: 0, yellows: 0,
      goals: 0, assists: 0, apps: 0, ratingSum: 0, careerGoals: 0, careerApps: 0,
      trait: pick(TRAITS), friend: !!o.friend
    };
    p.pot = clamp(ovr(p) + rnd(2, 16), 20, 97);
    if (o.pot) p.pot = Math.max(p.pot, o.pot);
    return p;
  }

  const ALIAS = { TW: 'GK', GK: 'GK', AB: 'DEF', DEF: 'DEF', IV: 'DEF', MF: 'MID', MID: 'MID', ZM: 'MID', ST: 'ATT', ATT: 'ATT', SM: 'ATT' };
  function genSquad(base, friends) {
    const counts = { GK: 2, DEF: 6, MID: 6, ATT: 4 };
    const cycle = ['DEF', 'MID', 'ATT', 'DEF', 'MID', 'GK', 'DEF', 'MID', 'ATT'];
    let ci = 0; const out = [];
    (friends || []).slice(0, SQUAD_MAX).forEach(f => {
      let pos = ALIAS[String(f.pos || '').trim().toUpperCase()];
      if (!pos) {
        for (let k = 0; k < cycle.length; k++) {
          const c = cycle[(ci + k) % cycle.length];
          if (counts[c] > 0) { pos = c; ci = ci + k + 1; break; }
        }
        if (!pos) pos = cycle[ci++ % cycle.length];
      }
      if (counts[pos] > 0) counts[pos]--;
      out.push(genPlayer(base, { name: String(f.name).slice(0, 28), pos, friend: true }));
    });
    POS.forEach(pos => { for (let i = 0; i < counts[pos]; i++) out.push(genPlayer(base, { pos })); });
    return out;
  }
  function makeTeam(name, tier, o) {
    o = o || {};
    const base = G.TIER_BASE[tier - 1] + (o.bias || 0);
    return {
      id: newId('t'), name, tier, user: !!o.user,
      formation: o.user ? '4-4-2' : pick(['4-4-2', '4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-5-1']),
      tactic: 'bal', lineup: [], players: genSquad(base, o.friends)
    };
  }
  function genEmergency(team) {
    const p = genPlayer(G.TIER_BASE[team.tier - 1] - 15, { name: 'Ersatz ' + genName().split(' ')[1] });
    p.pot = ovr(p);
    team.players.push(p);
    return p;
  }

  // ---------- Aufstellung ----------
  function slotsOf(formation) {
    const f = FORMATIONS[formation];
    return ['GK'].concat(Array(f.DEF).fill('DEF'), Array(f.MID).fill('MID'), Array(f.ATT).fill('ATT'));
  }
  const avail = p => !p.injured && !p.susp;
  function autoPick(team, formation) {
    const slots = slotsOf(formation);
    const res = Array(11).fill(null);
    const used = new Set();
    const order = [0].concat(
      slots.map((s, i) => i).filter(i => slots[i] === 'ATT'),
      slots.map((s, i) => i).filter(i => slots[i] === 'MID'),
      slots.map((s, i) => i).filter(i => slots[i] === 'DEF'));
    order.forEach(i => {
      const c = team.players.filter(p => avail(p) && !used.has(p.id)).sort((a, b) => eff(b, slots[i]) - eff(a, slots[i]))[0] || genEmergency(team);
      used.add(c.id); res[i] = c.id;
    });
    return res;
  }
  function fixLineup(team) {
    const slots = slotsOf(team.formation);
    if (!Array.isArray(team.lineup) || team.lineup.length !== 11) { team.lineup = autoPick(team, team.formation); return; }
    const seen = new Set();
    const lu = team.lineup.map(id => {
      const p = team.players.find(x => x.id === id);
      if (p && avail(p) && !seen.has(id)) { seen.add(id); return id; }
      return null;
    });
    lu.forEach((id, i) => {
      if (id) return;
      const c = team.players.filter(p => avail(p) && !seen.has(p.id)).sort((a, b) => eff(b, slots[i]) - eff(a, slots[i]))[0] || genEmergency(team);
      seen.add(c.id); lu[i] = c.id;
    });
    team.lineup = lu;
  }
  function computeStrength(on, formation, tactic, home, missing) {
    const g = { GK: [], DEF: [], MID: [], ATT: [] };
    const all = on.map(o => { const e = eff(o.p, o.slot); g[o.slot].push(e); return e; });
    const mean = all.length ? sum(all) / all.length : 30;
    const avg = a => a.length ? sum(a) / a.length : mean * 0.6;
    const gk = avg(g.GK), def = avg(g.DEF), mid = avg(g.MID), att = avg(g.ATT);
    const f = FORMATIONS[formation], t = TACTICS[tactic];
    const miss = 1 - 0.06 * missing;
    return {
      attack: (att * .5 + mid * .38 + def * .12) * f.atk * t.atk * (home ? 1.03 : 1) * miss,
      defense: (def * .45 + gk * .25 + mid * .30) * f.def * t.def * miss,
      control: (mid * .7 + att * .15 + def * .15) * f.ctl * (home ? 1.02 : 1) * miss
    };
  }
  function lineupStrength(team, lineup, formation, tactic) {
    const slots = slotsOf(formation);
    const on = lineup.map((id, i) => ({ p: team.players.find(p => p.id === id), slot: slots[i] })).filter(o => o.p);
    return computeStrength(on, formation, tactic, false, 0);
  }
  function teamRating(team) {
    const best = team.players.map(p => ovr(p)).sort((a, b) => b - a).slice(0, 11);
    return Math.round(sum(best) / best.length);
  }

  // ---------- Liga ----------
  function genFixtures(ids) {
    const n = ids.length; let arr = shuffle(ids); const first = [];
    for (let r = 0; r < n - 1; r++) {
      const day = [];
      for (let i = 0; i < n / 2; i++) {
        const a = arr[i], b = arr[n - 1 - i];
        day.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
      }
      first.push(day);
      arr = [arr[0], arr[n - 1]].concat(arr.slice(1, n - 1));
    }
    return first.concat(first.map(d => d.map(([h, a]) => [a, h])));
  }
  function newLeague(tier, ids) {
    const table = {};
    ids.forEach(id => { table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }; });
    return { tier, name: G.LEAGUES[tier - 1].name, teamIds: ids.slice(), fixtures: genFixtures(ids), results: [], table };
  }
  function sortedTable(S, lg) {
    return lg.teamIds.map(id => Object.assign({ id }, lg.table[id])).sort((a, b) =>
      b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || S.teams[a.id].name.localeCompare(S.teams[b.id].name));
  }

  // ---------- Zugriff ----------
  const userTeam = S => S.teams[S.userId];
  const userLeague = S => S.leagues.find(l => l.teamIds.includes(S.userId));
  function nextFixture(S) {
    if (S.matchday >= MATCHDAYS) return null;
    const lg = userLeague(S);
    const f = lg.fixtures[S.matchday].find(([h, a]) => h === S.userId || a === S.userId);
    const isHome = f[0] === S.userId;
    return { md: S.matchday, isHome, home: S.teams[f[0]], away: S.teams[f[1]], opp: S.teams[isHome ? f[1] : f[0]] };
  }
  function userResults(S, n) {
    const lg = userLeague(S); const out = [];
    for (let md = lg.results.length - 1; md >= 0 && out.length < n; md--) {
      const r = (lg.results[md] || []).find(x => x.h === S.userId || x.a === S.userId);
      if (!r) continue;
      const isHome = r.h === S.userId;
      out.push({ md, isHome, opp: S.teams[isHome ? r.a : r.h].name, gf: isHome ? r.hg : r.ag, ga: isHome ? r.ag : r.hg });
    }
    return out;
  }
  function topScorers(S, lg, n) {
    const out = [];
    lg.teamIds.forEach(id => S.teams[id].players.forEach(p => { if (p.goals > 0) out.push({ p, team: S.teams[id] }); }));
    return out.sort((a, b) => b.p.goals - a.p.goals || b.p.assists - a.p.assists).slice(0, n);
  }
  function addNews(S, text) {
    S.news.unshift({ season: S.season, md: S.matchday, text });
    if (S.news.length > 30) S.news.length = 30;
  }

  // ---------- Match ----------
  const GOAL_TXT = [
    (s, a) => `TOOOR! ${s} netzt ein${a ? ` – Vorlage von ${a}` : ''}!`,
    (s, a) => `${s} schiebt aus kurzer Distanz ein${a ? ` (Vorarbeit ${a})` : ''}.`,
    (s, a) => `Was für ein Schuss! ${s} hämmert den Ball ins Netz${a ? ` – aufgelegt von ${a}` : ''}.`,
    (s, a) => `${s} bleibt vor dem Tor eiskalt und trifft${a ? ` nach Pass von ${a}` : ''}!`
  ];
  const SAVE_TXT = [
    (s, g) => `${s} zieht ab – ${g} hält stark!`,
    (s, g) => `Großchance für ${s}, aber ${g} faustet den Ball weg.`,
    (s, g) => `${g} pariert den Schuss von ${s} glänzend.`
  ];
  const MISS_TXT = [
    s => `${s} schießt knapp am Tor vorbei.`,
    s => `${s} setzt den Ball über die Latte.`,
    s => `Pfosten! ${s} hat Pech.`,
    s => `${s} wird im letzten Moment geblockt.`
  ];

  function recalc(side) { side.str = computeStrength(side.on, side.formation, side.tactic, side.home, side.missing); }
  function buildSide(team, lineupIds, home) {
    const slots = slotsOf(team.formation);
    const on = lineupIds.map((id, i) => ({ p: team.players.find(p => p.id === id), slot: slots[i] }));
    const used = new Set(lineupIds);
    const pool = team.players.filter(p => !used.has(p.id) && avail(p));
    const gk = pool.filter(p => p.pos === 'GK').sort((a, b) => ovr(b) - ovr(a))[0];
    const rest = pool.filter(p => p !== gk).sort((a, b) => ovr(b) - ovr(a));
    const side = {
      team, formation: team.formation, tactic: team.tactic, home, on,
      bench: (gk ? [gk] : []).concat(rest).slice(0, 7),
      subs: 0, missing: 0, str: null, yc: {}, played: new Set(lineupIds), stats: { shots: 0, sot: 0 }
    };
    recalc(side);
    return side;
  }
  function createMatch(S, home, away) {
    const lu = t => { if (t.user) { fixLineup(t); return t.lineup; } return autoPick(t, t.formation); };
    return {
      homeId: home.id, awayId: away.id, minute: 0, hg: 0, ag: 0, events: [], goalsLog: [], perf: {},
      userSide: home.user ? 'home' : away.user ? 'away' : null,
      home: buildSide(home, lu(home), true), away: buildSide(away, lu(away), false)
    };
  }
  function pickShooter(side) {
    const w = { ATT: 5, MID: 2.5, DEF: 0.5, GK: 0 };
    const items = side.on.filter(o => o.slot !== 'GK');
    if (!items.length) return null;
    return wpick(items, items.map(o => w[o.slot] * Math.pow(eff(o.p, o.slot) / 50, 2))).p;
  }
  function pickAssister(side, shooter) {
    const w = { ATT: 3, MID: 4, DEF: 1, GK: 0 };
    const items = side.on.filter(o => o.p !== shooter && o.slot !== 'GK');
    if (!items.length) return null;
    return wpick(items, items.map(o => w[o.slot])).p;
  }
  function pushEv(m, ev, e) { ev.min = m.minute; m.events.push(ev); e.push(ev); }
  function replaceForced(m, key, p, evs) {
    const side = m[key];
    const idx = side.on.findIndex(o => o.p === p);
    if (idx < 0) return;
    const slot = side.on[idx].slot;
    const c = side.bench.filter(avail).sort((a, b) => eff(b, slot) - eff(a, slot))[0];
    if (c) {
      side.bench = side.bench.filter(b => b !== c);
      side.on[idx] = { p: c, slot };
      side.played.add(c.id);
      pushEv(m, { type: 'sub', side: key, text: `Einwechslung bei ${side.team.name}: ${c.name} für ${p.name}.` }, evs);
    } else {
      side.on.splice(idx, 1); side.missing++;
    }
    recalc(side);
  }
  function discipline(m, key, evs) {
    const side = m[key];
    const field = side.on.filter(o => o.slot !== 'GK');
    if (!field.length) return;
    const p = wpick(field, field.map(o => o.p.trait === 'Heißsporn' ? 3 : 1)).p;
    let red = false, text;
    if (chance(0.12)) { red = true; p.susp = Math.max(p.susp, 3); text = `Rote Karte! ${p.name} (${side.team.name}) fliegt vom Platz.`; }
    else {
      side.yc[p.id] = (side.yc[p.id] || 0) + 1; p.yellows++;
      if (p.yellows % 5 === 0) p.susp = Math.max(p.susp, 2);
      if (side.yc[p.id] >= 2) { red = true; p.susp = Math.max(p.susp, 2); text = `Gelb-Rot für ${p.name} (${side.team.name})!`; }
      else text = `Gelbe Karte für ${p.name} (${side.team.name}).`;
    }
    pushEv(m, { type: red ? 'red' : 'yellow', side: key, text }, evs);
    if (red) {
      const i = side.on.findIndex(o => o.p === p);
      if (i >= 0) { side.on.splice(i, 1); side.missing++; recalc(side); }
    }
  }
  function injury(m, key, evs) {
    const side = m[key];
    if (!side.on.length) return;
    const p = pick(side.on).p;
    const weeks = rnd(1, 6);
    p.injured = weeks + 1; // wird nach dem Spieltag um 1 reduziert
    pushEv(m, { type: 'injury', side: key, text: `Verletzung bei ${side.team.name}: ${p.name} fällt ${weeks} Spieltag${weeks > 1 ? 'e' : ''} aus.` }, evs);
    replaceForced(m, key, p, evs);
  }
  function aiAdjust(m) {
    ['home', 'away'].forEach(key => {
      if (key === m.userSide) return;
      const side = m[key];
      const diff = key === 'home' ? m.hg - m.ag : m.ag - m.hg;
      if (diff <= -2 && side.tactic !== 'off') { side.tactic = 'off'; recalc(side); }
      else if (diff >= 2 && side.tactic !== 'def') { side.tactic = 'def'; recalc(side); }
    });
  }
  function stepMinute(m) {
    const evs = [];
    if (m.minute >= 90) return evs;
    m.minute++;
    if (m.minute === 60 || m.minute === 75) aiAdjust(m);
    const H = m.home, A = m.away;
    ['home', 'away'].forEach(key => {
      if (chance(0.0035)) discipline(m, key, evs);
      if (chance(0.0012)) injury(m, key, evs);
    });
    if (chance(0.31)) {
      const h3 = Math.pow(H.str.control, 3), a3 = Math.pow(A.str.control, 3);
      const key = chance(h3 / (h3 + a3)) ? 'home' : 'away';
      const atk = m[key], def = m[key === 'home' ? 'away' : 'home'];
      const r = atk.str.attack / Math.max(1, def.str.defense);
      if (chance(clamp(0.5 * Math.pow(r, 1.0), 0.2, 0.85))) {
        atk.stats.shots++;
        const sh = pickShooter(atk);
        if (sh) {
          const gko = def.on.find(o => o.slot === 'GK');
          const gkName = gko ? gko.p.name : 'der Feldspieler im Tor';
          let pg = clamp(0.15 * Math.pow(r, 1.8), 0.03, 0.45);
          if (sh.trait === 'Nervenstark') pg *= 1.1;
          if (chance(pg)) {
            atk.stats.sot++;
            if (key === 'home') m.hg++; else m.ag++;
            const as = chance(0.75) ? pickAssister(atk, sh) : null;
            m.goalsLog.push({ min: m.minute, side: key, sid: sh.id, aid: as ? as.id : null });
            (m.perf[sh.id] = m.perf[sh.id] || { g: 0, a: 0 }).g++;
            if (as) (m.perf[as.id] = m.perf[as.id] || { g: 0, a: 0 }).a++;
            pushEv(m, { type: 'goal', side: key, text: pick(GOAL_TXT)(sh.name, as && as.name) + ` (${atk.team.name})`, score: m.hg + ':' + m.ag }, evs);
          } else if (chance(0.45)) {
            atk.stats.sot++;
            pushEv(m, { type: 'save', side: key, text: pick(SAVE_TXT)(sh.name, gkName) }, evs);
          } else if (chance(0.6)) {
            pushEv(m, { type: 'miss', side: key, text: pick(MISS_TXT)(sh.name) }, evs);
          }
        }
      }
    }
    return evs;
  }
  function setMatchTactic(m, key, tactic) { m[key].tactic = tactic; recalc(m[key]); }
  function subPlayer(m, key, outId, inId) {
    const side = m[key];
    if (side.subs >= 3) return { ok: false, msg: 'Keine Wechsel mehr übrig.' };
    const i = side.on.findIndex(o => o.p.id === outId);
    const b = side.bench.find(p => p.id === inId);
    if (i < 0 || !b) return { ok: false, msg: 'Ungültiger Wechsel.' };
    const out = side.on[i].p;
    side.on[i] = { p: b, slot: side.on[i].slot };
    side.bench = side.bench.filter(p => p !== b).concat(out);
    side.subs++; side.played.add(b.id);
    recalc(side);
    const ev = { type: 'sub', side: key, min: m.minute, text: `Wechsel bei ${side.team.name}: ${b.name} für ${out.name}.` };
    m.events.push(ev);
    return { ok: true, ev };
  }
  function matchRatings(m) {
    const out = {};
    ['home', 'away'].forEach(key => {
      const side = m[key];
      const gf = key === 'home' ? m.hg : m.ag, ga = key === 'home' ? m.ag : m.hg;
      const res = gf > ga ? 0.4 : gf < ga ? -0.4 : 0;
      side.played.forEach(id => {
        const p = side.team.players.find(x => x.id === id);
        if (!p) return;
        const pf = m.perf[id] || { g: 0, a: 0 };
        const def = p.pos === 'GK' || p.pos === 'DEF';
        const r = 6.2 + res + pf.g * 1.0 + pf.a * 0.5 + (ga === 0 && def ? 0.5 : 0) - (ga >= 3 && def ? 0.4 : 0) + (Math.random() - 0.5) * 0.8;
        out[id] = clamp(Math.round(r * 10) / 10, 3, 10);
      });
    });
    return out;
  }
  function matchSummary(m) {
    if (!m.ratings) m.ratings = matchRatings(m);
    const nameOf = id => { for (const k of ['home', 'away']) { const p = m[k].team.players.find(x => x.id === id); if (p) return p.name; } return '?'; };
    const scorers = m.goalsLog.map(g => ({ name: nameOf(g.sid), min: g.min, side: g.side }));
    let motm = null;
    Object.keys(m.ratings).forEach(id => { if (!motm || m.ratings[id] > m.ratings[motm]) motm = id; });
    const us = m.userSide ? m[m.userSide] : null;
    const list = us ? Array.from(us.played).map(id => ({ id, name: nameOf(id), rating: m.ratings[id] })).sort((a, b) => b.rating - a.rating) : [];
    return { hg: m.hg, ag: m.ag, scorers, motm: motm ? { name: nameOf(motm), rating: m.ratings[motm] } : null, ratings: list };
  }

  // ---------- Ergebnisse anwenden ----------
  function applyResult(S, lg, md, m, isUser) {
    const ratings = m.ratings || (m.ratings = matchRatings(m));
    const rows = { home: lg.table[m.homeId], away: lg.table[m.awayId] };
    const gf = { home: m.hg, away: m.ag };
    ['home', 'away'].forEach(key => {
      const row = rows[key], f = gf[key], a = gf[key === 'home' ? 'away' : 'home'];
      row.p++; row.gf += f; row.ga += a;
      if (f > a) { row.w++; row.pts += 3; row.form.push('S'); }
      else if (f === a) { row.d++; row.pts += 1; row.form.push('U'); }
      else { row.l++; row.form.push('N'); }
      if (row.form.length > 5) row.form.shift();
      const side = m[key], team = side.team;
      const res = f > a ? 1 : f < a ? -1 : 0;
      team.players.forEach(p => {
        p.moral = clamp((p.moral === undefined ? 70 : p.moral) + res * 4, 10, 100);
        if (side.played.has(p.id)) {
          p.apps++; p.careerApps++;
          const r = ratings[p.id] || 6;
          p.ratingSum += r;
          p.fitness = clamp(p.fitness - (22 - p.kondition * 0.1 + rnd(-3, 3)), 25, 100);
          p.form = clamp(p.form + (r - 6.2) * 5 + res * 3, 20, 100);
        } else {
          p.fitness = clamp(p.fitness + 8, 0, 100);
        }
      });
    });
    m.goalsLog.forEach(g => {
      const team = m[g.side].team;
      const s = team.players.find(p => p.id === g.sid); if (s) { s.goals++; s.careerGoals++; }
      const a = g.aid && team.players.find(p => p.id === g.aid); if (a) a.assists++;
    });
    const rec = { h: m.homeId, a: m.awayId, hg: m.hg, ag: m.ag };
    if (isUser) {
      const s = matchSummary(m);
      rec.scorers = s.scorers;
    }
    lg.results[md].push(rec);
  }
  function simQuick(S, home, away) {
    const m = createMatch(S, home, away);
    for (let i = 0; i < 90; i++) stepMinute(m);
    return m;
  }

  function trainTeam(S, team, focus) {
    const gains = [];
    if (focus === 'rest') return gains;
    team.players.forEach(p => {
      STATS.forEach(k => {
        if (ovr(p) >= p.pot || p[k] >= 97) return;
        const pr = focus === 'balanced' ? 0.13 : (focus === k ? 0.45 : 0.05);
        if (chance(pr)) { p[k]++; gains.push({ name: p.name, stat: k }); }
      });
    });
    return gains;
  }

  // ---------- Spieltag abschließen ----------
  function prepareUserMatch(S) {
    const fx = nextFixture(S);
    return createMatch(S, fx.home, fx.away);
  }
  function finalizeMatchday(S, um) {
    const md = S.matchday;
    const info = { seasonEnd: false, fired: false, result: null, gains: [] };
    const ut = userTeam(S);
    S.leagues.forEach(lg => {
      lg.results[md] = [];
      lg.fixtures[md].forEach(([h, a]) => {
        const m = (um && um.homeId === h && um.awayId === a) ? um : simQuick(S, S.teams[h], S.teams[a]);
        applyResult(S, lg, md, m, m === um);
      });
    });
    // Status herunterzählen und erholen
    Object.keys(S.teams).forEach(id => {
      S.teams[id].players.forEach(p => {
        if (p.injured > 0) p.injured--;
        if (p.susp > 0) p.susp--;
        p.fitness = clamp(p.fitness + 12 + (id === S.userId && S.training === 'rest' ? 10 : 0), 0, 100);
        p.form = clamp(p.form + (60 - p.form) * 0.1, 20, 100);
      });
      // Notfall-Ersatzspieler wieder entfernen, wenn Kader groß genug
      const t = S.teams[id];
      if (t.players.length > SQUAD_MAX) t.players = t.players.filter(p => !p.name.startsWith('Ersatz ') || t.lineup.includes(p.id)).slice(0, 40);
    });
    // Training
    info.gains = trainTeam(S, ut, S.training);
    S.lastTraining = info.gains.slice(0, 12);
    // Ergebnis des Nutzers
    const ur = userResults(S, 1)[0];
    info.result = ur;
    // Finanzen
    const sc = scale(ut.tier);
    const wages = sum(ut.players.map(playerWage));
    S.budget -= wages; S.finance.expense += wages;
    if (ur.isHome) {
      const t = Math.round(1500 * sc * (0.6 + S.fans / 100));
      S.budget += t; S.finance.income += t;
    }
    // Fans & Vorstand
    const res = ur.gf > ur.ga ? 1 : ur.gf < ur.ga ? -1 : 0;
    S.fans = clamp(S.fans + (res > 0 ? 1.5 : res < 0 ? -1 : 0), 20, 100);
    S.board.confidence = clamp(S.board.confidence + (res > 0 ? 4 : res < 0 ? -3 : 1) - (S.budget < 0 ? 2 : 0), 0, 100);
    addNews(S, `${ur.isHome ? 'Heim' : 'Auswärts'} gegen ${ur.opp}: ${ur.gf}:${ur.ga}`);
    if (S.board.confidence <= 0) { S.fired = true; info.fired = true; }
    // Weiter
    S.matchday++;
    if (S.matchday >= MATCHDAYS) { endSeason(S); info.seasonEnd = true; }
    else {
      if (S.matchday % 6 === 0) S.market = genMarket(S);
      if (!S.fired && globalThis.GameEvents) globalThis.GameEvents.maybeTrigger(S);
    }
    return info;
  }

  // ---------- Saisonende ----------
  function setObjective(S) {
    const lg = userLeague(S);
    const ranked = lg.teamIds.map(id => ({ id, r: teamRating(S.teams[id]) })).sort((a, b) => b.r - a.r);
    const rank = ranked.findIndex(x => x.id === S.userId) + 1;
    let o;
    if (lg.tier === 9) {
      if (rank <= 1) o = { maxPos: 3, label: 'Platz 1–3 (Europapokal)' };
      else if (rank <= 4) o = { maxPos: 5, label: 'Oberes Tabellendrittel (Platz 1–5)' };
      else o = { maxPos: 8, label: 'Klassenerhalt (Platz 1–8)' };
    } else if (rank <= 3) o = { maxPos: 2, label: 'Aufstieg (Platz 1–2)' };
    else if (rank <= 6) o = { maxPos: 5, label: 'Obere Tabellenhälfte (Platz 1–5)' };
    else o = { maxPos: 8, label: 'Klassenerhalt (Platz 1–8)' };
    S.board.objective = o;
  }
  function endSeason(S) {
    const lg = userLeague(S);
    const tb = sortedTable(S, lg);
    const pos = tb.findIndex(r => r.id === S.userId) + 1;
    const row = tb[pos - 1];
    const sc = scale(lg.tier);
    const promoted = pos <= 2 && lg.tier < 9;
    const relegated = pos >= 9 && lg.tier > 1;
    const champion = pos === 1;
    const met = pos <= S.board.objective.maxPos;
    let prize = 0, delta = 0;
    if (champion) { prize += lg.tier === 9 ? 25000 * sc : 12000 * sc; delta += 15; }
    if (promoted) { prize += 10000 * sc; delta += 25; }
    if (met) { prize += 4000 * sc; delta += 10; } else delta -= 15;
    if (relegated) delta -= 35;
    prize = Math.round(prize);
    S.budget += prize; S.finance.income += prize;
    S.board.confidence = clamp(S.board.confidence + delta, 0, 100);
    if (champion && lg.tier === 9) S.titles = (S.titles || 0) + 1;
    const top = topScorers(S, lg, 1)[0];
    const ut = userTeam(S);
    const best = ut.players.slice().sort((a, b) => b.goals - a.goals)[0];
    const sum_ = {
      season: S.season, tier: lg.tier, leagueName: lg.name, pos, pts: row.pts, w: row.w, d: row.d, l: row.l, gf: row.gf, ga: row.ga,
      promoted, relegated, champion, objective: S.board.objective.label, objectiveMet: met, prize,
      topScorer: top ? { name: top.p.name, team: top.team.name, goals: top.p.goals } : null,
      ownTopScorer: best && best.goals > 0 ? { name: best.name, goals: best.goals } : null,
      confidence: S.board.confidence
    };
    S.seasonSummary = sum_;
    S.history.push({ season: S.season, leagueName: lg.name, tier: lg.tier, pos, pts: row.pts, promoted, relegated, champion });
    S.phase = 'seasonEnd';
    if (S.board.confidence <= 0) S.fired = true;
  }
  function startNextSeason(S) {
    const ups = {}, downs = {};
    S.leagues.forEach(lg => {
      const tb = sortedTable(S, lg);
      ups[lg.tier] = lg.tier < 9 ? tb.slice(0, 2).map(r => r.id) : [];
      downs[lg.tier] = lg.tier > 1 ? tb.slice(-2).map(r => r.id) : [];
    });
    const newIds = {};
    S.leagues.forEach(lg => {
      const t = lg.tier;
      const stay = lg.teamIds.filter(id => !ups[t].includes(id) && !downs[t].includes(id));
      newIds[t] = stay.concat(t > 1 ? ups[t - 1] : [], t < 9 ? downs[t + 1] : []);
    });
    S.leagues = [];
    for (let t = 1; t <= 9; t++) {
      newIds[t].forEach(id => { S.teams[id].tier = t; });
      S.leagues.push(newLeague(t, newIds[t]));
    }
    Object.keys(S.teams).forEach(id => {
      const team = S.teams[id];
      team.players.forEach(p => {
        if (id !== S.userId) {
          for (let k = rnd(1, 3); k > 0; k--) {
            if (ovr(p) < p.pot) p[pick(STATS)]++;
          }
        }
        p.fitness = 100; p.form = 60; p.moral = 70; p.injured = 0; p.susp = 0; p.yellows = 0;
        p.goals = 0; p.assists = 0; p.apps = 0; p.ratingSum = 0;
      });
      team.lineup = [];
    });
    S.season++; S.matchday = 0; S.phase = 'play'; S.seasonSummary = null;
    const ut = userTeam(S);
    const sponsor = Math.round(12000 * scale(ut.tier));
    S.budget += sponsor;
    S.finance = { income: sponsor, expense: 0 };
    S.market = genMarket(S);
    setObjective(S);
    fixLineup(ut);
    addNews(S, `Neue Saison ${S.season}/${String(S.season + 1).slice(2)} in der ${userLeague(S).name}. Sponsorengeld: ${fmtMoney(sponsor)}.`);
    if (globalThis.GameEvents) globalThis.GameEvents.maybeTrigger(S, true);
  }

  // ---------- Transfers ----------
  function genMarket(S) {
    const tier = userTeam(S).tier, base = G.TIER_BASE[tier - 1];
    const out = [];
    for (let i = 0; i < 18; i++) {
      const p = genPlayer(base + rnd(-4, 10));
      p.price = playerValue(p);
      out.push(p);
    }
    return out.sort((a, b) => POS.indexOf(a.pos) - POS.indexOf(b.pos) || ovr(b) - ovr(a));
  }
  function buy(S, id) {
    const p = S.market.find(x => x.id === id), t = userTeam(S);
    if (!p) return { ok: false, msg: 'Spieler nicht mehr verfügbar.' };
    if (t.players.length >= SQUAD_MAX) return { ok: false, msg: `Kader voll (max. ${SQUAD_MAX} Spieler).` };
    if (S.budget < p.price) return { ok: false, msg: 'Dafür fehlt das Geld.' };
    S.budget -= p.price; S.finance.expense += p.price;
    S.market = S.market.filter(x => x !== p);
    const price = p.price; delete p.price;
    t.players.push(p);
    addNews(S, `Transfer: ${p.name} (${POS_LABEL[p.pos]}, ${ovr(p)}) kommt für ${fmtMoney(price)}.`);
    return { ok: true, msg: `${p.name} verpflichtet!` };
  }
  const sellPrice = p => Math.round(playerValue(p) * 0.75 / 10) * 10;
  function canSell(S, p) {
    const t = userTeam(S);
    if (t.players.length <= SQUAD_MIN) return `Mindestens ${SQUAD_MIN} Spieler müssen im Kader bleiben.`;
    if (p.pos === 'GK' && t.players.filter(x => x.pos === 'GK').length <= 1) return 'Du brauchst mindestens einen Torwart.';
    return null;
  }
  function sell(S, id) {
    const t = userTeam(S), p = t.players.find(x => x.id === id);
    if (!p) return { ok: false, msg: 'Spieler nicht gefunden.' };
    const why = canSell(S, p); if (why) return { ok: false, msg: why };
    const price = sellPrice(p);
    S.budget += price; S.finance.income += price;
    t.players = t.players.filter(x => x !== p);
    fixLineup(t);
    addNews(S, `Verkauf: ${p.name} wechselt für ${fmtMoney(price)}.`);
    return { ok: true, msg: `${p.name} für ${fmtMoney(price)} verkauft.` };
  }

  // ---------- Einstellungen des Nutzers ----------
  function setFormation(S, f) { const t = userTeam(S); t.formation = f; t.lineup = autoPick(t, f); }
  function setSlot(S, i, pid) {
    const t = userTeam(S); fixLineup(t);
    const j = t.lineup.indexOf(pid);
    const old = t.lineup[i];
    if (j >= 0) t.lineup[j] = old;
    t.lineup[i] = pid;
  }
  function autoLineup(S) { const t = userTeam(S); t.lineup = autoPick(t, t.formation); }

  // ---------- Neues Spiel ----------
  function newGame(o) {
    const S = {
      version: 1, season: 2026, matchday: 0, phase: 'play', manager: o.manager || 'Trainer',
      teams: {}, leagues: [], history: [], budget: 25000, finance: { income: 0, expense: 0 }, fans: 50,
      board: { confidence: 60, objective: null }, market: [], news: [], pending: null, training: 'balanced',
      fired: false, userId: null, titles: 0, seasonSummary: null, lastTraining: []
    };
    for (let tier = 1; tier <= 9; tier++) {
      const names = G.LEAGUES[tier - 1].teams.slice();
      const ids = [];
      if (tier === 1) {
        names.pop();
        const u = makeTeam(o.club || 'FC Freitagskicker', 1, { user: true, friends: o.friends || [] });
        S.teams[u.id] = u; S.userId = u.id; ids.push(u.id);
      }
      names.forEach(n => {
        const t = makeTeam(n, tier, { bias: rnd(-4, 4) });
        S.teams[t.id] = t; ids.push(t.id);
      });
      S.leagues.push(newLeague(tier, ids));
    }
    S.finance.income = 12000;
    S.budget += 12000;
    S.market = genMarket(S);
    autoLineup(S);
    setObjective(S);
    addNews(S, `${S.manager} übernimmt ${userTeam(S).name}. Der Vorstand erwartet: ${S.board.objective.label}.`);
    return S;
  }

  const Engine = {
    MATCHDAYS, SQUAD_MIN, SQUAD_MAX, STATS, STAT_LABEL, POS, POS_LABEL, FORMATIONS, TACTICS, TRAININGS,
    ovr, eff, playerValue, playerWage, sellPrice, canSell, fmtMoney, scale, slotsOf, teamRating, lineupStrength,
    newGame, userTeam, userLeague, nextFixture, userResults, topScorers, sortedTable, addNews,
    prepareUserMatch, stepMinute, setMatchTactic, subPlayer, matchSummary, finalizeMatchday, startNextSeason,
    buy, sell, setFormation, setSlot, autoLineup, fixLineup, genMarket, genPlayer,
    util: { rnd, chance, pick, clamp, sum, shuffle, wpick }
  };
  globalThis.Engine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})();
