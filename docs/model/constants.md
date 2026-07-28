# Modellkonstanten

Zwei Kategorien, bewusst getrennt:

**A — belegte Werte.** Normwerte und Standardgrößen aus der Lehrbuchliteratur.

**B — Kalibrierungsgrößen.** Widerstände, Verstärkungen und Zeitkonstanten, die nicht
direkt messbar sind. Sie wurden so eingestellt, dass sich die Werte aus (A) im Ruhezustand
einstellen und die Szenarien aus [validation.md](validation.md) das erwartete Verhalten
zeigen. **Sie tragen keine Lehrbuchquelle** — im Code sind sie mit `KALIBRIERT`
gekennzeichnet. Eine erfundene Zahl mit erfundener Quelle wäre der schlimmste Fehler, den
dieses Projekt machen kann.

## Quellenkürzel

| Kürzel | Werk                                               |
| ------ | -------------------------------------------------- |
| G&H    | Guyton & Hall, _Textbook of Medical Physiology_    |
| B&B    | Boron & Boulpaep, _Medical Physiology_             |
| Si     | Silbernagl/Despopoulos, _Taschenatlas Physiologie_ |
| KPS    | Klinke/Pape/Kurtz/Silbernagl, _Physiologie_        |

> **Offen:** Die Zitate stehen auf Werk- und Kapitelebene. Seitengenaue Angaben werden
> ergänzt, sobald die verwendeten Auflagen feststehen — geratene Seitenzahlen kommen hier
> nicht hinein.

---

## A — Hämodynamik

| Größe                       | Wert             | Einheit    | Quelle                                                                 |
| --------------------------- | ---------------- | ---------- | ---------------------------------------------------------------------- |
| Mittlerer arterieller Druck | 93 (70–105)      | mmHg       | G&H, Si                                                                |
| Herzfrequenz                | 70 (60–100)      | 1/min      | Si                                                                     |
| Schlagvolumen               | 70 (60–80)       | mL         | B&B                                                                    |
| Herzzeitvolumen             | 5,0 (4,5–6,0)    | L/min      | G&H                                                                    |
| Enddiastolisches Volumen    | 120              | mL         | B&B                                                                    |
| Auswurffraktion             | 0,58 (0,55–0,70) | 1          | B&B, abgeleitet 70/120                                                 |
| Zentralvenöser Druck        | 4 (0–8)          | mmHg       | Si                                                                     |
| Mittlerer Füllungsdruck     | 7                | mmHg       | G&H                                                                    |
| Peripherer Gesamtwiderstand | 17,8             | mmHg·min/L | abgeleitet: (93−4)/5,0                                                 |
| Arterielle Compliance       | 0,0018           | L/mmHg     | G&H (Windkessel-Zeitkonstante 1,6–2 s; Pulsdruck 40 mmHg bei SV 70 mL) |
| Herzfrequenzgrenzen         | 35 / 190         | 1/min      | Si                                                                     |

## A — Körperflüssigkeiten

| Größe                    | Wert             | Einheit | Quelle                       |
| ------------------------ | ---------------- | ------- | ---------------------------- |
| Gesamtkörperwasser       | 42               | L       | B&B, Si (60 % von 70 kg)     |
| Extrazellulärvolumen     | 14               | L       | B&B                          |
| Blutvolumen              | 5,0              | L       | Si                           |
| Hämatokrit               | 0,42 (0,37–0,47) | 1       | Si                           |
| Plasmavolumen            | 2,9              | L       | abgeleitet: 5,0 · (1 − 0,42) |
| Plasma-Na⁺               | 140 (135–145)    | mmol/L  | Si                           |
| Plasma-K⁺                | 4,2 (3,5–5,0)    | mmol/L  | Si                           |
| Plasmaosmolalität        | 290 (280–300)    | mosm/kg | Si                           |
| Kolloidosmotischer Druck | 28 (25–30)       | mmHg    | G&H                          |

> **Bekannte Inkonsistenz der Lehrbuchwerte.** Die üblichen runden Zahlen (5,0 L Blut,
> 3,0 L Plasma, Hkt 0,45) passen nicht zusammen: 3,0 / (1 − 0,45) wären 5,45 L. Wir halten
> Blutvolumen und Hämatokrit fest und nehmen das daraus folgende Plasmavolumen, weil beide
> in mehr Gleichungen eingehen. 0,42 liegt im dokumentierten Normbereich.

## A — Umsatz pro Tag

| Größe                                  | Wert          | Einheit | Quelle                                                              |
| -------------------------------------- | ------------- | ------- | ------------------------------------------------------------------- |
| Na⁺-Zufuhr (Voreinstellung)            | 150           | mmol/d  | übliche Zufuhr in Deutschland; DGE-Referenzwert 6 g NaCl (100 mmol) |
| K⁺-Zufuhr                              | 70            | mmol/d  | B&B                                                                 |
| Trinkmenge                             | 1,5           | L/d     | Si                                                                  |
| Nahrungswasser / Oxidationswasser      | 0,7 / 0,3     | L/d     | Si                                                                  |
| Perspiratio insensibilis / Stuhlwasser | 0,9 / 0,15    | L/d     | Si                                                                  |
| Urinvolumen                            | 1,5 (0,5–2,5) | L/d     | Si                                                                  |
| Urinosmolalität                        | 600 (50–1200) | mosm/kg | B&B                                                                 |
| Durstschwelle                          | 292           | mosm/kg | B&B (wenige mosm/kg über der ADH-Schwelle)                          |

