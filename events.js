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
  // ---- Ereignisse rund um die Freunde (nur, wenn die Person im Kader ist) ----
  const fr = (S, n) => E.userTeam(S).players.find(p => p.friend && p.name === n);
  const bump = (p, d) => { if (p) p.moral = U.clamp(p.moral + d, 10, 100); };
  const teamMoral = (S, d) => E.userTeam(S).players.forEach(p => bump(p, d));
  Object.assign(defs, {
    lorenzLate: {
      weight: 1, title: 'Lorenz und die Pünktlichkeit',
      make: S => fr(S, 'Lorenz') ? {} : null,
      text: () => 'Lorenz kommt wieder erst zur zweiten Halbzeit des Aufwärmspiels. Die Mannschaft tippt demonstrativ auf die Uhr.',
      choices: [
        { label: () => 'Strafrunden anordnen', run: S => { const p = fr(S, 'Lorenz'); if (p) { p.fitness = Math.max(0, p.fitness - 10); bump(p, -3); } teamMoral(S, 2); return 'Lorenz dreht seine Runden und verspricht Besserung. Die Truppe grinst.'; } },
        { label: () => 'Schulterzucken, er ist ja da', run: S => { bump(fr(S, 'Lorenz'), 6); teamMoral(S, -2); return 'Lorenz strahlt, der Rest murrt ein bisschen.'; } }
      ]
    },
    houmanGrill: {
      weight: 1, title: 'Houmans Grillabend',
      make: S => fr(S, 'Houman') ? { cost: Math.round(350 * tierScale(S)) } : null,
      text: (S, c) => `Houman will nach dem Training den Grill anwerfen. Einkauf: ${money(c.cost)}.`,
      choices: [
        { label: (S, c) => `Grillen (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; teamMoral(S, 9); S.fans = U.clamp(S.fans + 1, 20, 100); return 'Es wird spät, es wird laut, und am nächsten Tag redet niemand mehr über die letzte Niederlage.'; } },
        { label: () => 'Diesmal nicht', run: S => { bump(fr(S, 'Houman'), -6); return 'Houman packt den Grill wieder ein, ein bisschen enttäuscht.'; } }
      ]
    },
    georgJohann: {
      weight: 1, title: 'Streit um den Elfmeter',
      make: S => (fr(S, 'Georg') && fr(S, 'Johann')) ? {} : null,
      text: () => 'Georg und Johann streiten, wer den nächsten Elfmeter schießt. Beide sind überzeugt, der Bessere zu sein, und keiner gibt nach.',
      choices: [
        { label: () => 'Georg schießt', run: S => { bump(fr(S, 'Georg'), 12); bump(fr(S, 'Johann'), -8); return 'Georg nickt zufrieden. Johann tritt gegen den Ballsack.'; } },
        { label: () => 'Johann schießt', run: S => { bump(fr(S, 'Johann'), 12); bump(fr(S, 'Georg'), -8); return 'Johann strahlt. Georg schaut demonstrativ in den Himmel.'; } },
        { label: () => 'Losen', run: S => { teamMoral(S, 2); return 'Eine Münze entscheidet. Beide lachen, der Streit ist vorbei.'; } }
      ]
    },
    arneIdea: {
      weight: 1, title: 'Arnes neue Idee',
      make: S => fr(S, 'Arne') ? {} : null,
      text: () => 'Arne hat nachts eine Taktik skizziert, die „alles verändert“. Er will sie im Training ausprobieren.',
      choices: [
        { label: () => 'Ausprobieren', run: S => {
          if (U.chance(0.6)) { E.userTeam(S).players.filter(p => p.pos === 'MID' || p.pos === 'ATT').forEach(p => { p.form = U.clamp(p.form + 6, 20, 100); }); return 'Die Idee zündet! Mittelfeld und Sturm spielen sich plötzlich Pässe zu, die vorher niemand gesehen hat.'; }
          teamMoral(S, -4); return 'Die Idee endet im Chaos, drei Spieler laufen in dieselbe Ecke. Arne verspricht eine überarbeitete Version.';
        } },
        { label: () => 'Zu riskant', run: S => { bump(fr(S, 'Arne'), -3); return 'Arne faltet seinen Zettel zusammen. „Irgendwann.“'; } }
      ]
    },
    hugoNerves: {
      weight: 1, title: 'Hugo schläft schlecht',
      make: S => fr(S, 'Hugo') ? { cost: Math.round(600 * tierScale(S)) } : null,
      text: (S, c) => `Hugo gibt zu, dass er vor wichtigen Spielen kaum schläft. Ein Mentaltrainer kostet ${money(c.cost)}.`,
      choices: [
        { label: (S, c) => `Mentaltraining (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; const p = fr(S, 'Hugo'); if (p) { if (p.nerven < 97) p.nerven++; bump(p, 12); } return 'Hugo steht danach merklich ruhiger im Tor.'; } },
        { label: () => 'Alles gut, Hugo', run: S => { bump(fr(S, 'Hugo'), -2); return 'Hugo nickt. Ob es hilft, wird man sehen.'; } }
      ]
    },
    albertKnee: {
      weight: 1, title: 'Alberts Knie',
      make: S => { const p = fr(S, 'Albert'); return (p && !p.injured) ? { cost: Math.round(500 * tierScale(S)) } : null; },
      text: (S, c) => `Albert hält sich nach dem Training das Knie. Ein Physio könnte nachsehen (${money(c.cost)}).`,
      choices: [
        { label: (S, c) => `Zum Physio (${money(c.cost)})`, cost: (S, c) => c.cost, run: (S, c) => { S.budget -= c.cost; S.finance.expense += c.cost; return 'Nur eine Zerrung, nichts Schlimmes. Albert kann weitermachen.'; } },
        { label: () => 'Wird schon', run: S => { const p = fr(S, 'Albert'); if (p && U.chance(0.5)) { p.injured = 3; return 'Pech: Das Knie macht nicht mit, Albert fällt 2 Spieltage aus.'; } return 'Zum Glück geht es gut.'; } }
      ]
    },
    sprintDuel: {
      weight: 1, title: 'Sprintduell',
      make: S => (fr(S, 'Frederik') && fr(S, 'Lino')) ? {} : null,
      text: () => 'Frederik fordert Lino zu einem Sprintduell über 50 Meter heraus. Die ganze Mannschaft will zusehen.',
      choices: [
        { label: () => 'Rennen veranstalten', run: S => {
          const f = fr(S, 'Frederik'), l = fr(S, 'Lino'); [f, l].forEach(p => { p.form = U.clamp(p.form + 5, 20, 100); bump(p, 4); });
          if (U.chance(0.2)) { const v = U.pick([f, l]); v.injured = 2; return `Ein Sprint wie im Fernsehen, aber ${v.name} zieht sich dabei eine Zerrung zu und fällt 1 Spieltag aus.`; }
          return 'Zielfoto-Entscheidung! Beide sind danach bestens gelaunt.';
        } },
        { label: () => 'Lieber nicht', run: () => 'Das Duell wird verschoben, was niemand glaubt.' }
      ]
    }
  });
  function require_base(tier) { return globalThis.GameData.TIER_BASE[tier - 1]; }

  function maybeTrigger(S, force) {
    if (S.pending || S.fired) return;
    if (globalThis.Story && globalThis.Story.check(S)) return;
    if (!force && !U.chance(0.28)) return;
    const ids = Object.keys(defs).filter(k => !defs[k].story); // Story-Szenen laufen nur über Story.check
    for (let tries = 0; tries < 5; tries++) {
      const id = U.wpick(ids, ids.map(k => defs[k].weight));
      const ctx = defs[id].make(S);
      if (ctx) { S.pending = { id, ctx }; return; }
    }
  }
  function pendingView(S) {
    if (!S.pending) return null;
    const d = defs[S.pending.id], c = S.pending.ctx;
    if (!d) { S.pending = null; return null; }
    const val = x => typeof x === 'function' ? x(S, c) : x;
    return {
      title: val(d.title), tag: val(d.tag) || '', story: !!d.story, text: d.text(S, c),
      choices: d.choices.map((ch, i) => ({ ch, i })).filter(x => !x.ch.show || x.ch.show(S, c)).map(({ ch, i }) => {
        const cost = ch.cost ? ch.cost(S, c) : 0;
        return { i, label: ch.label(S, c), disabled: cost > 0 && cost > S.budget, cost };
      })
    };
  }
  function resolve(S, idx) {
    if (!S.pending) return '';
    const prev = S.pending, d = defs[prev.id], ch = d && d.choices[idx];
    if (!ch) { S.pending = null; return ''; }
    const cost = ch.cost ? ch.cost(S, prev.ctx) : 0;
    if (cost > 0 && cost > S.budget) return 'Dafür fehlt das Geld.';
    const text = ch.run(S, prev.ctx);
    if (S.pending === prev) S.pending = null; // eine Szene darf die nächste setzen
    return text;
  }

  globalThis.GameEvents = { maybeTrigger, register: (id, def) => { defs[id] = def; } };
  E.pendingEvent = pendingView;
  E.resolveEvent = resolve;
})();
