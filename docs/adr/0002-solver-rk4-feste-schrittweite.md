# ADR-0002: RK4 mit fester Schrittweite, Euler als Rückfallebene

- Status: angenommen
- Datum: 2026-07-28

## Kontext

Das kardiorenale Modell umfasst Zeitkonstanten von Sekunden (Barorezeptorreflex) bis Tagen
(Natrium- und Volumenbilanz, Druck-Natriurese) — ein Verhältnis von über 10⁵. Gefordert
sind gleichzeitig Determinismus, numerische Stabilität über 30 simulierte Tage und
60 fps in der Darstellung.

## Entscheidung

Runge-Kutta 4. Ordnung mit **fester** Schrittweite `dt = 0,05 s` Modellzeit. Kein adaptiver
Schrittweitenregler. Euler bleibt als umschaltbare Rückfallebene für Diagnosezwecke.
Der Zeitraffer skaliert nicht `dt`, sondern die Anzahl der Schritte pro Bildwiederholung;
langsame Zustandsgrößen (Aldosteron, Bilanzen) werden dabei nicht anders gerechnet,
sondern nur häufiger.

## Begründung

Adaptive Verfahren machen das Ergebnis von der Rechenlast abhängig — dieselbe Eingabe
könnte auf einem langsamen Gerät ein anderes Ergebnis liefern. Das verletzt die
Determinismus-Anforderung und macht Szenariotests wackelig. Eine feste Schrittweite ist
reproduzierbar, testbar und erlaubt exakte Snapshots für den Vorher/Nachher-Vergleich.

## Konsequenzen

- Ein simulierter Tag entspricht 1 728 000 Schritten. Der Zeitraffer „1 Tag/s" braucht
  deshalb einen Web Worker und eine Begrenzung der Schritte pro Frame; die Simulation läuft
  in Modellzeit weiter, auch wenn die Darstellung Frames überspringt.
- Steifigkeit wird durch die Formulierung der langsamen Kompartimente vermieden (Bilanzen
  als Integratoren mit Zeitkonstanten ≥ 1 min), nicht durch den Solver.
- Der Invariantentest „30 simulierte Tage" ist der Wächter über diese Entscheidung.
