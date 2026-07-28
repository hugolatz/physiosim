# Validierung: Soll-Verhalten je Szenario

Jede Zeile hier entspricht einem ausführbaren Test in
`packages/engine/tests/scenarios/validation.test.ts`. Geprüft wird **Richtung und
Größenordnung**, nie ein exakter Wert — das Modell ist eine didaktische Vereinfachung, und
eine Prüfung auf drei Nachkommastellen würde nur die Testsuite brüchig machen.

Ein roter Test hier ist eine Aussage über Physiologie, nicht über Code.

Stand: 71 Tests, alle grün (33 Szenariotests, 26 Invarianten, 12 Einheitentests).

---

## 1 — Akuter Blutverlust 1000 mL

_100 mL/min über 10 Minuten, danach 20 Minuten beobachtet._

| Erwartung              | geprüft als                               |
| ---------------------- | ----------------------------------------- |
| MAP ↓, aber abgefedert | fällt, aber um weniger als 25 %           |
| HF ↑, TPR ↑            | > +5 % bzw. > +10 %                       |
| Renin ↑↑, Aldosteron ↑ | > +50 % bzw. > +10 %                      |
| Urin ↓↓, Urin-Na⁺ ↓↓   | Urin fällt, Urin-Na⁺ auf unter die Hälfte |
| Filtrationsfraktion ↑  | steigt                                    |

Typischer Modellverlauf: MAP 93 → 90, HF 70 → 76, TPR +28 %, PRA 1,0 → 1,9,
Urin-Na⁺ 94 → 30 mmol/L, FF 19,8 → 20,1 %. Die GFR fällt um etwa ein Fünftel.

## 2 — Chronisch hohe Kochsalzzufuhr

_400 statt 150 mmol/d, 14 Tage._

| Erwartung                     | geprüft als                  |
| ----------------------------- | ---------------------------- |
| Ausscheidung folgt der Zufuhr | 370–430 mmol/d               |
| Volumen ↑                     | EZV steigt                   |
| Renin ↓, Aldosteron ↓         | beide fallen                 |
| MAP kaum verändert            | Betrag der Änderung < 5 mmHg |

**Einschränkung, ehrlich benannt.** Die Vorgabe erwartet „MAP mäßig ↑". Das Modell zeigt
statt dessen einen praktisch unveränderten Druck (< 1 mmHg): es bildet einen
_salzresistenten_ Menschen ab. Der Grund ist, dass die hormonelle Gegenregulation
(Suppression von Angiotensin II und Aldosteron) die Mehrausscheidung fast vollständig
trägt, bevor der Druck nennenswert steigen muss. Wer eine salzsensitive Variante
darstellen will, muss die renale Funktionskurve verschieben — dafür ist der Schalter
„Druck-Natriurese" und, in M2, der Guyton-Graph gedacht.

## 3 — Einseitige Nierenarterienstenose

_Druckabfall 30 % links, 7 Tage._

| Erwartung                           | geprüft als                                              |
| ----------------------------------- | -------------------------------------------------------- |
| Renin ↑↑ aus der stenosierten Niere | links > +80 %, und > 3× rechts                           |
| systemischer MAP ↑                  | > +3 mmHg                                                |
| Gegenniere natriuretisch            | Na-Ausscheidung rechts > 1,5× links und höher als vorher |
| GFR nur links deutlich ↓            | links < 70 % des Ausgangswerts, rechts > 90 %            |

Das ist das Szenario, für das die zwei getrennt gerechneten Nieren gebaut wurden.

## 4 — ACE-Hemmer bei beidseitiger Stenose (Kernlernmoment)

_Druckabfall 40 % beidseits, drei Tage stabil, dann ACE-Hemmer 100 %, zwei Stunden._

| Erwartung                            | geprüft als                   |
| ------------------------------------ | ----------------------------- |
| GFR bricht ein                       | fällt um mehr als 15 %        |
| P_GC ↓                               | fällt                         |
| Filtrationsfraktion ↓                | unter 80 % des Ausgangswerts  |
| AT1-Signal ↓, Renin reaktiv ↑        | Signal unter 60 %, PRA steigt |
| gesunde Niere weit weniger betroffen | GFR-Abfall dort kleiner       |

Der letzte Punkt ist der eigentliche Lernwert: derselbe Wirkstoff, zwei völlig
verschiedene Folgen — abhängig davon, ob der Glomerulus auf die efferente Konstriktion
angewiesen ist.

## 5 — Conn-Syndrom

_Autonome Aldosteronsekretion, 14 Tage._

| Erwartung     | geprüft als              |
| ------------- | ------------------------ |
| Aldosteron ↑↑ | > 3×                     |
| Renin ↓↓      | < 50 % des Ausgangswerts |
| Hypokaliämie  | K⁺ < 3,5 mmol/L          |
| MAP ↑         | > +3 mmHg                |

Modellverlauf: Aldosteron 80 → 504 ng/L, PRA 0,98 → 0,34 ng/mL/h, K⁺ 4,2 → 3,2 mmol/L,
MAP 92 → 98 mmHg, EZV 14,5 → 18,6 L.

**Einschränkung:** Der Druckanstieg fällt mit rund 5 mmHg schwächer aus als beim
Patienten. Das Modell kennt keine Gefäßumbauvorgänge und keine direkte vaskuläre
Aldosteronwirkung.

