# ADR-0003: Der OrganismBus liefert die Signale des vorherigen Schritts

- Status: angenommen
- Datum: 2026-07-28

## Kontext

Systemmodule lesen Größen anderer Module: die Niere braucht den arteriellen Mitteldruck,
das Herz-Kreislauf-Modul braucht das Blutvolumen aus der Bilanz, ein späteres Lungenmodul
schreibt den arteriellen pH, auf den die Niere reagiert. Würde jedes Modul die _aktuellen_
Werte der anderen lesen, hinge das Ergebnis von der Reihenfolge der Modulaufrufe ab.

## Entscheidung

Alle Module lesen über `OrganismBus.signals` ausschließlich den Signalstand des
**vorangegangenen** Integrationsschritts. Erst wenn alle Module gerechnet haben, werden
ihre `publish()`-Ergebnisse zu einem neuen Signalstand zusammengeführt.

## Begründung

Reihenfolgeunabhängigkeit ist die Voraussetzung dafür, dass ein neues System hinzugefügt
werden kann, ohne bestehende Ergebnisse zu verändern (Definition of Done Nr. 6). Der Preis
ist eine Verzögerung von einem `dt`, also 50 ms Modellzeit — das ist eine Größenordnung
unter der schnellsten physiologischen Zeitkonstante (Barorezeptorreflex, 5–15 s) und damit
didaktisch unsichtbar.

## Konsequenzen

- Rückkopplungsschleifen über Modulgrenzen hinweg sind um ein `dt` verzögert. Bei
  `dt = 0,05 s` unkritisch; bei einer späteren Vergrößerung von `dt` neu zu bewerten.
- Der Signalstand ist ein einziges unveränderliches Objekt pro Schritt — gut für Snapshots
  und für den Vorher/Nachher-Vergleich.
- Innerhalb eines Moduls gilt die Verzögerung nicht; dort wird direkt gerechnet.
