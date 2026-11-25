# ⚽ Kreisliga-Karriere

Ein Karrieremodus im Browser, gebaut mit reinem HTML, CSS und JavaScript (keine Frameworks, kein Build-Schritt).
Du startest als Trainer in der untersten Leipziger Liga (Kreisklasse) und arbeitest dich über 9 Ligastufen bis in die Bundesliga hoch.

## Spielen

Einfach `index.html` im Browser öffnen. Der Spielstand wird automatisch im Browser (localStorage) gespeichert.
Funktioniert auch auf dem Handy.

## Features

- 9 Ligastufen mit je 10 Vereinen, Hin- und Rückrunde (18 Spieltage), Auf- und Abstieg (je 2 Plätze)
- Spieler altern nicht: Entwicklung nur durch Training (bis zum Potenzial) und Transfers
- Eigene Freunde als Spieler im Startkader (mit ★ markiert)
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
| `events.js` | Zufallsereignisse |
| `ui.js` | Oberfläche und Eingaben |

Alle Vereine und Namen sind frei erfunden. In `data.js` kannst du echte Vereine eintragen (jede Liga braucht 10 Teams).

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
- Mehr Story-Ereignisse und Rivalitäten
- Spielerverträge und Leihen
- Eigene Spielernamen und Spitznamen pro Freund
- Als PWA installierbar machen (Manifest und Service Worker)
