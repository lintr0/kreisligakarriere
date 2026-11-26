// Spieldaten: Ligapyramide und Namen.
// Alle Vereine und Namen sind frei erfunden. Du kannst sie hier beliebig ändern.
// Wichtig: Jede Liga braucht genau 10 Vereine (Stufe 1 darf 10 haben, ein Platz wird für deinen Verein genutzt).

globalThis.GameData = {
  // Grundstärke der Spieler pro Liga-Stufe (1 = unterste Liga, 9 = Bundesliga)
  TIER_BASE: [38, 44, 50, 56, 62, 68, 74, 80, 86],

  LEAGUES: [
    {
      name: 'Kreisklasse Leipzig',
      teams: ['SV Stötteritz', 'BSC Mockau', 'FC Probstheida', 'SG Wahren', 'TuS Thekla',
        'SV Plagwitz', 'SG Paunsdorf', 'TSV Schönefeld', 'Blau-Weiß Gohlis', 'FC Grünau']
    },
    {
      name: 'Stadtliga Leipzig',
      teams: ['FSV Markkleeberg', 'SC Taucha', 'SV Borsdorf', 'TSV Zwenkau', 'FC Böhlen',
        'SG Markranstädt', 'SV Schkeuditz', 'VfB Engelsdorf', 'SV Holzhausen', 'FC Rötha']
    },
    {
      name: 'Landesklasse Sachsen',
      teams: ['Muldental Grimma', 'FSV Wurzen', 'SG Eilenburg', 'VfL Oschatz', 'TSV Torgau',
        'SC Delitzsch', 'FC Borna', 'SV Geithain', 'FSV Brandis', 'SG Colditz']
    },
    {
      name: 'Sachsenliga',
      teams: ['BSG Freiberg', 'FSV Meißen', 'SC Pirna', 'TSV Radebeul', 'FC Bautzen',
        'SV Görlitz', 'VfL Hoyerswerda', 'SG Riesa', 'VfB Plauen', 'FC Zwickau-West']
    },
    {
      name: 'Oberliga Nordost-Süd',
      teams: ['Erfurter FV', 'FC Jena-Nord', 'SV Gera', 'FSV Altenburg', 'VfB Weimar',
        'SC Suhl', 'TSV Halle-Ost', 'SG Dessau', 'FC Zeitz', 'SV Naumburg']
    },
    {
      name: 'Regionalliga Nordost',
      teams: ['Berliner SC Mitte', 'FC Brandenburg', 'SV Cottbus-Süd', 'Rostocker FV', 'Magdeburger SC',
        'FSV Stralsund', 'VfB Potsdam', 'Schweriner FC', 'SG Frankfurt/Oder', 'Neubrandenburg 04']
    },
    {
      name: '3. Liga',
      teams: ['FC Lübeck 1901', 'Kieler SV', 'SC Paderborn-West', 'VfR Aalen-Süd', 'SV Mainz-Süd',
        'TSV Ulm 46', 'FC Saarbrücken-Ost', 'Wuppertaler SC', 'SG Duisburg', 'FSV Offenbach']
    },
    {
      name: '2. Bundesliga',
      teams: ['Eintracht Kassel', 'Union Wuppertal', 'SV Karlsruhe 1894', 'FC Nürnberg-Süd', 'Rot-Weiss Hamm',
        'SC Fürth 03', 'VfL Bielefeld-Nord', 'FC Heidenheim 46', 'SV Regensburg', 'TuS Kaiserslautern']
    },
    {
      name: 'Bundesliga',
      teams: ['Hanseatic SV', 'FC Isar München', 'Borussia Ruhr', 'Bayer Rheinland', 'SC Breisgau',
        'VfB Neckar', 'Rot-Weiß Frankfurt', 'Werder Küste', 'Union Spree Berlin', 'TSG Kraichgau']
    }
  ],

  // Figuren der Rahmenhandlung (alle frei erfunden)
  STORY: { chairman: 'Herr Kowalczyk', rival: 'SV Stötteritz', rivalCoach: 'Dieter Raschke', groundsman: 'Uwe', sponsor: 'Autohaus Brandt' },

  // Die Freitagsrunde: Startkader. Spitzname, Eigenschaft, Kurzbeschreibung und Stärken-Profil sind
  // Platzhalter und können hier beliebig angepasst werden (bias: Zu-/Abschläge auf Tempo, Technik, Kondition, Nerven).
  // Erlaubte Eigenschaften: Kämpfer, Techniker, Sprinter, Nervenstark, Teamplayer, Heißsporn, Allrounder
  FRIENDS: [
    { name: 'Hugo', pos: 'TW', nick: 'Die Wand', trait: 'Nervenstark', bias: { nerven: 8, tempo: -3 }, bio: 'Steht im Tor, als wäre er dort angewachsen. Gibt nie zu, dass ein Ball haltbar war.' },
    { name: 'Hannes', pos: 'TW', nick: 'Der mitspielende Keeper', trait: 'Techniker', bias: { technik: 7, nerven: 2 }, bio: 'Spielt lieber mit dem Ball am Fuß als in der Luft. Mut zur Lücke ist sein Motto.' },
    { name: 'Alex', pos: 'AB', nick: 'Der Fels', trait: 'Kämpfer', bias: { kondition: 6, technik: -2 }, bio: 'Läuft jeden Zweikampf, als ginge es um die Meisterschaft. Auch beim Aufwärmen.' },
    { name: 'Lorenz', pos: 'AB', nick: 'Der Zweite-Minute-Mann', trait: 'Allrounder', bias: { tempo: 3, nerven: 1 }, bio: 'Kommt gern ein bisschen später, ist dafür sofort voll da.' },
    { name: 'Benedikt', pos: 'AB', nick: 'Benny Beton', trait: 'Kämpfer', bias: { nerven: 5, technik: -3 }, bio: 'Spielt ohne Schnörkel. Was nicht Ball ist, wird weggeräumt.' },
    { name: 'Albert', pos: 'AB', nick: 'Der Professor', trait: 'Teamplayer', bias: { technik: 4, tempo: -3 }, bio: 'Denkt manchmal eine Sekunde zu lange nach, dafür steht er immer richtig.' },
    { name: 'Jonathan', pos: 'AB', nick: 'Jonny Turbo', trait: 'Sprinter', bias: { tempo: 8, nerven: -2 }, bio: 'Läuft jedem davon, nur nicht immer in die richtige Richtung.' },
    { name: 'Rafael', pos: 'MF', nick: 'Der Regisseur', trait: 'Techniker', bias: { technik: 8, kondition: -2 }, bio: 'Sieht Pässe, die sonst keiner sieht, und erklärt sie danach ausführlich.' },
    { name: 'Lino', pos: 'MF', nick: 'Der Wirbelwind', trait: 'Sprinter', bias: { tempo: 6, kondition: 3 }, bio: 'Kennt kein Ausruhen, weder auf dem Platz noch in der Pause.' },
    { name: 'Arne', pos: 'MF', nick: 'Der Taktikfuchs', trait: 'Teamplayer', bias: { technik: 4, nerven: 3 }, bio: 'Hat zu jeder Situation eine Idee. Etwa jede dritte funktioniert.' },
    { name: 'Houman', pos: 'MF', nick: 'Der Motor', trait: 'Kämpfer', bias: { kondition: 8, technik: -1 }, bio: 'Läuft für zwei und organisiert nach dem Spiel meistens noch das Essen.' },
    { name: 'Georg', pos: 'ST', nick: 'Der Knipser', trait: 'Nervenstark', bias: { nerven: 7, technik: 2 }, bio: 'Vor dem Tor so ruhig, dass es fast verdächtig wirkt.' },
    { name: 'Johann', pos: 'ST', nick: 'Der Zauberer', trait: 'Techniker', bias: { technik: 8, kondition: -3 }, bio: 'Macht Dinge mit dem Ball, die selbst er nicht immer erklären kann.' },
    { name: 'Frederik', pos: 'ST', nick: 'Freddy Blitz', trait: 'Sprinter', bias: { tempo: 9, nerven: -2 }, bio: 'Schnell wie der Blitz, im Abschluss manchmal genauso zufällig.' }
  ],

  FIRST: ['Max', 'Lukas', 'Jonas', 'Tim', 'Felix', 'Paul', 'Leon', 'Ben', 'Finn', 'Noah', 'Elias', 'Luca',
    'Jan', 'Niklas', 'Tom', 'Moritz', 'Erik', 'Philipp', 'David', 'Simon', 'Fabian', 'Marvin', 'Kevin',
    'Dennis', 'Sven', 'Tobias', 'Stefan', 'Marcel', 'Robin', 'Julian', 'Oliver', 'Chris', 'Daniel',
    'Patrick', 'Sebastian', 'Kai', 'Nico', 'Hannes', 'Toni', 'Ole', 'Matthias', 'Jens', 'Andre',
    'Ramon', 'Emre', 'Yusuf', 'Milan', 'Darius', 'Ivan', 'Luka', 'Piotr', 'Tomasz', 'Jakub', 'Bastian',
    'Lennart', 'Henrik', 'Torben', 'Falk', 'Rico', 'Enrico'],

  LAST: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz',
    'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
    'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Krause', 'Meier',
    'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter', 'Mayer',
    'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn',
    'Vogel', 'Friedrich', 'Keller', 'Günther', 'Frank', 'Berger', 'Winkler', 'Roth', 'Beck',
    'Lorenz', 'Baumann', 'Franke', 'Albrecht', 'Schuster', 'Simon', 'Ludwig', 'Böhm', 'Winter',
    'Kraus', 'Martin', 'Schumacher', 'Krämer', 'Vogt', 'Stein', 'Jäger', 'Otto', 'Sommer', 'Groß',
    'Seidel', 'Heinrich', 'Brandt', 'Haas', 'Schreiber', 'Graf', 'Dietrich', 'Ziegler', 'Kuhn',
    'Kühn', 'Pohl', 'Engel', 'Horn', 'Busch', 'Bergmann', 'Thomas', 'Voigt', 'Sauer', 'Arnold',
    'Wolff', 'Pfeiffer', 'Kowalski', 'Nowak', 'Yilmaz', 'Petrov', 'Horvat']
};
