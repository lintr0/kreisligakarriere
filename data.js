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
