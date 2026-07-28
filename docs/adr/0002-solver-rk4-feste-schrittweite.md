# ADR-0002: Exponentielle Integration mit fester Schrittweite

- Status: angenommen (ersetzt den ursprünglichen Vorschlag „RK4")
- Datum: 2026-07-28

## Kontext

Das kardiorenale Modell umfasst Zeitkonstanten von Sekunden (Windkessel ≈ 2 s,
Barorezeptorreflex ≈ 10 s) bis Tagen (Natrium- und Volumenbilanz, Druck-Natriurese,
Barorezeptor-Resetting ≈ 36 h) — ein Verhältnis von über 10⁴. Gefordert sind gleichzeitig
Determinismus, numerische Stabilität über 30 simulierte Tage und ein Zeitraffer bis
1 Tag pro Sekunde.

Der ursprüngliche Plan sah Runge-Kutta 4. Ordnung mit `dt = 0,05 s` vor. Nachgerechnet
heißt das für 30 simulierte Tage 51,8 Millionen Schritte mal vier Auswertungen pro Schritt
— das ist weder in der Testsuite noch im Zeitraffer vertretbar. Eine größere Schrittweite
wiederum macht RK4 auf den schnellen Gleichungen instabil (Stabilitätsgrenze bei
`dt ≈ 2,8 τ`, also rund 5 s).

## Entscheidung

Feste Schrittweite **`dt = 2 s` Modellzeit**, unabhängig von der Zeitrafferstufe. Der
Zeitraffer verändert ausschließlich die Anzahl der Schritte pro Bildwiederholung, nie die
Schrittweite.

Integrationsverfahren nach Art der Gleichung:

1. **Relaxationen erster Ordnung** (jeder Reflex, jeder Hormonpool, der arterielle
   Windkessel, die tubuloglomeruläre Rückkopplung) werden mit der exakten Lösung
   `x(t+dt) = target + (x(t) − target)·e^(−dt/τ)` fortgeschrieben. Das ist für konstantes
   Ziel innerhalb des Schritts exakt und für jedes `dt` stabil.
2. **Bilanzen** (Gesamtkörperwasser, Natrium, Kalium, Erythrozytenvolumen) sind reine
   Integratoren `dV/dt = Zufuhr − Ausscheidung` und werden explizit fortgeschrieben. Ihre
   Zeitkonstanten liegen bei Stunden bis Tagen, `dt = 2 s` ist dafür weit im sicheren
   Bereich.

## Begründung

- Ein einziges `dt` für alle Zeitrafferstufen erhält den Determinismus: dasselbe Szenario
  liefert bei 1× Echtzeit und bei 1 Tag/s exakt dieselbe Kurve. Ein adaptives Verfahren
  würde das Ergebnis von der Rechenleistung des Geräts abhängig machen.
- Bei `dt = 2 s` bleiben 30 simulierte Tage bei 1,3 Millionen Schritten — in der Testsuite
  in wenigen Sekunden zu rechnen.
- Die schnellste Zeitkonstante (Windkessel, ≈ 2 s) wird mit der exakten Lösung getroffen;
  der Barorezeptorreflex hat fünf Stützstellen pro Zeitkonstante.
- Die Herzfrequenz geht als Mittelwert in das Herzzeitvolumen ein. Der einzelne Herzschlag
  ist eine Darstellungsgröße, keine Zustandsgröße — die Animation pulsiert mit der
  berechneten Frequenz, ohne dass der Solver Schlag für Schlag rechnen müsste.

## Konsequenzen

- Vorgänge unterhalb weniger Sekunden (Einzelschlag-Druckkurve, Pulswellen) sind nicht
  Gegenstand des Modells. Die Druck-Volumen-Schleife des Herzens (M2) wird aus den
  aktuellen Mittelwerten konstruiert, nicht integriert.
- Wer eine Zeitkonstante unter 2 s einführt, muss diese Entscheidung neu bewerten.
- Der Invariantentest „30 simulierte Tage numerisch stabil" ist der Wächter darüber.
