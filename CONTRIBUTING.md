# Mitarbeit

## Grundregeln

1. **Keine Zahl ohne Herkunft.** Jede Konstante im Modell trägt entweder einen
   Quellenkommentar (Lehrbuch, Kapitel, Normwertbereich) oder ist ausdrücklich als
   Kalibrierungsgröße gekennzeichnet — also als Wert, der so eingestellt wurde, dass sich
   die belegten Normwerte einstellen. Eine erfundene Zahl mit erfundener Quelle ist der
   schlimmste Fehler, den dieses Projekt machen kann.
2. **Die Grafik lügt nie.** Jede Animationseigenschaft wird aus einer Modellgröße
   berechnet. Keine dekorative Bewegung, die nichts bedeutet.
3. **Der Kern bleibt rein.** `packages/engine` hat keine React-, DOM- oder
   Browser-Abhängigkeit, kein `any`, kein `Math.random()`.

## Ablauf

- Branch von `main`: `feat/…`, `fix/…`, `docs/…`
- Commits im Conventional-Commits-Stil: `feat: …`, `fix: …`, `docs: …`, `test: …`, `chore: …`
- PR gegen `main`, CI muss grün sein (Format, Lint, Typecheck, Test, Build)
- `main` ist immer deploybar

## Modelländerungen

Wer eine Gleichung oder eine Konstante ändert, ändert jede Zahl in der App. Deshalb:

- Erst `docs/model/validation.md` lesen — was soll das Szenario zeigen?
- Änderung vornehmen, `npm test` laufen lassen. Rote Szenariotests sind eine Aussage über
  Physiologie, nicht über Code.
- `docs/model/raas.md` und `docs/model/constants.md` mitziehen.
- Bei mehrdeutigen Modellentscheidungen ein ADR unter `docs/adr/` anlegen (fortlaufende
  Nummer, Format: Kontext — Entscheidung — Konsequenzen).

## Lerninhalte

Siehe `docs/contributing-content.md`. Kurz: MDX mit typisierter Frontmatter, drei Blöcke
(Basis / Klinik / Prüfung), Quellenangabe ist Pflicht — die CI bricht sonst ab.

## Deployment

`git push` erfolgt ausschließlich auf ausdrückliche Freigabe des Projektinhabers. Netlify
baut `main` automatisch.
