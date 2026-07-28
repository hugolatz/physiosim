# Arbeitsregeln für PhysioSim

## Deployment-Regel (wichtig!)

**Niemals `git push` ohne explizite Freigabe durch den User.**

- Code-Änderungen → nur lokal committen (`git commit`)
- `git push` **ausschließlich** wenn der User es ausdrücklich sagt (z. B. „push", „pushen", „deploy")
- Kein eigenständiges Entscheiden eines Push-Zeitpunkts
- Kein vorauseilendes Ankündigen und Pushen — immer warten
- Gleiches gilt für das Anlegen des GitHub-Remotes und für Netlify-Deploys

## Modellregel (wichtig!)

**Keine Zahl ohne Herkunft.**

- Jede physiologische Konstante bekommt einen Kommentar mit Quelle (Werk, Kapitel,
  Normwertbereich).
- Werte, die nicht belegbar sind, sondern eingestellt wurden, damit sich die belegten
  Normwerte ergeben, werden ausdrücklich als **Kalibrierungsgröße** gekennzeichnet — mit
  der Angabe, wogegen kalibriert wurde. Sie bekommen _keine_ Lehrbuchquelle angehängt.
- Seitengenaue Zitate nur, wenn die Auflage bekannt ist. Sonst Kapitel-/Werksebene.

## Sprachregel

- Oberfläche und Dokumentation: Deutsch
- Code, Bezeichner und Kommentare: Englisch
- Lerninhalte (MDX): Deutsch

## Kernregel

`packages/engine` bleibt frei von React, DOM, Browser-APIs, `any` und `Math.random()`.
Gleiche Parameter müssen immer dasselbe Ergebnis liefern.

## Verifikationsregel

Nicht bei „kompiliert" aufhören. Bei Änderungen am Modell laufen die Validierungsszenarien
(`npm test`); bei Änderungen an der Oberfläche wird die Seite tatsächlich im Browser
angesehen, nicht nur gebaut.
