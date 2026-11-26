// Oberfläche: Rendering, Eingaben, Live-Match, Speichern.
(function () {
  'use strict';
  const E = globalThis.Engine;
  const SAVE_KEY = 'kreisliga-karriere-v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = E.fmtMoney;
  const POSN = { GK: 'Torwart', DEF: 'Abwehr', MID: 'Mittelfeld', ATT: 'Sturm' };

  let S = null;
  let live = null;
  const ui = { sel: null, tab: 'home', sortKey: 'pos', sortDir: 1, tableTier: null, fixMd: null };

  // ---------- Speichern ----------
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* voll oder gesperrt */ } }
  function loadSave() { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2600);
  }
  function openModal(html) { const m = $('modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.classList.remove('hidden'); }
  function closeModal() { const m = $('modal'); m.classList.add('hidden'); m.innerHTML = ''; }

  // ---------- Helfer ----------
  const ovrBadge = v => `<span class="ovr o${Math.min(9, Math.floor(v / 10))}">${v}</span>`;
  const posBadge = p => `<span class="pos ${p}">${E.POS_LABEL[p]}</span>`;
  const formDots = f => (f || []).map(x => `<span class="dot ${x}">${x}</span>`).join('');
  const tname = id => esc(S.teams[id].name);
  const status = p => p.injured ? `🚑 ${p.injured}` : p.susp ? '⛔ gesperrt' : '';
  const season = () => `${S.season}/${String(S.season + 1).slice(2)}`;
  const barCls = v => v >= 60 ? '' : v >= 30 ? 'warn' : 'bad';
  const bar = v => `<div class="bar ${barCls(v)}"><i style="width:${Math.max(2, Math.min(100, v))}%"></i></div>`;

  // ---------- Start ----------
  function renderStart() {
    $('app').innerHTML = `<div class="start card">
      <h1>⚽ Kreisliga-Karriere</h1>
      <p class="muted">Ein Verein steht kurz vor der Auflösung, und deine Freitagsrunde soll ihn retten. Starte in der untersten Leipziger Liga und arbeite dich Kapitel für Kapitel bis in die Bundesliga hoch. Niemand altert, Training und Transfers entscheiden.</p>
      <label>Dein Name (Trainer)</label><input type="text" id="inManager" value="Trainer" maxlength="24">
      <label>Dein Verein</label><input type="text" id="inClub" value="FC Freitagskicker" maxlength="30">
      <label>Deine Freitagsrunde (eine Zeile pro Person, Format: Name, Position mit TW, AB, MF oder ST)</label>
      <textarea id="inFriends" placeholder="Name, Position">${esc(defaultFriendsText())}</textarea>
      <p class="small muted">Alle anderen Vereine und Spieler sind frei erfunden.</p>
      <button class="btn primary big" data-act="start">Karriere starten</button>
    </div>`;
  }
  function defaultFriendsText() { return (globalThis.GameData.FRIENDS || []).map(f => `${f.name}, ${f.pos}`).join('\n'); }
  function parseFriends(text) {
    const prof = {}; (globalThis.GameData.FRIENDS || []).forEach(f => { prof[f.name.toLowerCase()] = f; });
    return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 24).map(l => {
      const parts = l.split(/[,;]/), name = parts[0].trim(), pr = prof[name.toLowerCase()] || {};
      return Object.assign({}, pr, { name, pos: (parts[1] || '').trim() || pr.pos || '' });
    }).filter(f => f.name);
  }

  // ---------- Kopf & Navigation ----------
  const TABS = [['home', 'Übersicht'], ['story', 'Story'], ['squad', 'Kader'], ['lineup', 'Aufstellung'], ['table', 'Tabelle'], ['fixtures', 'Spielplan'], ['transfers', 'Transfers'], ['club', 'Verein']];
  function header() {
    const t = E.userTeam(S), lg = E.userLeague(S);
    return `<header class="top"><div><div class="club">${esc(t.name)}</div>
      <div class="sub">${esc(S.manager)} · Saison ${season()} · ${esc(lg.name)} (Stufe ${lg.tier}/9)</div></div>
      <div class="money">${money(S.budget)}</div></header>
      <nav>${TABS.map(([k, l]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${l}</button>`).join('')}</nav>`;
  }
  function render() {
    if (!S) { renderStart(); return; }
    $('app').innerHTML = header() + `<main>${VIEWS[ui.tab]()}</main>`;
  }

  // ---------- Übersicht ----------
  function homeView() {
    const t = E.userTeam(S), lg = E.userLeague(S), fx = E.nextFixture(S);
    const tb = E.sortedTable(S, lg), pos = tb.findIndex(r => r.id === S.userId) + 1;
    const results = E.userResults(S, 5);
    const conf = S.board.confidence;
    let next;
    if (S.phase === 'seasonEnd') next = `<button class="btn primary big" data-act="seasonEnd">Saisonabschluss ansehen</button>`;
    else if (S.fired) next = `<button class="btn danger big" data-act="gameover">Du wurdest entlassen</button>`;
    else {
      const opp = fx.opp, oppPos = tb.findIndex(r => r.id === opp.id) + 1;
      next = `<div class="versus"><div class="t">${esc(fx.home.name)}</div><div class="vs">vs</div><div class="t">${esc(fx.away.name)}</div></div>
        <p class="muted small center">Spieltag ${fx.md + 1}/${E.MATCHDAYS} · ${fx.isHome ? 'Heimspiel' : 'Auswärtsspiel'} · Gegner: Platz ${oppPos}, Stärke ${E.teamRating(opp)} (du: ${E.teamRating(t)})</p>
        <button class="btn primary big" data-act="play">Spieltag starten ▶</button>`;
    }
    const injured = t.players.filter(p => p.injured || p.susp);
    return `${chapterCard()}<div class="card"><h3>Nächstes Spiel</h3>${next}</div>
      <div class="grid2">
        <div class="card"><h3>Vorstand</h3>
          <div class="small muted">Saisonziel: ${esc(S.board.objective.label)}</div>
          <div class="row sb small"><span>Vertrauen</span><b>${Math.round(conf)}%</b></div>${bar(conf)}
          <p class="small muted">Aktuell Platz ${pos} · ${tb[pos - 1].pts} Punkte${S.budget < 0 ? ' · <span style="color:var(--red)">Verein ist im Minus!</span>' : ''}</p>
        </div>
        <div class="card"><h3>Training</h3>
          <select data-change="training">${Object.keys(E.TRAININGS).map(k => `<option value="${k}" ${S.training === k ? 'selected' : ''}>${E.TRAININGS[k]}</option>`).join('')}</select>
          <p class="small muted">Spieler verbessern sich bis zu ihrem Potenzial. "Erholung" füllt die Fitness schneller auf.</p>
          ${S.lastTraining && S.lastTraining.length ? `<div class="small">Zuletzt: ${S.lastTraining.slice(0, 4).map(g => `${esc(g.name)} +1 ${E.STAT_LABEL[g.stat]}`).join(', ')}</div>` : ''}
        </div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Letzte Ergebnisse</h3>${results.length ? `<ul class="clean">${results.map(r => `<li class="row sb"><span class="small">${r.isHome ? 'vs' : '@'} ${esc(r.opp)}</span><span class="res ${r.gf > r.ga ? 'W' : r.gf < r.ga ? 'L' : 'D'}">${r.gf}:${r.ga}</span></li>`).join('')}</ul>` : '<p class="muted small">Noch kein Spiel absolviert.</p>'}</div>
        <div class="card"><h3>Ausfälle</h3>${injured.length ? `<ul class="clean small">${injured.map(p => `<li>${posBadge(p.pos)} ${esc(p.name)} ${status(p)}</li>`).join('')}</ul>` : '<p class="muted small">Alle fit.</p>'}</div>
      </div>
      <div class="card"><h3>Neuigkeiten</h3><ul class="news clean small">${S.news.slice(0, 8).map(n => `<li>• ${esc(n.text)}</li>`).join('')}</ul></div>`;
  }

  // ---------- Story ----------
  const capMark = p => (globalThis.Story && S.story && S.story.captainId === p.id) ? ' ©' : '';
  const paras = txt => String(txt).split('\n\n').map(x => `<p>${esc(x)}</p>`).join('');
  function chapterCard() {
    const c = globalThis.Story.chapter(S);
    return `<div class="card storybox"><div class="tag">Aktuelles Kapitel</div><h3>${esc(c.title)}</h3><p class="small muted">${esc(c.blurb)}</p>
      <button class="btn sm" data-act="tab" data-v="story">Zur Story</button></div>`;
  }
  function storyView() {
    const Sy = globalThis.Story, c = Sy.chapter(S), t = E.userTeam(S);
    const friends = t.players.filter(p => p.friend);
    const log = Sy.log(S);
    return `<div class="card storybox"><div class="tag">Aktuelles Kapitel</div><h2>${esc(c.title)}</h2><p class="muted">${esc(c.blurb)}</p>
        ${c.intro.length ? paras(c.intro.join('\n\n')) : '<p class="small muted">Dieses Kapitel hat keinen Vorspann. Du erlebst es gerade, Spieltag für Spieltag.</p>'}</div>
      <div class="card"><h3>Die Freitagsrunde</h3>${friends.length ? `<div class="friends">${friends.map(p => `<div class="fcard" data-act="player" data-id="${p.id}">
        <div class="row sb"><b>${esc(p.name)}${capMark(p)}</b>${ovrBadge(E.ovr(p))}</div>
        <div class="small">${posBadge(p.pos)} <span class="muted">${esc(p.nick || p.trait)}</span></div>
        <div class="small muted">${esc(p.bio || '')}</div></div>`).join('')}</div>` : '<p class="muted small">Keine Freunde im Kader.</p>'}</div>
      <div class="card"><h3>Tagebuch</h3>${log.length ? `<ul class="clean small">${log.slice(0, 40).map(l => `<li class="logrow"><span class="muted">${l.season}/${String(l.season + 1).slice(2)}${l.md ? ' · ST ' + l.md : ''}</span><br>${esc(l.text)}</li>`).join('')}</ul>` : '<p class="muted small">Noch keine Einträge.</p>'}</div>`;
  }

  // ---------- Kader ----------
  function sortPlayers(ps) {
    const k = ui.sortKey, d = ui.sortDir;
    const val = p => k === 'pos' ? E.POS.indexOf(p.pos) * 1000 - E.ovr(p) : k === 'name' ? p.name : k === 'ovr' ? E.ovr(p) : p[k];
    return ps.slice().sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * d; });
  }
  function squadView() {
    const t = E.userTeam(S);
    const th = (k, l, cls) => `<th class="${cls || ''}" data-act="sort" data-v="${k}">${l}${ui.sortKey === k ? (ui.sortDir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
    return `<div class="card"><div class="row sb"><h3>Kader (${t.players.length}/${E.SQUAD_MAX})</h3><span class="small muted">Tippe auf einen Spieler für Details</span></div>
      <div class="scroll"><table><tr>${th('pos', 'Pos')}${th('name', 'Name')}${th('ovr', 'Stärke', 'num')}${th('tempo', 'TMP', 'num')}${th('technik', 'TEC', 'num')}${th('kondition', 'KON', 'num')}${th('nerven', 'NER', 'num')}${th('form', 'Form', 'num')}${th('fitness', 'Fit', 'num')}${th('goals', 'Tore', 'num')}<th>Status</th></tr>
      ${sortPlayers(t.players).map(p => `<tr class="click" data-act="player" data-id="${p.id}">
        <td>${posBadge(p.pos)}</td><td>${p.friend ? '★ ' : ''}${esc(p.name)}${capMark(p)}</td><td class="num">${ovrBadge(E.ovr(p))}</td>
        <td class="num">${p.tempo}</td><td class="num">${p.technik}</td><td class="num">${p.kondition}</td><td class="num">${p.nerven}</td>
        <td class="num">${Math.round(p.form)}</td><td class="num">${Math.round(p.fitness)}</td><td class="num">${p.goals}</td><td>${status(p)}</td></tr>`).join('')}</table></div></div>`;
  }
  function showPlayer(id) {
    const t = E.userTeam(S), p = t.players.find(x => x.id === id); if (!p) return;
    const why = E.canSell(S, p);
    openModal(`<div class="row sb"><h2>${p.friend ? '★ ' : ''}${esc(p.name)}</h2><button class="btn sm" data-act="closeModal">✕</button></div>
      ${p.nick ? `<p style="margin:0"><i>„${esc(p.nick)}“</i>${capMark(p) ? ' · Kapitän' : ''}</p>` : ''}${p.bio ? `<p class="small muted" style="margin:2px 0 6px">${esc(p.bio)}</p>` : ''}
      <p class="muted">${posBadge(p.pos)} ${POSN[p.pos]} · ${esc(p.trait)} · Stärke ${ovrBadge(E.ovr(p))} · Potenzial ${p.pot}</p>
      ${E.STATS.map(k => `<div class="stat"><span class="small" style="width:80px">${E.STAT_LABEL[k]}</span>${bar(p[k])}<b>${p[k]}</b></div>`).join('')}
      <div class="stat"><span class="small" style="width:80px">Form</span>${bar(p.form)}<b>${Math.round(p.form)}</b></div>
      <div class="stat"><span class="small" style="width:80px">Fitness</span>${bar(p.fitness)}<b>${Math.round(p.fitness)}</b></div>
      <div class="stat"><span class="small" style="width:80px">Moral</span>${bar(p.moral)}<b>${Math.round(p.moral)}</b></div>
      <p class="small">Saison: ${p.apps} Spiele, ${p.goals} Tore, ${p.assists} Vorlagen${p.apps ? `, Ø-Note ${(p.ratingSum / p.apps).toFixed(1)}` : ''}<br>Karriere: ${p.careerApps} Spiele, ${p.careerGoals} Tore<br>Marktwert ${money(E.playerValue(p))} · Gehalt ${money(E.playerWage(p))}/Spieltag ${status(p) ? '· ' + status(p) : ''}</p>
      <div class="row"><button class="btn danger" data-act="sell" data-id="${p.id}" ${why ? 'disabled' : ''}>Verkaufen (${money(E.sellPrice(p))})</button></div>
      ${why ? `<p class="small muted">${esc(why)}</p>` : ''}`);
  }

  // ---------- Aufstellung ----------
  const lastName = n => { const w = String(n).trim().split(' '); return w.length > 1 ? w.slice(1).join(' ') : w[0]; };
  function lineupView() {
    const t = E.userTeam(S); E.fixLineup(t);
    const slots = E.slotsOf(t.formation);
    const strg = E.lineupStrength(t, t.lineup, t.formation, t.tactic);
    const rows = { GK: [], DEF: [], MID: [], ATT: [] };
    slots.forEach((s, i) => rows[s].push(i));
    const top = { ATT: 14, MID: 39, DEF: 64, GK: 87 };
    const cards = [];
    E.POS.forEach(pos => rows[pos].forEach((i, k, arr) => {
      const p = t.players.find(x => x.id === t.lineup[i]);
      const e = Math.round(E.eff(p, pos));
      const sel = ui.sel && ui.sel.type === 'slot' && ui.sel.i === i;
      cards.push(`<button class="pc ${sel ? 'sel' : ''} ${p.pos !== pos ? 'oop' : ''}" style="left:${(k + 1) / (arr.length + 1) * 100}%;top:${top[pos]}%" data-act="pickSlot" data-i="${i}">
        <span class="ovr o${Math.min(9, Math.floor(e / 10))}">${e}</span><span class="pn">${esc(lastName(p.name))}</span><span class="pp">${E.POS_LABEL[p.pos]}${p.friend ? ' ★' : ''}${capMark(p)}</span></button>`);
    }));
    const used = new Set(t.lineup);
    const bench = E.POS.flatMap(pos => t.players.filter(p => p.pos === pos && !used.has(p.id)).sort((a, b) => E.ovr(b) - E.ovr(a)));
    return `<div class="grid2">
      <div class="card"><h3>Startelf – ${t.formation}</h3>
        <div class="pitch"><div class="mid"></div><div class="circ"></div><div class="box t"></div><div class="box b"></div>${cards.join('')}</div>
        <p class="small muted center">Tippe einen Spieler an und dann einen zweiten (Feld oder Bank), um sie zu tauschen. Rot gestrichelt = auf fremder Position.</p>
      </div>
      <div>
        <div class="card"><h3>Formation</h3>
          <select data-change="formation">${Object.keys(E.FORMATIONS).map(f => `<option ${t.formation === f ? 'selected' : ''}>${f}</option>`).join('')}</select>
          <h3 style="margin-top:12px">Taktik</h3>
          <div class="seg">${Object.keys(E.TACTICS).map(k => `<button class="${t.tactic === k ? 'on' : ''}" data-act="tactic" data-v="${k}">${E.TACTICS[k].label}</button>`).join('')}</div>
          <h3 style="margin-top:12px">Stärke</h3>
          <div class="stat"><span class="small" style="width:80px">Angriff</span>${bar(Math.round(strg.attack))}<b>${Math.round(strg.attack)}</b></div>
          <div class="stat"><span class="small" style="width:80px">Kontrolle</span>${bar(Math.round(strg.control))}<b>${Math.round(strg.control)}</b></div>
          <div class="stat"><span class="small" style="width:80px">Abwehr</span>${bar(Math.round(strg.defense))}<b>${Math.round(strg.defense)}</b></div>
          <div style="margin-top:10px"><button class="btn" data-act="autoLineup">Automatisch aufstellen</button></div>
        </div>
        <div class="card" style="margin-top:12px"><h3>Bank & Reserve</h3>
          <div class="bench">${bench.map(p => {
            const dis = p.injured || p.susp, sel = ui.sel && ui.sel.type === 'bench' && ui.sel.id === p.id;
            return `<button class="bc ${dis ? 'dis' : ''} ${sel ? 'sel' : ''}" data-act="pickBench" data-id="${p.id}"><span class="ovr o${Math.min(9, Math.floor(E.ovr(p) / 10))}">${E.ovr(p)}</span><span class="pn">${esc(lastName(p.name))}</span><span class="pp">${E.POS_LABEL[p.pos]}${p.friend ? ' ★' : ''} ${p.injured ? '🚑' : p.susp ? '⛔' : ''}</span></button>`;
          }).join('') || '<span class="muted small">Keine Reservespieler.</span>'}</div>
        </div>
      </div></div>`;
  }

  // ---------- Tabelle ----------
  function tableView() {
    const ul = E.userLeague(S);
    const tier = ui.tableTier || ul.tier;
    const lg = S.leagues.find(l => l.tier === tier);
    const tb = E.sortedTable(S, lg);
    const top = E.topScorers(S, lg, 5);
    return `<div class="card"><div class="row sb"><h3>${esc(lg.name)}</h3>
        <select data-change="tableTier" style="width:auto">${S.leagues.slice().reverse().map(l => `<option value="${l.tier}" ${l.tier === tier ? 'selected' : ''}>${l.tier === ul.tier ? '★ ' : ''}${esc(l.name)}</option>`).join('')}</select></div>
      <div class="scroll"><table><tr><th>#</th><th>Verein</th><th class="num">Sp</th><th class="num">S</th><th class="num">U</th><th class="num">N</th><th class="num">Tore</th><th class="num">Diff</th><th class="num">Pkt</th><th>Form</th></tr>
      ${tb.map((r, i) => `<tr class="${r.id === S.userId ? 'me' : ''} ${i < 2 && lg.tier < 9 ? 'up' : ''} ${i >= 8 && lg.tier > 1 ? 'down' : ''}"><td>${i + 1}</td><td>${tname(r.id)}</td><td class="num">${r.p}</td><td class="num">${r.w}</td><td class="num">${r.d}</td><td class="num">${r.l}</td><td class="num">${r.gf}:${r.ga}</td><td class="num">${r.gf - r.ga}</td><td class="num"><b>${r.pts}</b></td><td>${formDots(r.form)}</td></tr>`).join('')}</table></div>
      <p class="small muted">Grün: Aufstieg (Platz 1–2) · Rot: Abstieg (Platz 9–10)</p></div>
      <div class="card"><h3>Torjäger</h3>${top.length ? `<table>${top.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.p.name)}</td><td class="muted">${esc(x.team.name)}</td><td class="num"><b>${x.p.goals}</b></td></tr>`).join('')}</table>` : '<p class="muted small">Noch keine Tore.</p>'}</div>`;
  }

  // ---------- Spielplan ----------
  function fixturesView() {
    const lg = E.userLeague(S);
    const md = ui.fixMd === null ? Math.min(S.matchday, E.MATCHDAYS - 1) : ui.fixMd;
    const res = lg.results[md];
    const rows = lg.fixtures[md].map(([h, a], i) => {
      const r = res && res.find(x => x.h === h && x.a === a);
      const me = h === S.userId || a === S.userId;
      return `<tr class="${me ? 'me' : ''}"><td>${tname(h)}</td><td class="center"><b>${r ? `${r.hg} : ${r.ag}` : '–'}</b></td><td>${tname(a)}</td></tr>${r && r.scorers && r.scorers.length ? `<tr><td colspan="3" class="small muted">⚽ ${r.scorers.map(s => `${esc(s.name)} ${s.min}'`).join(', ')}</td></tr>` : ''}`;
    }).join('');
    return `<div class="card"><div class="row sb"><h3>Spieltag ${md + 1}</h3>
      <select data-change="fixMd" style="width:auto">${Array.from({ length: E.MATCHDAYS }, (_, i) => `<option value="${i}" ${i === md ? 'selected' : ''}>Spieltag ${i + 1}</option>`).join('')}</select></div>
      <table>${rows}</table></div>`;
  }

  // ---------- Transfers ----------
  function transfersView() {
    const t = E.userTeam(S);
    return `<div class="card"><div class="row sb"><h3>Transfermarkt</h3><span class="small muted">Kader ${t.players.length}/${E.SQUAD_MAX} · Budget ${money(S.budget)}</span></div>
      <p class="small muted">Der Markt wird alle 6 Spieltage erneuert. Verkäufe machst du über die Spielerdetails im Kader.</p>
      <div class="scroll"><table><tr><th>Pos</th><th>Name</th><th class="num">Stärke</th><th class="num">Pot.</th><th>Eigenschaft</th><th class="num">Preis</th><th></th></tr>
      ${S.market.map(p => `<tr><td>${posBadge(p.pos)}</td><td>${esc(p.name)}</td><td class="num">${ovrBadge(E.ovr(p))}</td><td class="num">${p.pot}</td><td class="small muted">${esc(p.trait)}</td><td class="num">${money(p.price)}</td>
        <td><button class="btn sm primary" data-act="buy" data-id="${p.id}" ${p.price > S.budget || t.players.length >= E.SQUAD_MAX ? 'disabled' : ''}>Kaufen</button></td></tr>`).join('')}</table></div></div>`;
  }

  // ---------- Verein ----------
  function clubView() {
    const t = E.userTeam(S), lg = E.userLeague(S);
    const top = t.players.slice().sort((a, b) => b.careerGoals - a.careerGoals).slice(0, 5);
    return `<div class="grid2">
      <div class="card"><h3>Finanzen (diese Saison)</h3>
        <table><tr><td>Einnahmen</td><td class="num">${money(S.finance.income)}</td></tr><tr><td>Ausgaben</td><td class="num">${money(S.finance.expense)}</td></tr><tr><td><b>Kontostand</b></td><td class="num"><b>${money(S.budget)}</b></td></tr></table>
        <p class="small muted">Gehälter: ${money(t.players.reduce((s, p) => s + E.playerWage(p), 0))} pro Spieltag · Fans: ${Math.round(S.fans)}%</p></div>
      <div class="card"><h3>Karriere</h3><p class="small">Bundesliga-Meistertitel: <b>${S.titles || 0}</b><br>Aktuelle Liga: ${esc(lg.name)}</p>
        <h3>Vereinslegenden (Tore)</h3>${top.length ? `<ul class="clean small">${top.map(p => `<li>${esc(p.name)} – ${p.careerGoals} Tore in ${p.careerApps} Spielen</li>`).join('')}</ul>` : ''}</div></div>
      <div class="card"><h3>Saisonhistorie</h3>${S.history.length ? `<table><tr><th>Saison</th><th>Liga</th><th class="num">Platz</th><th class="num">Pkt</th><th></th></tr>${S.history.slice().reverse().map(h => `<tr><td>${h.season}/${String(h.season + 1).slice(2)}</td><td>${esc(h.leagueName)}</td><td class="num">${h.pos}</td><td class="num">${h.pts}</td><td>${h.champion ? '🏆' : ''}${h.promoted ? '⬆️' : h.relegated ? '⬇️' : ''}</td></tr>`).join('')}</table>` : '<p class="muted small">Noch keine abgeschlossene Saison.</p>'}</div>
      <div class="card"><h3>Spielstand</h3><div class="row">
        <button class="btn" data-act="export">Exportieren</button>
        <label class="btn" style="margin:0;color:var(--text)">Importieren<input type="file" id="importFile" accept="application/json" style="display:none"></label>
        <button class="btn danger" data-act="newgame">Neue Karriere</button></div>
        <p class="small muted">Gespeichert wird automatisch im Browser nach jedem Spieltag.</p></div>`;
  }

  const VIEWS = { home: homeView, story: storyView, squad: squadView, lineup: lineupView, table: tableView, fixtures: fixturesView, transfers: transfersView, club: clubView };

  // ---------- Live-Match ----------
  function matchHtml(m) {
    return `<div class="score"><div class="teams"><span>${esc(m.home.team.name)}</span><span>${esc(m.away.team.name)}</span></div>
      <div class="big" id="mScore">0 : 0</div><div class="muted" id="mMin">Anpfiff</div></div>
      <div class="feed" id="mFeed"></div>
      <div class="row" id="mCtl" style="margin-top:10px"></div><div id="mPanel"></div>`;
  }
  function setCtl() {
    const c = $('mCtl'); if (!c || !live) return;
    c.innerHTML = live.done ? '' : `<button class="btn sm ${live.speed === 'slow' ? 'primary' : ''}" data-act="speed" data-v="slow">Langsam</button>
      <button class="btn sm ${live.speed === 'normal' ? 'primary' : ''}" data-act="speed" data-v="normal">Normal</button>
      <button class="btn sm ${live.speed === 'fast' ? 'primary' : ''}" data-act="speed" data-v="fast">Schnell</button>
      <button class="btn sm" data-act="tactics">⏸ Taktik / Wechsel</button><button class="btn sm" data-act="skip">⏭ Ende</button>`;
  }
  function pushEvents(evs) {
    const f = $('mFeed'); if (!f) return;
    evs.forEach(e => { f.insertAdjacentHTML('beforeend', `<div class="ev ${e.type}"><span class="min">${e.min}'</span>${esc(e.text)}${e.score ? ` <b>${e.score}</b>` : ''}</div>`); });
    f.scrollTop = f.scrollHeight;
  }
  function updateScore() {
    const m = live.m;
    $('mScore').textContent = `${m.hg} : ${m.ag}`;
    $('mMin').textContent = m.minute >= 90 ? 'Abpfiff' : `${m.minute}. Minute`;
  }
  function startMatch() {
    if (!S || S.fired || S.phase === 'seasonEnd') return;
    const m = E.prepareUserMatch(S);
    live = { m, speed: 'normal', timer: null, paused: false, htShown: false, done: false, key: m.userSide };
    openModal(matchHtml(m)); setCtl();
    pushEvents([{ type: 'info', min: 0, text: `Anpfiff: ${m.home.team.name} gegen ${m.away.team.name}` }]);
    tick();
  }
  function tick() {
    if (!live || live.paused || live.done) return;
    const m = live.m;
    if (m.minute >= 90) { endMatch(); return; }
    pushEvents(E.stepMinute(m)); updateScore();
    if (m.minute === 45 && !live.htShown) {
      live.htShown = true;
      pushEvents([{ type: 'info', min: 45, text: `Halbzeit: ${m.hg}:${m.ag}` }]);
      openTactics(); return;
    }
    if (m.minute >= 90) { live.timer = setTimeout(endMatch, 500); return; }
    live.timer = setTimeout(tick, { slow: 900, normal: 400, fast: 80 }[live.speed]);
  }
  function openTactics() {
    if (!live || live.done) return;
    clearTimeout(live.timer); live.paused = true;
    const m = live.m, side = m[live.key];
    $('mPanel').innerHTML = `<div class="card" style="margin-top:10px"><h3>Taktik</h3>
      <div class="seg">${Object.keys(E.TACTICS).map(k => `<button class="${side.tactic === k ? 'on' : ''}" data-act="mTactic" data-v="${k}">${E.TACTICS[k].label}</button>`).join('')}</div>
      <h3 style="margin-top:12px">Wechsel (${side.subs}/3)</h3>
      <div class="row"><select id="subOut" style="flex:1">${side.on.map(o => `<option value="${o.p.id}">${E.POS_LABEL[o.slot]} ${esc(o.p.name)} (${Math.round(E.eff(o.p, o.slot))})</option>`).join('')}</select>
      <span>→</span>
      <select id="subIn" style="flex:1">${side.bench.filter(b => !b.injured && !b.susp).map(p => `<option value="${p.id}">${E.POS_LABEL[p.pos]} ${esc(p.name)} (${Math.round(E.eff(p))})</option>`).join('')}</select>
      <button class="btn sm" data-act="doSub">Wechseln</button></div>
      <div style="margin-top:12px"><button class="btn primary big" data-act="resume">Weiterspielen ▶</button></div></div>`;
  }
  function endMatch() {
    if (!live || live.done) return;
    live.done = true; clearTimeout(live.timer);
    const m = live.m, s = E.matchSummary(m);
    updateScore(); setCtl();
    const me = m.userSide === 'home' ? s.hg - s.ag : s.ag - s.hg;
    $('mPanel').innerHTML = `<div class="card" style="margin-top:10px"><h3>${me > 0 ? '🎉 Sieg!' : me < 0 ? 'Niederlage' : 'Unentschieden'} (${s.hg}:${s.ag})</h3>
      ${s.motm ? `<p class="small">Spieler des Spiels: <b>${esc(s.motm.name)}</b> (${s.motm.rating.toFixed(1)})</p>` : ''}
      <div class="small muted">Deine Spieler: ${s.ratings.slice(0, 6).map(r => `${esc(r.name)} ${r.rating.toFixed(1)}`).join(' · ')}</div>
      <div style="margin-top:12px"><button class="btn primary big" data-act="finish">Weiter</button></div></div>`;
  }
  function finishMatch() {
    const m = live.m; live = null;
    const info = E.finalizeMatchday(S, m);
    save(); closeModal(); render(); window.scrollTo(0, 0);
    showPending();
    return info;
  }

  // ---------- Ereignisse, Saisonende, Entlassung ----------
  function showPending() {
    if (S.fired && S.phase !== 'seasonEnd') { gameOverModal(); return; }
    if (S.phase === 'seasonEnd') { seasonEndModal(); return; }
    const v = E.pendingEvent(S);
    if (!v) return;
    openModal(`${v.tag ? `<div class="tag">${esc(v.tag)}</div>` : ''}<h2>${esc(v.title)}</h2>${paras(v.text)}<div class="slots">${v.choices.map(c => `<button class="btn" data-act="choice" data-i="${c.i}" ${c.disabled ? 'disabled' : ''}>${esc(c.label)}${c.disabled ? ' (zu teuer)' : ''}</button>`).join('')}</div>`);
  }
  function seasonEndModal() {
    const s = S.seasonSummary; if (!s) return;
    openModal(`<h2>Saison ${s.season}/${String(s.season + 1).slice(2)} beendet</h2>
      <p>${esc(s.leagueName)}: <b>Platz ${s.pos}</b> mit ${s.pts} Punkten (${s.w}S ${s.d}U ${s.l}N, ${s.gf}:${s.ga})</p>
      <p>${s.champion ? '🏆 Meister! ' : ''}${s.promoted ? '⬆️ Aufstieg! ' : ''}${s.relegated ? '⬇️ Abstieg. ' : ''}</p>
      <p class="small">Saisonziel „${esc(s.objective)}“: <b>${s.objectiveMet ? 'erreicht ✔' : 'verfehlt ✘'}</b> · Prämie ${money(s.prize)}<br>
      Vertrauen des Vorstands: ${Math.round(s.confidence)}%</p>
      ${paras(globalThis.Story.outro(S, s).join('\n\n'))}
      ${s.topScorer ? `<p class="small muted">Torschützenkönig der Liga: ${esc(s.topScorer.name)} (${esc(s.topScorer.team)}) mit ${s.topScorer.goals} Toren${s.ownTopScorer ? ` · Bester eigener: ${esc(s.ownTopScorer.name)} (${s.ownTopScorer.goals})` : ''}</p>` : ''}
      ${S.fired ? '<p style="color:var(--red)"><b>Der Vorstand hat das Vertrauen verloren. Du wurdest entlassen.</b></p><button class="btn danger big" data-act="gameover">Weiter</button>'
        : '<button class="btn primary big" data-act="nextSeason">Nächste Saison starten</button>'}`);
  }
  function gameOverModal() {
    openModal(`<h2>Entlassen</h2><p>${esc(globalThis.Story.firedText(S))}</p>
      <button class="btn primary big" data-act="newgame2">Neue Karriere starten</button>`);
  }

  // ---------- Aktionen ----------
  const act = {
    start() {
      S = E.newGame({ manager: $('inManager').value.trim() || 'Trainer', club: $('inClub').value.trim() || 'FC Freitagskicker', friends: parseFriends($('inFriends').value) });
      globalThis.Story.ensure(S); globalThis.GameEvents.maybeTrigger(S, true);
      ui.tab = 'home'; save(); render(); showPending();
    },
    tab(d) { ui.sel = null; ui.tab = d.v; render(); window.scrollTo(0, 0); },
    play() { startMatch(); },
    sort(d) { if (ui.sortKey === d.v) ui.sortDir *= -1; else { ui.sortKey = d.v; ui.sortDir = (d.v === 'name' || d.v === 'pos') ? 1 : -1; } render(); },
    player(d) { showPlayer(d.id); },
    closeModal() { closeModal(); },
    sell(d) { const r = E.sell(S, d.id); toast(r.msg); if (r.ok) { closeModal(); save(); render(); } },
    buy(d) { const r = E.buy(S, d.id); toast(r.msg); if (r.ok) { save(); render(); } },
    tactic(d) { E.userTeam(S).tactic = d.v; save(); render(); },
    autoLineup() { E.autoLineup(S); ui.sel = null; save(); render(); },
    pickSlot(d) {
      const t = E.userTeam(S), i = Number(d.i), s = ui.sel;
      if (!s) ui.sel = { type: 'slot', i };
      else if (s.type === 'slot') { if (s.i !== i) { E.setSlot(S, i, t.lineup[s.i]); save(); } ui.sel = null; }
      else {
        const p = t.players.find(x => x.id === s.id);
        if (p && (p.injured || p.susp)) toast('Dieser Spieler ist verletzt oder gesperrt.');
        else { E.setSlot(S, i, s.id); save(); }
        ui.sel = null;
      }
      render();
    },
    pickBench(d) {
      const t = E.userTeam(S), p = t.players.find(x => x.id === d.id), s = ui.sel;
      if (!p) return;
      if (s && s.type === 'slot') {
        if (p.injured || p.susp) { toast('Dieser Spieler ist verletzt oder gesperrt.'); return; }
        E.setSlot(S, s.i, p.id); ui.sel = null; save();
      } else ui.sel = (s && s.type === 'bench' && s.id === d.id) ? null : { type: 'bench', id: d.id };
      render();
    },
    speed(d) { if (!live) return; live.speed = d.v; setCtl(); },
    tactics() { openTactics(); },
    mTactic(d) { E.setMatchTactic(live.m, live.key, d.v); E.userTeam(S).tactic = d.v; openTactics(); },
    doSub() {
      const r = E.subPlayer(live.m, live.key, $('subOut').value, $('subIn').value);
      if (r.ok) pushEvents([r.ev]); else toast(r.msg);
      openTactics();
    },
    resume() { live.paused = false; $('mPanel').innerHTML = ''; tick(); },
    skip() {
      if (!live) return; clearTimeout(live.timer);
      const m = live.m; let guard = 0;
      while (m.minute < 90 && guard++ < 100) pushEvents(E.stepMinute(m));
      updateScore(); $('mPanel').innerHTML = ''; endMatch();
    },
    finish() { finishMatch(); },
    choice(d) {
      const text = E.resolveEvent(S, Number(d.i)); save(); render();
      openModal(`${paras(text)}<button class="btn primary big" data-act="afterChoice">Weiter</button>`);
    },
    afterChoice() { closeModal(); showPending(); },
    seasonEnd() { seasonEndModal(); },
    nextSeason() { E.startNextSeason(S); ui.tableTier = null; ui.fixMd = null; save(); closeModal(); render(); window.scrollTo(0, 0); showPending(); },
    gameover() { gameOverModal(); },
    newgame2() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignorieren */ } S = null; live = null; closeModal(); renderStart(); },
    newgame() { openModal(`<h2>Neue Karriere?</h2><p>Der aktuelle Spielstand geht verloren (exportiere ihn vorher, wenn du ihn behalten willst).</p><div class="row"><button class="btn danger" data-act="newgame2">Ja, neu starten</button><button class="btn" data-act="closeModal">Abbrechen</button></div>`); },
    export() {
      const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kreisliga-karriere-spielstand.json'; a.click();
    }
  };
  const change = {
    training(el) { S.training = el.value; save(); },
    formation(el) { ui.sel = null; E.setFormation(S, el.value); save(); render(); },
    slot(el) { E.setSlot(S, Number(el.dataset.i), el.value); save(); render(); },
    tableTier(el) { ui.tableTier = Number(el.value); render(); },
    fixMd(el) { ui.fixMd = Number(el.value); render(); }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el || el.disabled) return;
    const fn = act[el.dataset.act]; if (fn) fn(el.dataset);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'importFile' && el.files && el.files[0]) {
      const r = new FileReader();
      r.onload = () => { try { const d = JSON.parse(r.result); if (!d.teams || !d.userId) throw new Error('x'); S = d; globalThis.Story.ensure(S); save(); render(); toast('Spielstand geladen.'); showPending(); } catch (err) { toast('Datei ist kein gültiger Spielstand.'); } };
      r.readAsText(el.files[0]); return;
    }
    const fn = el.dataset && change[el.dataset.change]; if (fn) fn(el);
  });

  function init() {
    S = loadSave();
    if (S && (!S.teams || !S.userId)) S = null;
    if (S) globalThis.Story.ensure(S);
    render();
    if (S) showPending();
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
  globalThis.__UI = { act, change, render, ui, getS: () => S, setS: s => { S = s; } };
})();
