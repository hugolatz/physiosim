# ADR-0004: Das renale Modul rechnet zwei Nieren getrennt

- Status: angenommen
- Datum: 2026-07-28

## Kontext

Das Validierungsszenario „einseitige Nierenarterienstenose" verlangt, dass die stenosierte
Niere massiv Renin ausschüttet, während die kontralaterale Niere unter dem erhöhten
systemischen Druck natriuretisch antwortet. Mit einer einzigen gemittelten Niere ist dieser
Gegensatz prinzipiell nicht darstellbar — und er ist der ganze Lerninhalt des Szenarios.
Hinzu kommt das Produktziel: ein Ganzkörpermodell, in das man hineinzoomt, und ein echter
Körper hat zwei Nieren.

## Entscheidung

Das renale Modul rechnet zwei unabhängige Niereninstanzen (`left`, `right`) mit je eigenem
Perfusionsdruck, eigenem afferenten und efferenten Widerstand, eigener Autoregulation,
eigenem Tubulusdurchsatz und eigener Reninsekretion. Systemische Größen entstehen durch
Summation (GFR, Urinvolumen, Na⁺-Ausscheidung) bzw. Mittelung über den venösen Abfluss
(Reninkonzentration im Plasma).

## Begründung

Der Zusatzaufwand ist gering, weil die Nierenmechanik ohnehin als reine Funktion
`(Perfusionsdruck, Hormonlage, Medikamente) → (GFR, Ausscheidung, Renin)` formuliert ist:
sie wird zweimal aufgerufen statt einmal. Der didaktische Gewinn ist groß — einseitige
Stenose, einseitige Nephrektomie und asymmetrische Nierenschädigung werden darstellbar.

## Konsequenzen

- Pathologien bekommen eine Seitenangabe (`links`, `rechts`, `beidseits`).
- Die Anzeige muss seitengetrennte Werte zeigen können; die Ganzkörperansicht zeigt beide
  Nieren mit je eigener Färbung.
- Renin wird als Sekretionsrate je Niere gerechnet und im Plasmapool zusammengeführt —
  nur so ergibt „Renin ↑↑ aus der stenosierten Niere" überhaupt einen Sinn.
