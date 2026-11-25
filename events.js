// Zufallsereignisse zwischen den Spieltagen (Story-Elemente des Karrieremodus).
(function () {
  'use strict';
  const E = globalThis.Engine, U = E.util, money = E.fmtMoney;
  const find = (S, pid) => E.userTeam(S).players.find(p => p.id === pid);
  const tierScale = S => E.scale(E.userTeam(S).tier);

  // Jedes Ereignis: make(S) -> ctx oder null (nicht möglich), title, text(S, ctx), choices[]
  // choice: { label(S, ctx), cost(S, ctx) optional, run(S, ctx) -> Ergebnistext }
  const defs = {
    sponsor: {
      weight: 2, title: 'Sponsorenangebot',
      make: S => ({ amt: Math.round(2500 * tierScale(S)) }),
      text: (S, c) => `Ein lokaler Unternehmer möchte Werbung auf euren Trikots schalten und bietet ${money(c.amt)}.`,
      choices: [
        { label: () => 'Annehmen', run: (S, c) => { S.budget += c.amt; S.finance.income += c.amt; return `Handschlag drauf! ${money(c.amt)} landen in der Vereinskasse.`; } },
        { label: () => 'Mehr verhandeln (Risiko)', run: (S, c) => {
          if (U.chance(0.55)) { const a = Math.round(c.amt * 1.8); S.budget += a; S.finance.income += a; return `Er legt nach! ${money(a)} fließen in die Kasse.`; }
          return 'Der Unternehmer ist verschnupft und zieht sein Angebot zurück.';
        } }
      ]
    },
    unhappy: {
      weight: 2, title: 'Unzufriedener Spieler',
      make: S => {
        const t = E.userTeam(S), starters = new Set(t.lineup);
        const bench = t.players.filter(p => !starters.has(p.id) && !p.injured).sort((a, b) => E.ovr(b) - E.ovr(a));
        return bench.length ? { pid: bench[0].id } : null;
      },
      text: (S, c) => { const p = find(S, c.pid); return `${p ? p.name : 'Ein Spieler'} beschwert sich, dass er zu wenig Einsatzzeit bekommt.`; },
      choices: [
        { label: () => 'Mehr Einsatzzeit versprechen', run: (S, c) => { const p = find(S, c.pid); if (p) p.moral = Math.min(100, p.moral + 20); return 'Er strahlt – du hast jetzt aber ein Versprechen einzulösen.'; } },
        { label: () => 'Hart bleiben: Leistung zählt', run: (S, c) => { const p = find(S, c.pid); if (p) { p.moral = Math.max(10, p.moral - 15); p.form = Math.max(20, p.form - 5); } return 'Er schluckt es runter, die Stimmung leidet aber spürbar.'; } }
      ]
    },
    teamNight: {
      weight: 2, title: 'Teamabend',
      make: S => ({ cost: Math.round(400 * tierScale(S)) }),
      text: (S, c) => `Die Mannschaft wünscht sich einen gemeinsamen Abend. Kostenpunkt: ${money(c.cost)}.`,
      choices: [
        { label: (S, c) => `Spendieren (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; E.userTeam(S).players.forEach(p => { p.moral = Math.min(100, p.moral + 10); }); return 'Ein gelungener Abend. Die Stimmung im Team steigt.'; } },
        { label: () => 'Absagen', run: S => { E.userTeam(S).players.forEach(p => { p.moral = Math.max(10, p.moral - 3); }); return 'Die Enttäuschung hält sich in Grenzen, ein bisschen Murren gibt es trotzdem.'; } }
      ]
    },
    camp: {
      weight: 1, title: 'Trainingslager',
      make: S => ({ cost: Math.round(3000 * tierScale(S)) }),
      text: (S, c) => `Ein Wochenende im Trainingslager würde die Truppe fit machen. Es kostet ${money(c.cost)}.`,
      choices: [
        { label: (S, c) => `Buchen (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; E.userTeam(S).players.forEach(p => { p.fitness = 100; p.form = Math.min(100, p.form + 8); }); return 'Alle kommen topfit und gut gelaunt zurück.'; } },
        { label: () => 'Nicht nötig', run: () => 'Du sparst das Geld.' }
      ]
    },
    press: {
      weight: 2, title: 'Presseanfrage',
      make: () => ({}),
      text: () => 'Die Lokalzeitung fragt nach deinen Zielen für die Saison.',
      choices: [
        { label: () => 'Selbstbewusst auftreten', run: S => {
          S.board.confidence = Math.min(100, S.board.confidence + 5);
          if (U.chance(0.4)) { E.userTeam(S).players.forEach(p => { p.moral = Math.max(10, p.moral - 5); }); return 'Der Vorstand ist begeistert, die Spieler spüren aber den Druck.'; }
          return 'Der Vorstand ist begeistert, die Fans auch.';
        } },
        { label: () => 'Bescheiden bleiben', run: S => { S.board.confidence = Math.min(100, S.board.confidence + 2); E.userTeam(S).players.forEach(p => { p.moral = Math.min(100, p.moral + 2); }); return 'Solide Worte, alle sind zufrieden.'; } }
      ]
    },
    pitch: {
      weight: 1, title: 'Platz in schlechtem Zustand',
      make: S => ({ cost: Math.round(1200 * tierScale(S)) }),
      text: (S, c) => `Der Platzwart warnt: Der Rasen ist uneben. Reparatur: ${money(c.cost)}.`,
      choices: [
        { label: (S, c) => `Reparieren lassen (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; return 'Der Platz ist wieder in Schuss.'; } },
        { label: () => 'Ignorieren', run: S => {
          if (U.chance(0.5)) { const p = U.pick(E.userTeam(S).players); p.injured = 2; return `Pech: ${p.name} knickt um und fällt 1 Spieltag aus.`; }
          return 'Zum Glück passiert nichts.';
        } }
      ]
    },
    youth: {
      weight: 2, title: 'Talent aus der Jugend',
      make: S => {
        const t = E.userTeam(S), base = require_base(t.tier) - 8;
        const p = E.genPlayer(base, {}); p.pot = Math.min(97, E.ovr(p) + U.rnd(15, 28));
        return { player: p };
      },
      text: (S, c) => `Der Jugendtrainer empfiehlt ${c.player.name} (${E.POS_LABEL[c.player.pos]}, Stärke ${E.ovr(c.player)}, Potenzial ${c.player.pot}).`,
      choices: [
        { label: () => 'In den Kader aufnehmen', run: (S, c) => {
          const t = E.userTeam(S);
          if (t.players.length >= E.SQUAD_MAX) return 'Der Kader ist voll. Das Talent geht leider woanders hin.';
          t.players.push(c.player); E.addNews(S, `Jugendspieler ${c.player.name} rückt in den Kader.`);
          return `${c.player.name} ist ab sofort dabei.`;
        } },
        { label: () => 'Ablehnen', run: () => 'Du setzt auf die Etablierten.' }
      ]
    },
    offer: {
      weight: 1, title: 'Angebot für einen Spieler',
      make: S => {
        const t = E.userTeam(S);
        const cands = t.players.filter(p => E.canSell(S, p) === null);
        if (!cands.length) return null;
        const p = U.pick(cands);
        return { pid: p.id, amt: Math.round(E.playerValue(p) * 1.5 / 10) * 10 };
      },
      text: (S, c) => { const p = find(S, c.pid); return `Ein anderer Verein bietet ${money(c.amt)} für ${p ? p.name : 'einen Spieler'}.`; },
      choices: [
        { label: (S, c) => `Verkaufen (${money(c.amt)})`, run: (S, c) => {
          const t = E.userTeam(S), p = find(S, c.pid);
          if (!p || E.canSell(S, p)) return 'Der Wechsel kommt nicht zustande.';
          S.budget += c.amt; S.finance.income += c.amt; t.players = t.players.filter(x => x !== p); E.fixLineup(t);
          E.addNews(S, `${p.name} wechselt für ${money(c.amt)}.`);
          return `${p.name} verlässt den Verein. ${money(c.amt)} kommen rein.`;
        } },
        { label: () => 'Ablehnen', run: (S, c) => { const p = find(S, c.pid); if (p) p.moral = Math.min(100, p.moral + 8); return 'Der Spieler freut sich über das Vertrauen.'; } }
      ]
    },
    physio: {
      weight: 1, title: 'Physio-Angebot',
      make: S => E.userTeam(S).players.some(p => p.injured > 0) ? { cost: Math.round(900 * tierScale(S)) } : null,
      text: (S, c) => `Der Physiotherapeut bietet eine Intensivbehandlung für alle Verletzten an: ${money(c.cost)}.`,
      choices: [
        { label: (S, c) => `Bezahlen (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; E.userTeam(S).players.forEach(p => { if (p.injured > 0) p.injured--; }); return 'Alle Verletzten sind einen Spieltag früher zurück.'; } },
        { label: () => 'Nein danke', run: () => 'Die Spieler müssen sich also noch gedulden.' }
      ]
    },
    fans: {
      weight: 1, title: 'Fan-Aktion',
      make: S => ({ cost: Math.round(500 * tierScale(S)) }),
      text: (S, c) => `Die Fans wünschen sich Freibier und Autogrammstunde am Platz (${money(c.cost)}).`,
      choices: [
        { label: (S, c) => `Machen wir (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; S.fans = Math.min(100, S.fans + 8); S.board.confidence = Math.min(100, S.board.confidence + 2); return 'Die Stimmung auf den Rängen ist bestens. Mehr Zuschauer kommen.'; } },
        { label: () => 'Lieber nicht', run: () => 'Die Fans nehmen es sportlich.' }
      ]
    }
  };
  function require_base(tier) { return globalThis.GameData.TIER_BASE[tier - 1]; }

  function maybeTrigger(S, force) {
    if (S.pending || S.fired) return;
    if (!force && !U.chance(0.28)) return;
    const ids = Object.keys(defs);
    for (let tries = 0; tries < 5; tries++) {
      const id = U.wpick(ids, ids.map(k => defs[k].weight));
      const ctx = defs[id].make(S);
      if (ctx) { S.pending = { id, ctx }; return; }
    }
  }
  function pendingView(S) {
    if (!S.pending) return null;
    const d = defs[S.pending.id], c = S.pending.ctx;
    return {
      title: d.title, text: d.text(S, c),
      choices: d.choices.map(ch => {
        const cost = ch.cost ? ch.cost(S, c) : 0;
        return { label: ch.label(S, c), disabled: cost > S.budget, cost };
      })
    };
  }
  function resolve(S, idx) {
    if (!S.pending) return '';
    const d = defs[S.pending.id], ch = d.choices[idx];
    const cost = ch.cost ? ch.cost(S, S.pending.ctx) : 0;
    if (cost > S.budget) return 'Dafür fehlt das Geld.';
    const text = ch.run(S, S.pending.ctx);
    S.pending = null;
    return text;
  }

  globalThis.GameEvents = { maybeTrigger };
  E.pendingEvent = pendingView;
  E.resolveEvent = resolve;
})();
