# ADR-0006: Umfang des Kaliummodells

- Status: angenommen
- Datum: 2026-07-28

## Kontext

Zwei Validierungsszenarien verlangen eine Aussage über Kalium: Conn-Syndrom (Hypokaliämie)
und Schleifendiuretikum (K⁺ ↓). Kalium stand nicht in der ursprünglichen Parameterliste.
Ein vollständiges Kaliummodell wäre aufwendig: transzelluläre Verschiebung durch Insulin,
Katecholamine und pH, zelluläre Puffer, Aldosteron-unabhängige Sekretionswege.

## Entscheidung

Ein bewusst schlankes Kaliummodell:

- Ein extrazellulärer K⁺-Pool; der intrazelluläre Raum wird als sehr großer, träger Puffer
  behandelt, nicht einzeln bilanziert.
- Zufuhr fest bei 70 mmol/d (verstellbar, aber nicht Teil der Kernbedienung).
- Ausscheidung im Sammelrohr abhängig von Aldosteronwirkung, distalem Tubulusfluss und
  distalem Na⁺-Angebot — das sind genau die drei Größen, die die beiden Szenarien erklären.
- Keine Modellierung von pH-abhängiger Verschiebung, Insulin oder β2-Wirkung im MVP.

## Begründung

Das Modell soll die Frage „warum wird der Patient unter Spironolacton hyperkaliäm und
unter Furosemid hypokaliäm?" beantworten können. Dafür genügen Aldosteron, distaler Flow
und distales Na⁺-Angebot. Alles Weitere gehört in ein späteres Säure-Basen-Modul, das über
den `OrganismBus` andocken kann.

## Konsequenzen

- Kalium wird als Messwert mit Normbereich angezeigt, aber im MVP mit dem Hinweis
  versehen, dass die transzelluläre Verteilung nicht modelliert ist.
- Szenarien mit rascher K⁺-Verschiebung (diabetische Ketoazidose, Azidose) sind
  ausdrücklich nicht abbildbar und werden auch nicht angeboten.
