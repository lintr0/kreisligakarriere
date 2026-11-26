// Story-Schicht: Kapitel pro Liga, Schlüsselszenen mit Entscheidungen, Rivale, Kapitän, Tagebuch.
// Alle Figuren (Vorsitzender, Rivale, Platzwart ...) sind frei erfunden und in data.js (STORY) änderbar.
(function () {
  'use strict';
  const E = globalThis.Engine, GE = globalThis.GameEvents, G = globalThis.GameData, U = E.util;
  const money = E.fmtMoney;
  const ST = G.STORY || {};
  const CHAIR = ST.chairman || 'Herr Kowalczyk';
  const RIVAL = ST.rival || 'SV Stötteritz';
  const RCOACH = ST.rivalCoach || 'Dieter Raschke';
  const GROUNDS = ST.groundsman || 'Uwe';
  const SPONSOR = ST.sponsor || 'Autohaus Brandt';

  // ---------- Helfer ----------
  const T = S => E.userTeam(S);
  const tierOf = S => E.userLeague(S).tier;
  const friend = (S, n) => T(S).players.find(p => p.friend && p.name === n);
  const friendNames = S => T(S).players.filter(p => p.friend).map(p => p.name);
  const joinNames = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1];
  const para = (...a) => a.join('\n\n');
  const fill = (S, str) => String(str).replace(/\{club\}/g, T(S).name).replace(/\{manager\}/g, S.manager).replace(/\{chair\}/g, CHAIR);

  function ensure(S) {
    if (!S.story) S.story = { flags: {}, shown: {}, log: [], captainId: null, rivalId: null };
    const s = S.story;
    if (!s.rivalId) { const r = Object.values(S.teams).find(t => t.name === RIVAL); if (r) s.rivalId = r.id; }
    return s;
  }
  function log(S, text) {
    const s = ensure(S);
    s.log.unshift({ season: S.season, md: S.matchday, tier: tierOf(S), text });
    if (s.log.length > 80) s.log.length = 80;
  }
  const bump = (p, d) => { if (p) p.moral = U.clamp(p.moral + d, 10, 100); };
  const moralAll = (S, d) => T(S).players.forEach(p => bump(p, d));
  const fxCost = (S, fx) => fx.money < 0 ? Math.round(-fx.money * E.scale(tierOf(S))) : 0;
  function applyFx(S, fx) {
    if (fx.money) {
      const a = Math.round(fx.money * E.scale(tierOf(S)));
      S.budget += a; if (a > 0) S.finance.income += a; else S.finance.expense -= a;
    }
    if (fx.moral) moralAll(S, fx.moral);
    if (fx.fans) S.fans = U.clamp(S.fans + fx.fans, 20, 100);
    if (fx.conf) S.board.confidence = U.clamp(S.board.confidence + fx.conf, 0, 100);
    if (fx.form) T(S).players.forEach(p => { p.form = U.clamp(p.form + fx.form, 20, 100); });
    if (fx.fitness) T(S).players.forEach(p => { p.fitness = U.clamp(p.fitness + fx.fitness, 0, 100); });
  }
  // Auswahlmöglichkeit: Label, Effekte, Ergebnistext, optionaler Zusatz (liefert Text), optionale Sichtbarkeit
  function ch(label, fx, res, extra, show) {
    fx = fx || {};
    return {
      label: () => label, show, cost: S => fxCost(S, fx),
      run: (S, c) => { applyFx(S, fx); const more = extra ? extra(S, c) : ''; const t = res + (more ? ' ' + more : ''); log(S, t); return t; }
    };
  }

  // ---------- Kapitel ----------
  const CHAPTERS = {
    1: { title: 'Kapitel 1: Der letzte Freitag', intro: [
      'Der Traditionsverein {club} steht kurz vor der Auflösung. {chair} hat der Freitagsrunde eine Saison gegeben, um ihn zu retten.',
      'Ganz unten in der Kreisklasse Leipzig beginnt eine Geschichte, die irgendwo in der Bundesliga enden soll.'] },
    2: { title: 'Kapitel 2: Raus aus dem Schatten', intro: [
      'Der Aufstieg hat sich herumgesprochen. In der Stadtliga Leipzig sind die Plätze voller, die Gegner erfahrener und die Zuschauer lauter. {chair} hat das Vereinsheim streichen lassen.',
      'Aus der Freitagsrunde ist eine Mannschaft geworden. Jetzt muss sie beweisen, dass das kein Zufall war.'] },
    3: { title: 'Kapitel 3: Landesweit unterwegs', intro: [
      'Landesklasse Sachsen: Die Auswärtsfahrten werden länger, die Gegner kommen aus Grimma, Oschatz und Torgau. Der Vereinsbus bekommt einen neuen Anstrich und hoffentlich neue Bremsen.',
      'Wer hier oben bestehen will, braucht mehr als Freitagsspaß: Breite im Kader, Fitness und Nerven.'] },
    4: { title: 'Kapitel 4: Flutlicht in Sachsen', intro: [
      'Sachsenliga. Zum ersten Mal spielt ihr unter Flutlicht, und auf der Tribüne stehen mehr Zuschauer, als der Verein früher Mitglieder hatte.',
      'Die Zeitung schreibt von den „Freitagskickern“. Der Name bleibt hängen.'] },
    5: { title: 'Kapitel 5: Über die Landesgrenze', intro: [
      'Oberliga Nordost-Süd: Thüringen, Sachsen-Anhalt, weite Wege. Hier sitzen Scouts auf der Tribüne, und manche Spieler träumen plötzlich größer.',
      'Du musst die Runde zusammenhalten, bevor sie auseinandergekauft wird.'] },
    6: { title: 'Kapitel 6: Der lange Weg im Osten', intro: [
      'Regionalliga Nordost. Rostock, Magdeburg, Cottbus: große Stadien, alte Rivalitäten, harte Gegner.',
      'Jedes Wochenende ein Spiel gegen einen Verein mit mehr Geschichte als Geld, und meistens mit mehr Geld als ihr.'] },
    7: { title: 'Kapitel 7: Profis, plötzlich', intro: [
      '3. Liga. Berater rufen an, das Fernsehen interessiert sich für euch. Aus Freunden werden Profis, zumindest fast.',
      'Der Vorstand will wissen, wie weit das noch gehen soll. Du sagst: ganz nach oben.'] },
    8: { title: 'Kapitel 8: Zweite Reihe, großes Ziel', intro: [
      '2. Bundesliga. Die Stadien sind voll, die Gegner kennt man aus dem Fernsehen. Nur noch eine Stufe trennt euch von dem Traum, den ihr damals auf dem Bolzplatz ausgesprochen habt.',
      'Es fühlt sich an wie ein Märchen, und Märchen sind zerbrechlich.'] },
    9: { title: 'Kapitel 9: Die Bundesliga', intro: [
      'Bundesliga. Aus dem Bolzplatz hinter der Turnhalle ist eine Geschichte geworden, die ganz Leipzig erzählt.',
      'Jetzt geht es um eins: bleiben oder noch mehr.'] }
  };
  function chapter(S) {
    const t = tierOf(S), c = CHAPTERS[t];
    const blurb = t === 1 ? 'Rettet den Verein und steigt in die Stadtliga auf.'
      : t < 9 ? `Ziel: der Aufstieg in die ${G.LEAGUES[t].name}.` : 'Ziel: Klassenerhalt, Europa und die Meisterschaft.';
    return { tier: t, title: c.title, blurb, intro: c.intro.map(x => fill(S, x)) };
  }

  // Eine Szene pro Liga (Beträge in Kreisklassen-Einheiten, werden mit der Liga skaliert)
  const TB = {
    1: { title: 'Der kaputte Vereinsbus', text: `${GROUNDS}, der Platzwart, steht mit dem Schlüssel des Vereinsbusses da und schüttelt den Kopf: Bremsen hinüber, Auspuff halb ab. Zum nächsten Auswärtsspiel droht ihr zu spät zu kommen.`,
      c: [{ label: 'Werkstatt bezahlen', fx: { money: -1200, moral: 3 }, res: `Der Bus brummt wieder. ${GROUNDS} verspricht, ihn wie ein rohes Ei zu behandeln.` },
          { label: 'Fahrgemeinschaften bilden', fx: { moral: -3, fans: 1 }, res: 'Es wird eng in den Autos, und irgendwer kommt trotzdem zu spät. Aber der Teamgeist wächst irgendwie.' }] },
    2: { title: SPONSOR + ' klopft an', text: `Mit dem Aufstieg wächst das Interesse. ${SPONSOR} bietet einen Trikotvertrag an. Geld sofort, aber der Inhaber will bei Heimspielen in der Kabine begrüßen.`,
      c: [{ label: 'Unterschreiben', fx: { money: 2500, moral: -2 }, res: 'Das Logo prangt auf der Brust, und die Kasse klingelt. In der Kabine wird es jetzt etwas enger.' },
          { label: 'Höflich ablehnen', fx: { conf: 3, moral: 2 }, res: 'Die Mannschaft ist stolz, unabhängig zu bleiben. Der Vorstand nickt anerkennend.' }] },
    3: { title: 'Lange Fahrten', text: 'Die Auswärtsspiele in Sachsen werden zur Tagesreise. Wer morgens um vier losfährt, spielt selten gut.',
      c: [{ label: 'Hotelzimmer buchen', fx: { money: -2000, fitness: 8, moral: 3 }, res: 'Ausgeschlafen und gut gelaunt kommt die Mannschaft an.' },
          { label: 'Früh losfahren und durchziehen', fx: { fitness: -6, moral: -2 }, res: 'Die Fahrt wird zur Härteprobe. Manche schlafen im Bus, andere erzählen die gleiche Geschichte zum fünften Mal.' }] },
    4: { title: 'Flutlicht und Fans', text: 'Die Heimspiele ziehen Zuschauer an. Der Verein will ein Fest veranstalten, um neue Mitglieder zu gewinnen.',
      c: [{ label: 'Mitgliederfest ausrichten', fx: { money: -1800, fans: 10, moral: 3 }, res: 'Bratwurst, Bier und eine Hüpfburg: Die Stimmung am Platz war nie besser.' },
          { label: 'Auf den Sport konzentrieren', fx: { form: 4 }, res: 'Die Mannschaft nutzt die Woche für konzentriertes Training.' }] },
    5: { title: 'Die Scouts kommen', text: 'Auf der Tribüne sitzen Männer mit Notizblöcken. In der Kabine wird getuschelt, wer wohl gemeint ist.',
      c: [{ label: 'Gespräch: Das Team kommt zuerst', fx: { moral: 6 }, res: 'Alle bekennen sich zur Runde. Zumindest am Tisch.' },
          { label: 'Lass sie träumen', fx: { form: 5, moral: -4 }, res: 'Die Spieler laufen wie die Wilden, und bei einigen glänzen die Augen verdächtig.' }] },
    6: { title: 'Heißer Boden im Osten', text: 'Gegen einen Traditionsverein werden Fans erwartet, die weit anreisen. Der Ordnungsdienst fragt, wer die Sicherheit bezahlt.',
      c: [{ label: 'Sicherheitskonzept bezahlen', fx: { money: -2500, conf: 4 }, res: 'Alles läuft ruhig. Der Vorstand ist erleichtert.' },
          { label: 'Das Risiko eingehen', fx: { fans: 5, conf: -4 }, res: 'Die Stimmung ist grandios, die Rechnung für Schäden kommt später.' }] },
    7: { title: 'Profis, plötzlich', text: 'Berater bieten ihre Dienste an, und die Physiotherapie wird zum Thema. In der 3. Liga reicht Freitagsfußball nicht mehr.',
      c: [{ label: 'Medizinische Abteilung ausbauen', fx: { money: -2500, fitness: 10, form: 3 }, res: 'Die Mannschaft ist fitter denn je. Der Physioraum hat sogar Eisbäder.' },
          { label: 'Berater abwimmeln', fx: { moral: 3, conf: -2 }, res: 'Die Runde bleibt unter sich. Ob das reicht, wird die Tabelle zeigen.' }] },
    8: { title: 'Die Kameras kommen', text: 'Ein TV-Team will eine Dokumentation über die Freitagsrunde drehen, die es bis in die 2. Bundesliga geschafft hat.',
      c: [{ label: 'Zusagen', fx: { money: 3000, fans: 8, moral: -3 }, res: 'Die Kameras sind überall, selbst im Kabinengang. Das Interesse am Verein explodiert.' },
          { label: 'Ablehnen', fx: { moral: 4, conf: 2 }, res: 'Die Mannschaft konzentriert sich auf den Sport. Manche bedauern es, andere atmen auf.' }] },
    9: { title: 'Der Anspruch', text: 'Die Presse fragt: Was ist euer Ziel in der Bundesliga? Der Verein erwartet eine klare Aussage.',
      c: [{ label: 'Mutig: Europa ist das Ziel', fx: { fans: 6, conf: 3, moral: -3 }, res: 'Die Schlagzeile steht am nächsten Tag überall. Der Druck steigt.' },
          { label: 'Demut: Erst mal den Klassenerhalt', fx: { moral: 5 }, res: 'Die Mannschaft atmet auf. Wer ruhig bleibt, spielt besser.' }] }
  };

  // ---------- Szenen ----------
  const BEATS = [], BY_ID = {};
  function beat(b) {
    BEATS.push(b); BY_ID[b.id] = b;
    GE.register('story:' + b.id, { story: true, tag: b.tag, title: b.title, make: b.make || (() => ({})), text: b.text, choices: b.choices });
  }
  function chain(S, id) { const b = BY_ID[id]; S.pending = { id: 'story:' + id, ctx: b.make ? b.make(S) : {} }; }

  // Prolog: Auftrag und Kapitän
  const capChoice = i => ({
    label: (S, c) => `${c.cands[i]} zum Kapitän machen`,
    show: (S, c) => !!c.cands[i],
    run: (S, c) => {
      const p = friend(S, c.cands[i]); const s = ensure(S);
      if (p) { s.captainId = p.id; bump(p, 15); }
      const t = `${c.cands[i]} streift die Binde über, grinst und sagt: „Freitag ist ab jetzt Chefsache.“ Die anderen klatschen.`;
      log(S, `${c.cands[i]} wird Kapitän.`); chain(S, 'motto'); return t;
    }
  });
  beat({
    id: 'prologue', key: 'prologue', tag: 'Prolog', title: 'Der letzte Freitag',
    when: (S, t, md) => t === 1 && md === 0 && S.history.length === 0 && !ensure(S).flags.prologue,
    make: S => {
      ensure(S).flags.prologue = true;
      const pref = ['Alex', 'Lorenz', 'Rafael', 'Georg'], all = friendNames(S);
      return { cands: pref.filter(n => all.includes(n)).concat(all.filter(n => !pref.includes(n))).slice(0, 4) };
    },
    text: S => {
      const nm = friendNames(S);
      return para(
        `Es ist ein grauer Freitagabend in Leipzig. Auf dem Bolzplatz hinter der Turnhalle trifft sich wie jede Woche die Runde: ${nm.length ? joinNames(nm) : 'deine Freunde'}.`,
        `Da steht plötzlich ${CHAIR} am Zaun, Vorsitzender des Traditionsvereins ${T(S).name}. „Uns laufen die Spieler weg, nächsten Monat melden wir die Mannschaft ab. Ihr spielt jeden Freitag zusammen. Warum nicht richtig?“`,
        `Alle sehen dich an, ${S.manager}. Du bist der Einzige, der schon mal ein Taktikbuch aufgeschlagen hat. Der Verein steht ganz unten, in der Kreisklasse Leipzig. Eine Saison gibt dir der Vorstand, danach wird entschieden.`,
        'Zuerst braucht die Mannschaft einen Kapitän. Wen fragst du?');
    },
    choices: [capChoice(0), capChoice(1), capChoice(2), capChoice(3),
      { label: () => 'Ohne Kapitän starten', show: (S, c) => !c.cands.length, run: S => { chain(S, 'motto'); return 'Ihr startet ohne Kapitän. Das wird sich zeigen.'; } }]
  });
  beat({
    id: 'motto', key: 'motto', tag: 'Prolog', title: 'Das Vereinsmotto',
    when: () => false,
    text: () => `${GROUNDS}, der Platzwart, steht mit einem Pinsel am Zaun. Für das neue Schild braucht er ein Motto. Was soll dort stehen?`,
    choices: [
      ch('Mit Herz und Leidenschaft', { fans: 8, moral: 4 }, 'Das Schild hängt am Zaun. Die ersten Nachbarn bleiben stehen und schauen beim Training zu.'),
      ch('Mit Köpfchen', { form: 6 }, 'Im Training wird plötzlich geredet statt nur gekickt. Taktiktafel inklusive.'),
      ch('Mit einem Bier nach dem Spiel', { moral: 10, fans: 3, form: -3 }, 'Die Stimmung ist bestens. Die Fitness am Samstagmorgen etwas weniger.')
    ]
  });

  // Neues Kapitel bei jedem Aufstieg
  beat({
    id: 'intro', key: S => 'intro' + tierOf(S), tag: 'Neues Kapitel',
    title: S => CHAPTERS[tierOf(S)].title,
    when: (S, t, md) => t >= 2 && md === 0 && !ensure(S).flags['intro' + t],
    make: S => { ensure(S).flags['intro' + tierOf(S)] = true; return { tier: tierOf(S) }; },
    text: (S, c) => para(...CHAPTERS[c.tier].intro.map(x => fill(S, x))),
    choices: [{ label: () => 'Weiter', run: (S, c) => { log(S, CHAPTERS[c.tier].title + ' beginnt.'); return 'Ein neues Kapitel beginnt.'; } }]
  });

  // Derby gegen den Rivalen
  const derbyNext = S => { const fx = E.nextFixture(S), s = ensure(S); return fx && s.rivalId && fx.opp.id === s.rivalId; };
  beat({
    id: 'derby', key: S => 'derby' + S.matchday, tag: 'Derby', title: 'Derby-Woche',
    when: (S, t, md) => md >= 1 && derbyNext(S),
    text: () => `Am Wochenende geht es gegen ${RIVAL}. In der Zeitung steht ein Interview mit Trainer ${RCOACH}: „Die Freizeitkicker sollen mal lieber beim Freitagskick bleiben.“ In der Kabine kocht es.`,
    choices: [
      ch('Kontern: Wir sehen uns auf dem Platz', { moral: 6, fans: 2 }, 'Die Antwort kommt gut an. Die Kabine brüllt.', S => U.chance(0.3) ? (moralAll(S, -3), 'Ein wenig zu laut vielleicht: Manche spüren den Druck.') : ''),
      ch('Gelassen bleiben', { form: 4, moral: 2 }, 'Keine Antwort ist auch eine. Die Mannschaft konzentriert sich auf den Ball.'),
      ch('Den Artikel in der Kabine aufhängen', { moral: 10, fitness: -3 }, 'Der Zeitungsartikel hängt an der Tür. Die Spieler sind elektrisiert.')
    ]
  });
  beat({
    id: 'derbyAfter', key: S => 'derbyAfter' + S.matchday, tag: 'Derby', title: 'Nach dem Derby',
    when: (S, t, md) => { const r = E.userResults(S, 1)[0]; return md >= 1 && r && r.opp === RIVAL && r.md === md - 1; },
    make: S => { const r = E.userResults(S, 1)[0]; return { res: r.gf > r.ga ? 'W' : r.gf < r.ga ? 'L' : 'D', gf: r.gf, ga: r.ga }; },
    text: (S, c) => c.res === 'W' ? `${c.gf}:${c.ga} im Derby! ${RCOACH} verlässt wortlos das Stadion, und in der Kabine fliegt der Schaum. Der Sieg wird in ganz Leipzig besprochen.`
      : c.res === 'L' ? `${c.gf}:${c.ga} gegen ${RIVAL}. Die Stille in der Kabine ist laut. Draußen jubeln die Gegner.`
      : `${c.gf}:${c.ga} im Derby. Keiner hat gewonnen, aber auch keiner verloren. Beide Seiten reden trotzdem von einem Erfolg.`,
    choices: [{
      label: (S, c) => c.res === 'W' ? 'Feiern gehen' : c.res === 'L' ? 'Abhaken' : 'Weitermachen',
      run: (S, c) => {
        const fx = c.res === 'W' ? { moral: 8, fans: 6, conf: 3 } : c.res === 'L' ? { moral: -6, fans: -2 } : { moral: 1 };
        applyFx(S, fx);
        const t = c.res === 'W' ? 'Ihr feiert bis in die Nacht. Das Derby wird zur Legende.' : c.res === 'L' ? 'Die Mannschaft nimmt es sich zu Herzen, aber ihr schwört Revanche.' : 'Ihr zieht weiter.';
        log(S, `Derby gegen ${RIVAL}: ${c.gf}:${c.ga}. ${t}`); return t;
      }
    }]
  });

  // Eine Szene pro Liga
  beat({
    id: 'tierbeat', key: 'tierbeat', tag: S => CHAPTERS[tierOf(S)].title.split(':')[0],
    title: (S, c) => TB[c.tier].title,
    when: (S, t, md) => md >= 5 && md <= 15,
    make: S => ({ tier: tierOf(S) }),
    text: (S, c) => TB[c.tier].text,
    choices: [0, 1].map(i => ({
      label: (S, c) => TB[c.tier].c[i].label,
      cost: (S, c) => fxCost(S, TB[c.tier].c[i].fx),
      run: (S, c) => { const o = TB[c.tier].c[i]; applyFx(S, o.fx); log(S, `${TB[c.tier].title}: ${o.res}`); return o.res; }
    }))
  });

  // Saisonmitte
  const standing = S => { const lg = E.userLeague(S), tb = E.sortedTable(S, lg); return tb.findIndex(r => r.id === S.userId) + 1; };
  beat({
    id: 'midseason', key: 'midseason', tag: 'Saisonmitte',
    title: (S, c) => c.mode === 'top' ? 'Aufstiegsfieber' : c.mode === 'low' ? 'Die Krise' : 'Zwischenbilanz',
    when: (S, t, md) => md >= 9,
    make: S => { const pos = standing(S); return { pos, mode: pos <= 3 ? 'top' : pos >= 7 ? 'low' : 'mid' }; },
    text: (S, c) => c.mode === 'top' ? `Halbzeit der Saison: Platz ${c.pos}. In der Stadt wird plötzlich über euch gesprochen, und ${CHAIR} schaut zu jedem Heimspiel vorbei.`
      : c.mode === 'low' ? `Platz ${c.pos}. Die Stimmung kippt, auf dem Vereinsgelände wird getuschelt. ${CHAIR} bittet dich zum Gespräch.`
      : `Platz ${c.pos}. Weder Fisch noch Fleisch. In der Kabine gibt es Gesprächsbedarf.`,
    choices: [
      ch('Aufstieg offen ansagen', { fans: 6, conf: 4, moral: -3 }, 'Die Ansage macht die Runde. Der Druck wächst, aber auch der Mut.', null, (S, c) => c.mode === 'top'),
      ch('Bodenständig bleiben', { moral: 4, form: 3 }, 'Nur von Spiel zu Spiel denken. Das hat schon am Bolzplatz funktioniert.', null, (S, c) => c.mode === 'top'),
      ch('Spieler-Aussprache', { moral: 6 }, 'Jeder sagt, was ihn stört. Danach ist die Luft klarer.', null, (S, c) => c.mode === 'mid'),
      ch('Zusatzeinheit ansetzen', { form: 5, fitness: -6 }, 'Mehr Training bringt mehr Konzentration, aber auch müde Beine.', null, (S, c) => c.mode === 'mid'),
      ch('Aussprache bei Bratwurst', { money: -300, moral: 8 }, 'Mit vollem Bauch redet es sich leichter. Die Kabine rückt zusammen.', null, (S, c) => c.mode === 'low'),
      ch('Härter trainieren', { form: 4, fitness: -8, moral: -3 }, 'Der Ton wird rauer, die Einheiten länger. Manche murren.', null, (S, c) => c.mode === 'low'),
      ch('Verantwortung übernehmen', { conf: 5, moral: 3 }, `Du stellst dich vor die Mannschaft und vor ${CHAIR}. Das wird honoriert.`, null, (S, c) => c.mode === 'low')
    ]
  });

  // Abwerbeversuch
  beat({
    id: 'starOffer', key: 'starOffer', tag: 'Abschied?', title: 'Ein Angebot',
    when: (S, t, md) => md >= 13,
    make: S => {
      const fs = T(S).players.filter(p => p.friend && p.goals >= 3 && E.canSell(S, p) === null).sort((a, b) => b.goals - a.goals);
      return fs.length ? { pid: fs[0].id, amt: Math.round(E.playerValue(fs[0]) * 2.2 / 10) * 10 } : null;
    },
    text: (S, c) => { const p = T(S).players.find(x => x.id === c.pid); return `Ein Verein aus der nächsthöheren Liga hat ${p ? p.name : 'deinen Torjäger'} (${p ? p.goals : 0} Tore) beobachtet und bietet ${money(c.amt)}. „Ich bleibe, wenn du mich brauchst“, sagt er leise, „aber ein Traum ist ein Traum.“`; },
    choices: [
      { label: (S, c) => `Verkaufen (${money(c.amt)})`, run: (S, c) => {
        const t = T(S), p = t.players.find(x => x.id === c.pid);
        if (!p || E.canSell(S, p)) return 'Der Wechsel kommt nicht zustande.';
        S.budget += c.amt; S.finance.income += c.amt; t.players = t.players.filter(x => x !== p); E.fixLineup(t); moralAll(S, -4);
        const txt = `${p.name} verlässt den Verein. Zum Abschied gibt es ein Gruppenfoto auf dem Bolzplatz.`;
        E.addNews(S, `${p.name} wechselt für ${money(c.amt)}.`); log(S, txt); return txt;
      } },
      { label: () => 'Er bleibt', run: (S, c) => {
        const p = T(S).players.find(x => x.id === c.pid); bump(p, 15); moralAll(S, 5);
        const txt = `${p ? p.name : 'Er'} bleibt. „Ohne euch macht es keinen Spaß“, sagt er. Die Mannschaft ist gerührt.`; log(S, txt); return txt;
      } }
    ]
  });

  // Letzter Spieltag
  beat({
    id: 'finale', key: 'finale', tag: 'Letzter Spieltag', title: 'Der letzte Spieltag',
    when: (S, t, md) => md >= 17,
    make: S => ({ pos: standing(S) }),
    text: (S, c) => `Letzter Spieltag. Platz ${c.pos}, Saisonziel: ${S.board.objective.label}. In der Kabine ist es still. Alle schauen auf dich.`,
    choices: [
      ch('Rede halten: Jetzt oder nie', { moral: 8 }, 'Deine Worte sitzen. Die Mannschaft läuft hinaus, als ginge es um alles.', S => U.chance(0.25) ? (moralAll(S, -4), 'Ein paar Spieler spüren allerdings das Gewicht.') : ''),
      ch('Ruhig bleiben: Spielt euer Spiel', { form: 5, moral: 2 }, 'Keine großen Worte. Ihr habt das hundertmal gemacht.'),
      ch('An den ersten Freitag erinnern', { moral: 4 }, 'Ihr erinnert euch an den Bolzplatz hinter der Turnhalle, an das erste Spiel, an die ersten Zweifel. Es wird still, dann lachen alle.',
        S => { const fs = T(S).players.filter(p => p.friend); fs.forEach(p => bump(p, 10)); return fs.length ? 'Die Freunde der ersten Stunde sind besonders gerührt.' : ''; },
        S => T(S).players.some(p => p.friend))
    ]
  });

  // ---------- Prüfung nach jedem Spieltag ----------
  function check(S) {
    const s = ensure(S), t = tierOf(S), md = S.matchday;
    if (md === 0 && S.history.length && !s.flags['hist' + S.history.length]) {
      s.flags['hist' + S.history.length] = true;
      const h = S.history[S.history.length - 1];
      log(S, `Saison ${h.season}/${String(h.season + 1).slice(2)}: Platz ${h.pos} in der ${h.leagueName}${h.champion ? ' (Meister)' : ''}${h.promoted ? ', Aufstieg' : h.relegated ? ', Abstieg' : ''}.`);
    }
    for (const b of BEATS) {
      const key = typeof b.key === 'function' ? b.key(S) : b.key;
      const sk = S.season + ':' + key;
      if (s.shown[sk] || !b.when(S, t, md)) continue;
      const ctx = b.make ? b.make(S) : {};
      if (!ctx) continue;
      s.shown[sk] = true; S.pending = { id: 'story:' + b.id, ctx };
      return true;
    }
    return false;
  }

  // ---------- Texte zum Saisonende / zur Entlassung ----------
  function outro(S, s) {
    const out = [];
    const n = S.history.length;
    if (s.champion && s.tier === 9) {
      out.push('Meister der Bundesliga! Auf dem Marktplatz in Leipzig steht halb die Stadt, und irgendwo dahinter, auf dem Bolzplatz hinter der Turnhalle, hängt noch immer das alte Tor.');
      out.push(`${CHAIR} hält die Schale hoch. „Vor ${n} Jahren wollten wir abmelden“, sagt er. „Jetzt hat ein Freitagskick Geschichte geschrieben.“`);
    } else if (s.promoted) {
      out.push(`Aufstieg in die ${G.LEAGUES[s.tier].name}! ${CHAIR} steht mit feuchten Augen in der Kabine. „Das hätte keiner gedacht.“`);
      out.push('Die Mannschaft singt, das Vereinsheim wird zur Bühne. Montag geht es trotzdem wieder aufs Trainingsgelände.');
    } else if (s.relegated) {
      out.push(`Der Abstieg ist besiegelt. ${CHAIR} klopft dir auf die Schulter. „Man fällt hin, man steht auf.“`);
      out.push('Das Vereinsheim bleibt trotzdem voll. Ihr seid immer noch die Runde vom Bolzplatz.');
    } else if (s.objectiveMet) {
      out.push(`Saisonziel erreicht. ${CHAIR} ist zufrieden: „Solide Arbeit.“ Es fehlt zum großen Wurf noch ein Stück.`);
    } else {
      out.push(`Das Saisonziel wurde verfehlt. ${CHAIR} sagt nichts, aber sein Blick sagt genug.`);
    }
    if (s.ownTopScorer) out.push(`Bester Torschütze der Mannschaft: ${s.ownTopScorer.name} mit ${s.ownTopScorer.goals} Toren.`);
    return out;
  }
  function firedText(S) {
    return `Der Vorstand um ${CHAIR} hat getagt: Das Vertrauen ist aufgebraucht. Auf dem Bolzplatz hinter der Turnhalle spielt die Runde am Freitag trotzdem weiter. Vielleicht ist das der Anfang einer neuen Geschichte.`;
  }

  globalThis.Story = { check, ensure, chapter, outro, firedText, log: S => ensure(S).log, CHAPTERS, captainId: S => ensure(S).captainId };
})();