## A — Niere

| Größe                            | Wert             | Einheit                | Quelle               |
| -------------------------------- | ---------------- | ---------------------- | -------------------- |
| Renaler Blutfluss (beide)        | 1100             | mL/min                 | G&H (≈ 22 % des HZV) |
| GFR (beide)                      | 125              | mL/min                 | G&H                  |
| Glomerulärer Kapillardruck       | 60               | mmHg                   | G&H                  |
| Druck in der Bowman-Kapsel       | 18               | mmHg                   | G&H                  |
| Nierenvenendruck                 | 8                | mmHg                   | G&H                  |
| Na⁺-Rückresorption PT/TAL/DCT/SR | 67 / 25 / 5 / ~3 | % der filtrierten Last | B&B                  |

## A — Hormone

| Größe                                    | Wert          | Einheit | Quelle              |
| ---------------------------------------- | ------------- | ------- | ------------------- |
| Plasma-Renin-Aktivität                   | 1,0 (0,5–2,0) | ng/mL/h | KPS                 |
| Angiotensin II                           | 15 (10–30)    | ng/L    | B&B                 |
| Aldosteron (liegend)                     | 80 (30–150)   | ng/L    | KPS                 |
| ADH                                      | 2 (1–5)       | ng/L    | B&B                 |
| ANP                                      | 20            | ng/L    | KPS (Größenordnung) |
| Osmotische ADH-Schwelle                  | 280–285       | mosm/kg | B&B                 |
| Halbwertszeit Angiotensin II             | ≈ 30          | s       | B&B                 |
| Halbwertszeit Renin (Plasma)             | ≈ 15          | min     | KPS                 |
| Halbwertszeit Aldosteron                 | ≈ 20          | min     | KPS                 |
| Halbwertszeit ADH                        | 10–20         | min     | B&B                 |
| Latenz der genomischen Aldosteronwirkung | 1–2           | h       | B&B                 |
| Zeitkonstante Barorezeptorreflex         | 5–15          | s       | Vorgabe/Literatur   |

---

## B — Kalibrierungsgrößen

Diese Werte sind **keine Messgrößen**. In Klammern steht, wogegen kalibriert wurde.

