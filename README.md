# ⚽ Kreisliga-Karriere

Ein storybasierter Karrieremodus im Browser, gebaut mit reinem HTML, CSS und JavaScript (keine Frameworks, kein Build-Schritt).
Ein Traditionsverein steht kurz vor der Auflösung, und deine Freitagsrunde soll ihn retten. Du startest als Trainer in der untersten Leipziger Liga (Kreisklasse) und arbeitest dich Kapitel für Kapitel über 9 Ligastufen bis in die Bundesliga hoch.

## Spielen

Einfach `index.html` im Browser öffnen. Der Spielstand wird automatisch im Browser (localStorage) gespeichert.
Funktioniert auch auf dem Handy.

## Features

- 9 Ligastufen mit je 10 Vereinen, Hin- und Rückrunde (18 Spieltage), Auf- und Abstieg (je 2 Plätze)
- Spieler altern nicht: Entwicklung nur durch Training (bis zum Potenzial) und Transfers
- Story: Prolog mit Kapitänswahl, ein neues Kapitel pro Liga, Derby gegen den Rivalen, Schlüsselszenen (Saisonmitte, Abwerbeangebot, letzter Spieltag) mit Entscheidungen, Tagebuch im Story-Tab
- Die Freitagsrunde als Startkader (mit ★ markiert): 14 Freunde mit Spitzname, Eigenschaft, Kurzbeschreibung und Stärken-Profil, dazu Szenen mit einzelnen Freunden
- Taktikfeld als Aufstellung: Spieler per Antippen tauschen, Fremdpositionen markiert
- Spielwerte: Tempo, Technik, Kondition, Nerven, dazu Form, Fitness und Moral
- Aufstellung, Formationen (4-4-2, 4-3-3, 3-5-2, 5-3-2, 4-5-1) und Taktik
- Live-Match mit Kommentar, Halbzeit-Pause, Taktikwechsel und 3 Wechseln
- Verletzungen, Sperren, Gelbe und Rote Karten
- Transfermarkt, Gehälter, Einnahmen, Sponsoren, Vorstandsvertrauen und Saisonziele (Entlassung möglich)
- Zufallsereignisse zwischen den Spielen (Sponsoren, unzufriedene Spieler, Jugendtalente, Angebote ...)
- Spielstand exportieren und importieren

## Projektstruktur

| Datei | Inhalt |
| --- | --- |
| `index.html` | Einstiegsseite |
| `style.css` | Design (mobil und Desktop) |
| `data.js` | Ligen, Vereinsnamen, Namenslisten (hier kannst du alles anpassen) |
| `engine.js` | Spiellogik: Spieler, Ligen, Matchsimulation, Saisonwechsel, Transfers |
| `events.js` | Zufallsereignisse (auch mit einzelnen Freunden) |
| `story.js` | Kapitel, Schlüsselszenen, Derby, Tagebuch |
| `ui.js` | Oberfläche und Eingaben |

Alle Vereine und Figuren der Handlung sind frei erfunden. In `data.js` kannst du:
- die Freitagsrunde ändern (`FRIENDS`: Name, Position, Spitzname, Eigenschaft, Kurzbeschreibung, Stärken-Profil), die Texte sind Platzhalter
- die Figuren der Handlung ändern (`STORY`: Vorsitzender, Rivale, Rivalen-Trainer, Platzwart, Sponsor)
- echte Vereine eintragen (jede Liga braucht genau 10 Teams)

Beim Start kannst du die Liste der Spieler im Formular ändern (eine Zeile pro Person: `Name, Position`). Namen, die in `FRIENDS` stehen, bekommen ihr Profil automatisch.

## Auf GitHub veröffentlichen

```bash
git init
git add .
git commit -m "Kreisliga-Karriere"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/kreisliga-karriere.git
git push -u origin main
```

Als Webseite (kostenlos): Im Repository unter **Settings → Pages** die Branch `main` und den Ordner `/ (root)` auswählen.
Danach ist das Spiel unter `https://DEIN-NAME.github.io/kreisliga-karriere/` erreichbar, auch auf dem Handy.

## Ideen für später

- Pokalwettbewerb (z. B. Leipziger Kreispokal)
- Mehr Szenen pro Kapitel und Entscheidungen, die spätere Kapitel verändern
- Spielerverträge und Leihen
- Eigene Spielernamen und Spitznamen pro Freund
- Als PWA installierbar machen (Manifest und Service Worker)