## 6 — Schleifendiuretikum

| Erwartung                           | geprüft als            |
| ----------------------------------- | ---------------------- |
| Urin ↑↑                             | akut > 2×              |
| Volumen ↓                           | EZV fällt              |
| Renin ↑ reaktiv, Aldosteron ↑       | PRA > +30 %            |
| K⁺ ↓                                | mindestens −0,2 mmol/L |
| Urin kann nicht konzentriert werden | Urinosmolalität fällt  |

Der letzte Punkt kommt daher, dass NKCC2 nicht nur Natrium resorbiert, sondern auch den
Markgradienten aufbaut. Beides fällt gemeinsam weg.

## 7 — NSAR + ACE-Hemmer + Diuretikum („triple whammy")

| Erwartung                         | geprüft als                          |
| --------------------------------- | ------------------------------------ |
| NSAR allein: GFR kaum verändert   | Betrag der Änderung < 20 %           |
| Kombination: GFR bricht ein       | < −30 %                              |
| schlimmer als jede Einzelsubstanz | GFR unter 75 % des NSAR-allein-Werts |

Nirgends programmiert: das Ergebnis fällt aus drei getrennten Angriffspunkten heraus —
Vas afferens kann nicht mehr dilatieren, Vas efferens nicht mehr konstringieren, und das
Volumen fehlt.

## 8 — Autoregulation abgeschaltet

_GFR bei niedrigem und hohem Druck, jeweils mit und ohne Bayliss + TGF._

| Erwartung                                            | geprüft als                                |
| ---------------------------------------------------- | ------------------------------------------ |
| GFR folgt ohne Autoregulation dem Druck viel stärker | Steigung dGFR/dMAP mindestens 1,5× steiler |

## 9 — Drucksprung: Sekunden gegen Tage

Dasselbe Prinzip auf drei Zeitskalen:

| Erwartung                            | geprüft als                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Sekunden: der Reflex fängt ab        | Sympathikotonus unter 0,95 innerhalb von 30 s; MAP niedriger als bei abgeschaltetem Reflex                   |
| Tage: die Druck-Natriurese begrenzt  | mit Druck-Natriurese steigt der Druck deutlich weniger als ohne, und das EZV bleibt mindestens 2 L niedriger |
| Tage: der Reflex-Sollwert zieht nach | Sollwert steigt um mehr als 2 mmHg, Sympathikotonus wieder nahe 1 trotz erhöhtem Druck                       |

**Warum wird der zweite Punkt an einer Mineralokortikoidlast gezeigt und nicht an einer
Salzlast?** Weil die hormonellen Schleifen eine reine Salzlast fast vollständig abfangen
(siehe Szenario 2). Erst wenn sie das nicht mehr können — bei autonomer
Aldosteronsekretion —, wird sichtbar, was die Druck-Natriurese leistet: mit ihr steigt das
Extrazellulärvolumen auf 18,6 L, ohne sie auf 24,1 L und der Druck entsprechend höher.

---

## Invarianten

| Prüfung                       | Inhalt                                                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Determinismus                 | gleiche Parameter → identische Werte; das Ergebnis hängt nicht davon ab, in wie vielen Schritten die Zeit vergeht; Snapshot/Restore reproduziert exakt                                       |
| Massenerhaltung               | Natrium und Kalium: Ausscheidung entspricht im Gleichgewicht der Zufuhr; Wasser: Zufuhr minus Perspiratio und Stuhl ergibt die Urinmenge; eine Blutung entzieht genau das entnommene Volumen |
| Keine unphysiologischen Werte | 13 Extrempresets über 7 Tage: alles endlich, nichts negativ, Druck/Frequenz/Osmolalität in lebbaren Grenzen                                                                                  |
| Numerische Stabilität         | 30 simulierte Tage bleiben stabil, auch mit Mehrfachstörung; danach ändert ein weiterer Tag den Druck um weniger als 1,5 mmHg                                                                |
| Schrittweite                  | fest 2 s; Teilschritte werden aufsummiert, nicht verworfen                                                                                                                                   |

<a id="grenzen"></a>

## Bekannte Grenzen

1. **Kein Begriff von Tod.** Zwei Presets beschreiben einen Patienten, der sterben würde —
   unbehandelter Diabetes insipidus ohne Zugang zu Wasser (Osmolalität > 420 mosm/kg) und
   SIADH bei erzwungenem Trinken (Osmolalität < 140 mosm/kg). Das Modell rechnet weiter.
   Es liefert dort endliche, nichtnegative Werte, aber keine sinnvolle Physiologie mehr.
   **Offen für M2:** die Oberfläche muss solche Zustände sichtbar als „nicht mehr
   physiologisch" markieren, statt sie wie einen Messwert zu präsentieren.
2. **Salzsensitivität** wird nicht abgebildet (siehe Szenario 2).
3. **Der Druckanstieg bei Conn** ist schwächer als klinisch (siehe Szenario 5).
4. **Die Stenose ist als Druckabfall parametrisiert**, nicht als Lumeneinengung. Das ist im
   Regler beschriftet, aber eine Quelle von Missverständnissen — für M3 ist ein Lerninhalt
   vorgesehen, der beides gegenüberstellt.
5. **Kaliumverschiebungen** (Insulin, β2, pH) fehlen bewusst
   ([ADR-0006](../adr/0006-umfang-des-kaliummodells.md)).