| Größe                                                            | Wert                          | Einheit              | kalibriert gegen                                                                                           |
| ---------------------------------------------------------------- | ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Solver-Schrittweite                                              | 2                             | s                    | Stabilität über 30 simulierte Tage bei erträglicher Rechenzeit                                             |
| Systemische Compliance                                           | 0,2                           | L/mmHg               | Form der Guyton-Kurve: Pms fällt nach 1000 mL Verlust etwa auf die Hälfte                                  |
| Unbeanspruchtes Volumen                                          | 3,6                           | L                    | Pms = 7 mmHg bei 5,0 L Blutvolumen                                                                         |
| Venöser Widerstand                                               | 0,6                           | mmHg·min/L           | ZVD = 4 mmHg bei 5 L/min                                                                                   |
| EDV-Kurve (Maximum / Halbwert)                                   | 200 / 4,67                    | mL / mmHg            | EDV = 120 mL bei Pms = 7 mmHg, sättigend                                                                   |
| Steigung Barorezeptorkennlinie                                   | 0,08                          | 1/mmHg               | Arbeitsbereich des Reflexes 60–120 mmHg                                                                    |
| Resetting: Zeitkonstante / Anteil                                | 36 h / 0,9                    | —                    | chronischer Hochdruck wird nicht korrigiert                                                                |
| Sympathikusverstärkung HF / Kontraktilität / TPR / Venentonus    | 0,7 / 0,35 / 0,45 / 0,35 L    | —                    | Szenario „akuter Blutverlust"                                                                              |
| Ang II auf TPR (hoch / niedrig)                                  | 0,28 / 0,08                   | —                    | asymmetrisch: die RAAS trägt beim salzreplet Gesunden wenig zum Ruhetonus bei (Szenario Conn)              |
| ANP auf TPR                                                      | 0,04                          | —                    | bewusst klein                                                                                              |
| Nachlastempfindlichkeit                                          | 0,25 / Kontraktilität         | —                    | das kranke Herz reagiert stärker                                                                           |
| Ganzkörper-Autoregulation: Verstärkung / τ                       | 2,0 / 2 d                     | —                    | Übergang von hohem Auswurf zu hohem Widerstand bei Volumenhochdruck; Schleifenverstärkung deutlich unter 1 |
| R_aff je Niere                                                   | 0,060                         | mmHg·min/mL          | P_GC = 60 mmHg                                                                                             |
| R_eff je Niere                                                   | 0,0946                        | mmHg·min/mL          | RBF = 550 mL/min je Niere; ergibt 39 % / 61 % Aufteilung (G&H: 26 % / 43 % des renalen Gesamtwiderstands)  |
| Kf je Niere                                                      | 5,9                           | mL/min/mmHg          | GFR = 62,5 mL/min bei den belegten Drücken (G&H geben 12,5 für beide Nieren)                               |
| Myogene Verstärkung                                              | 0,9                           | —                    | GFR bleibt über 80–160 mmHg innerhalb von ~10 %                                                            |
| TGF: Verstärkung / Dilatationsanteil / τ                         | 0,6 / 0,2 / 15 s              | —                    | asymmetrisch; sonst steigt die GFR bei Hypovolämie                                                         |
| Renaler Sympathikus afferent / efferent                          | 0,5 / 0,7                     | —                    | Filtrationsfraktion steigt bei Hypovolämie, während RBF fällt                                              |
| Ang II afferent / efferent                                       | 0,38 / 0,5                    | —                    | efferent dominant, aber nicht allein — sonst läuft P_GC davon                                              |
| NSAR: Verlust der afferenten Dilatation                          | 0,35                          | —                    | „triple whammy"                                                                                            |
| Druck-Natriurese-Verstärkung                                     | 0,7                           | —                    | Szenarien 2, 5 und 9; trägt das Langzeitverhalten                                                          |
| Sammelrohr-Grundanteil                                           | 0,0241                        | der filtrierten Last | Na-Ausscheidung = 150 mmol/d im Ruhezustand (echtes Gleichgewicht)                                         |
| Minimale fraktionelle Na-Ausscheidung                            | 0,0015                        | —                    | kein Tubulussegment ist vollkommen dicht                                                                   |
| Ang II / ANP am proximalen Tubulus                               | 0,04 / 0,02                   | —                    | schwächer als die Druck-Natriurese, sonst gäbe es bei Conn keinen Hochdruck                                |
| Aldosteron am Sammelrohr (Boden / Spanne / Exponent)             | 0,35 / 0,65 / 0,6             | —                    | Ruhezustand und Conn-Szenario                                                                              |
| Aldosteron am distalen Tubulus                                   | Exponent 0,5                  | —                    | ENaC im Verbindungstubulus, schwächerer Griff (B&B, qualitativ)                                            |
| K⁺-Sekretion: Aldosteron (Boden / Spanne)                        | 0,5 / 1,5                     | —                    | sättigend; ohne Sättigung fiel K⁺ bei Conn unter 2 mmol/L                                                  |
| K⁺-Sekretion: Fluss- / Plasmaexponent                            | 0,35 / 1,5                    | —                    | Hypokaliämie unter Schleifendiuretikum und Conn                                                            |
| K⁺-Verteilungsvolumen                                            | 22                            | L                    | Trägheit des Plasmakaliums gegen Gewinne und Verluste                                                      |
| Konzentrierkurve: Halbwertspermeabilität                         | 1,09                          | —                    | Urinosmolalität = 600 mosm/kg bei Ruhe-ADH                                                                 |
| Renin: Druck- / Macula-densa- / Sympathikus- / Ang-II- / ANP-Arm | 0,07 · 2,5 · 0,8 · 0,4 · 0,35 | —                    | Szenarien 1, 2, 3, 5, 6                                                                                    |
| τ transkapillärer Rückstrom                                      | 2                             | h                    | Hämatokrit nach akuter Blutung zunächst normal                                                             |
| Durstverstärkung / Obergrenze                                    | 0,45 L/d pro mosm/kg / 6 L/d  | —                    | Wasserdefizit wird binnen eines Tages ausgeglichen                                                         |
| Extrazelluläre sonstige Osmole                                   | 140                           | mosm                 | EZV · Osmolalität = 4060 mosm im Ruhezustand                                                               |
| Intrazelluläre Osmole                                            | 8120                          | mosm                 | IZV = 28 L bei 290 mosm/kg                                                                                 |

## B — Pharmaka

Alle Emax- und EC50-Werte sind **didaktische Setzungen**, keine pharmakokinetischen
Messwerte. Emax ist der Faktor bei 100 % Wirkstärke, EC50 einheitlich 35 %.

| Wirkstoff           | Angriffspunkt           | Emax                                               |
| ------------------- | ----------------------- | -------------------------------------------------- |
| ACE-Hemmer          | `ace.activity`          | 0,15 (nicht 0 — Chymase-Weg, „Angiotensin escape") |
| AT1-Blocker         | `at1.receptor`          | 0,10                                               |
| Reninhemmer         | `renin.secretion`       | 0,20                                               |
| Spironolacton       | `mr.receptor`           | 0,25                                               |
| Thiazid             | `ncc.transport`         | 0,35                                               |
| Schleifendiuretikum | `nkcc2.transport`       | 0,25                                               |
| β-Blocker           | `beta1.receptor`        | 0,20                                               |
| Ca-Antagonist       | `vsmc.calciumChannel`   | 0,70                                               |
| NSAR                | `pge2.afferentDilation` | 0,15                                               |
| Desmopressin        | `v2.receptor`           | 3,5 (Agonist)                                      |
