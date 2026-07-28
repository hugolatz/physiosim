# Das kardiorenale Modell

Diese Datei beschreibt das Modell so, dass es ohne Blick in den Code geprüft werden kann.
Wer eine Gleichung für falsch hält, eröffnet bitte ein Issue nach der Vorlage
„Physiologie-Problem" — mit Quelle.

**Bezugsperson:** Mann, 70 kg, in Ruhe, liegend.
**Alle Konstanten mit Herkunft:** [constants.md](constants.md).
**Erwartetes Verhalten je Szenario:** [validation.md](validation.md).

---

## 0. Aufbau

Vier Module rechnen gleichzeitig und tauschen ihre Ergebnisse über einen gemeinsamen
Signalraum aus:

| Modul            | rechnet                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `balance`        | Gesamtkörperwasser, Natrium, Kalium, Plasma- und Erythrozytenvolumen |
| `cardiovascular` | Herzzeitvolumen, Widerstand, Blutdruck, Barorezeptorreflex           |
| `endocrine-raas` | Renin, Angiotensin II, Aldosteron, ADH, ANP                          |
| `renal`          | zwei Nieren: Filtration, Tubulus, Ausscheidung, Reninfreisetzung     |

Jedes Modul liest den Signalstand des **vorherigen** Rechenschritts. Damit ist das Ergebnis
unabhängig davon, in welcher Reihenfolge die Module gerechnet werden
([ADR-0003](../adr/0003-organism-bus-mit-einem-schritt-verzoegerung.md)).

Schrittweite: **2 s Modellzeit**, konstant über alle Zeitrafferstufen
([ADR-0002](../adr/0002-solver-rk4-feste-schrittweite.md)). Relaxationen erster Ordnung
werden mit ihrer exakten Lösung fortgeschrieben, Bilanzen explizit integriert.

---

## 1. Wasser- und Elektrolythaushalt

Buchgeführt werden **Gesamtkörperwasser** (TBW) und **extrazelluläres Natrium**. Alles
andere folgt aus dem osmotischen Gleichgewicht:

<a id="eq-osmolalitaet"></a>

```
Osmolalität       = (2·Na_EZR + Osm_EZR,sonstige + Osm_IZR) / TBW          (eq:osmolalitaet)
EZV               = (2·Na_EZR + Osm_EZR,sonstige) / Osmolalität            (eq:ezv)
IZV               = TBW − EZV
Plasma-Na⁺        = Na_EZR / EZV                                           (eq:plasma-natrium)
```

Der Vorteil dieser Buchführung: getrunkenes **freies Wasser** verteilt sich von selbst auf
alle 42 L, eine **isotone Infusion** bleibt von selbst extrazellulär. Kein Sonderfall.

<a id="eq-wasserbilanz"></a>

```
dTBW/dt   = (Trinken + Durst + Infusion + Nahrungswasser + Oxidationswasser)
            − (Urin + Perspiratio insensibilis + Stuhlwasser)              (eq:wasserbilanz)
dNa/dt    = Na-Zufuhr + Infusion·154 mmol/L − Na-Ausscheidung              (eq:natriumbilanz)
dK/dt     = K-Zufuhr − K-Ausscheidung                                      (eq:kaliumbilanz)
```

Kalium wird in einem effektiven Verteilungsvolumen von 22 L geführt; der intrazelluläre
Raum ist als träger Puffer behandelt, nicht als eigenes Kompartiment
([ADR-0006](../adr/0006-umfang-des-kaliummodells.md)).

**Plasmavolumen** ist ein Anteil des EZV, folgt ihm aber mit einer Zeitkonstante von 2 h
(transkapillärer Rückstrom). Deshalb ist der Hämatokrit unmittelbar nach einer Blutung noch
normal und fällt erst später.

<a id="eq-onkotischer-druck"></a>

```
Plasmavolumen → relaxiert gegen  EZV · 0,207 · (π/π₀)                      (eq:plasmavolumen)
Blutvolumen   = Plasmavolumen + Erythrozytenvolumen                        (eq:blutvolumen)
Hämatokrit    = Erythrozytenvolumen / Blutvolumen                          (eq:haematokrit)
π             = 28 mmHg · (2,9 L / Plasmavolumen) − Proteinverlust         (eq:onkotischer-druck)
```

Die Proteinmasse ist konstant: verdünntes Plasma hat einen niedrigeren kolloidosmotischen
Druck. Das nephrotische Syndrom entfernt Protein zusätzlich.

**Blutung** entzieht Vollblut: der Plasmaanteil nimmt Wasser und Natrium mit, der
Zellanteil nur Erythrozytenvolumen.

**Durst** setzt oberhalb von 292 mosm/kg ein und ist abschaltbar — das ist der Patient ohne
Zugang zu Wasser.

---

## 2. Hämodynamik

<a id="eq-map"></a>
Der arterielle Mitteldruck wird **nicht zugewiesen, sondern integriert**. Der arterielle
Windkessel füllt sich mit dem Herzzeitvolumen und entleert sich über den Widerstand:

```
dMAP/dt = (HZV − (MAP − ZVD)/TPR) / C_art                                  (eq:map)
```

Im Gleichgewicht ergibt das die vertraute Form `MAP = HZV · TPR + ZVD`; während einer
Störung zeigt es den tatsächlichen Zeitverlauf. Die Zeitkonstante ist `TPR · C_art ≈ 2 s`.

<a id="eq-pulsdruck"></a>

```
Pulsdruck   = SV / C_art
systolisch  = MAP + ⅔ · Pulsdruck
diastolisch = MAP − ⅓ · Pulsdruck                                          (eq:pulsdruck)
```

### Füllung und Auswurf

<a id="eq-edv"></a>

```
P_ms  = (Blutvolumen − unbeanspruchtes Volumen) / C_syst
ZVD   = P_ms − HZV · R_venös                                               (eq:zvd)
EDV   = EDV_max · P_ms / (P_ms + k)                                        (eq:edv)
```

Der Sympathikus verkleinert das unbeanspruchte Volumen (Venokonstriktion) und erhöht damit
`P_ms` — genau der Mechanismus, der bei Volumenmangel den venösen Rückstrom rettet.

<a id="eq-ef"></a>

```
Kontraktilität = Parameter · (1 − 0,7·Herzinsuffizienz) · (1 + g_β1·(S−1)·β1)
Nachlastfaktor = 1 − (0,25 / Kontraktilität) · (MAP − 93)/93
EF             = EF₀ · Kontraktilität · Nachlastfaktor                     (eq:ef)
SV             = EDV · EF                                                  (eq:schlagvolumen)
HZV            = HF · SV                                                   (eq:hzv)
```

Die Nachlastempfindlichkeit ist durch die Kontraktilität geteilt: das **kranke** Herz
verliert pro mmHg Nachlast mehr Schlagvolumen als das gesunde. Das ist der Grund, warum
Nachlastsenkung bei Herzinsuffizienz hilft.

<a id="eq-tpr"></a>

```
TPR = TPR₀ · Autoregulation · Gefäßtonus · f(Sympathikus) · f(Ang II) · f(ANP) · Ca-Antagonist
                                                                            (eq:tpr)
```

<a id="eq-ganzkoerper-autoregulation"></a>
**Ganzkörper-Autoregulation** (Guyton): das Gewebe verteidigt seine eigene Durchblutung.
Bleibt das Herzzeitvolumen über dem Bedarf, schließen sich die Widerstandsgefäße über Tage.

```
Autoregulation → relaxiert (τ = 2 d) gegen  1 + 2,0 · (HZV/HZV₀ − 1)
                                                                (eq:ganzkoerper-autoregulation)
```

Ohne diesen Baustein bewegt eine chronische Volumenlast den Blutdruck praktisch nicht — und
Conn-Syndrom wäre keine Ursache von Bluthochdruck.

### Barorezeptorreflex

<a id="eq-barorezeptorreflex"></a>

```
S_soll = 2 / (1 + e^(k·(MAP − Sollwert)))                        (eq:barorezeptorreflex)
S      → relaxiert gegen S_soll mit τ = 10 s
```

`S` ist der normierte Sympathikotonus (1 = Ruhe) und wirkt auf Herzfrequenz und
Kontraktilität (β1), auf Widerstand und Venentonus (α1) und auf die **Reninfreisetzung**
(β1) — das ist die Brücke zwischen dem Sekunden- und dem Tagesgeschehen. Ein β-Blocker
dämpft nur die β1-Äste; die α1-Wirkung bleibt.

<a id="eq-baro-resetting"></a>

```
Sollwert → relaxiert (τ = 36 h) gegen  93 + 0,9·(MAP − 93)                 (eq:baro-resetting)
```

Deshalb korrigiert der Reflex einen **chronisch** erhöhten Druck nicht: er akzeptiert ihn.

---

## 3. RAAS, ADH und ANP

<a id="eq-renin-pool"></a>

```
PRA          → relaxiert (τ = 21,6 min) gegen 1,0 ng/mL/h · Reninfreisetzung  (eq:renin-pool)
Ang II       → relaxiert (τ = 43 s) gegen 15 ng/L · (PRA/PRA₀) · ACE-Aktivität (eq:angiotensin-ii)
AT1-Signal   = (Ang II / 15 ng/L) · AT1-Rezeptorverfügbarkeit                 (eq:at1-signal)
```

Die Trennung von **Konzentration** und **Signal** ist Absicht: ein AT1-Blocker lässt
Angiotensin II ansteigen und senkt gleichzeitig die Wirkung. Beide Zahlen stehen
nebeneinander im Messwertpanel.

<a id="eq-aldosteron"></a>

```
Aldosteron_geregelt = 80 ng/L · (0,3 + 0,7·AT1-Signal^0,9) · f(K⁺) · (1 − 0,95·Addison)
Aldosteron          → relaxiert (τ = 29 min) gegen (geregelt + autonom)     (eq:aldosteron)
Aldosteronwirkung   → relaxiert (τ = 1,5 h) gegen Aldosteron · MR-Verfügbarkeit
                                                                  (eq:aldosteron-wirkung)
```

Kalium ist ein **zweiter, unabhängiger** Stimulus. Conn-Syndrom ist eine _autonome_
Sekretion, die zur geregelten hinzukommt — deshalb bleibt sie bestehen, während das Renin
supprimiert wird. Die Wirkung hinkt der Konzentration um anderthalb Stunden nach, weil der
Mineralokortikoidrezeptor ein Transkriptionsfaktor ist.

<a id="eq-adh"></a>

```
osmotischer Antrieb = max(0, (Osmolalität − 280) · 0,2 ng/L pro mosm/kg)
Volumenfaktor       = 1 + 4 · max(0, (93 − MAP)/93 − 0,05)
ADH_soll            = max(Grundwert, osmotisch · Volumen · f(Ang II) · (1 − DI), SIADH)
ADH                 → relaxiert (τ = 21,6 min) gegen ADH_soll               (eq:adh)
Wasserpermeabilität = (ADH/2 ng/L) · V2-Verfügbarkeit · AQP2
```

Der Volumenreiz greift erst ab etwa 5 % Druckabfall, dann aber steil — deshalb kann ADH bei
Hypovolämie die Osmolalität überstimmen. SIADH ist als **Untergrenze** modelliert, nicht als
Faktor: sonst würde die von ihm verursachte Hyponatriämie die Sekretion wieder abschalten.

<a id="eq-anp"></a>

```
ANP → relaxiert (τ = 4,3 min) gegen 20 ng/L · (1 + 1,5·(ZVD − 4)/4)        (eq:anp)
```

---

## 4. Die Nieren

Es sind **zwei**, getrennt gerechnet
([ADR-0004](../adr/0004-zwei-nieren.md)). Ohne das ist eine einseitige Nierenarterienstenose
nicht darstellbar.

<a id="eq-renaler-perfusionsdruck"></a>

```
P_renal = MAP · (1 − Druckabfall über der Stenose)         (eq:renaler-perfusionsdruck)
```

> Der Stenose-Parameter ist der **Druckabfall**, nicht der Grad der Lumeneinengung. Eine
> 70-prozentige Einengung kostet keine 70 % des Drucks.

### Autoregulation

Zwei getrennt abschaltbare Mechanismen am Vas afferens:

<a id="eq-bayliss"></a>

```
myogen (Bayliss) = 1 + 0,9 · (P_renal − 93)/93                             (eq:bayliss)
TGF              → relaxiert (τ = 15 s) gegen 1 + g · (NaCl_MD / NaCl_MD,₀ − 1)
                                                                  (eq:tubuloglomerulaeres-feedback)
```

Das tubuloglomeruläre Feedback ist **asymmetrisch**: eine hohe NaCl-Last an der Macula densa
verengt kräftig, eine niedrige kann nur den vorhandenen Ruhetonus lösen. Ohne diese
Asymmetrie würde die Schleife bei Hypovolämie die GFR anheben — das Gegenteil dessen, was
eine Niere tut.

<a id="eq-r-aff"></a>

```
R_aff = R_aff,₀ · myogen · TGF · f(Sympathikus) · f(Ang II) · f(NSAR) · Medikamente
                                                                            (eq:r-aff)
R_eff = R_eff,₀ · f_eff(Ang II) · f_eff(Sympathikus) · Medikamente          (eq:r-eff)
```

Angiotensin II und der Sympathikus verengen **beide** Arteriolen, das Vas efferens jeweils
stärker. Genau diese Differenz hebt die Filtrationsfraktion bei Volumenmangel, während die
Nierendurchblutung fällt. NSAR nehmen dem Vas afferens die PGE₂-vermittelte Weitstellung.

### Filtration

<a id="eq-gfr"></a>

```
RBF   = (P_renal − P_Vene) / (R_aff + R_eff)                               (eq:rbf)
RPF   = RBF · (1 − Hkt)
P_GC  = P_renal − RBF · R_aff                                              (eq:p-gc)
π_mit = π_Plasma · (1 + ½·FF/(1 − FF))
GFR   = Kf · (P_GC − P_Bowman − π_mit)                                     (eq:gfr)
FF    = GFR / RPF                                                          (eq:ff)
```

`π_mit` ist der Mittelwert zwischen zu- und abführendem Ende der Kapillare. Er steigt mit
der Filtrationsfraktion und bremst die Filtration von selbst — das ist die Tendenz zum
Filtrationsgleichgewicht.

### Tubulus

Segmentweise, jeweils als Anteil der **filtrierten** Last, begrenzt durch das, was ankommt:

| Segment                  | Anteil in Ruhe | moduliert durch                                        |
| ------------------------ | -------------- | ------------------------------------------------------ |
| Proximaler Tubulus       | 0,67           | Perfusionsdruck (Druck-Natriurese), Ang II (NHE3), ANP |
| Dicker aufsteigender Ast | 0,25           | NKCC2 (Schleifendiuretikum), Ang II                    |
| Distales Konvolut        | 0,05           | NCC (Thiazid), Aldosteron (schwach)                    |
| Sammelrohr               | 0,024          | Aldosteron (ENaC), ANP                                 |

<a id="eq-macula-densa"></a>

```
NaCl an der Macula densa = filtrierte Last − PT − TAL              (eq:macula-densa)
```

<a id="eq-druck-natriurese"></a>
**Druck-Natriurese** — der wichtigste Baustein des Langzeitverhaltens — greift am
proximalen Tubulus an:

```
Druckfaktor      = 1 − 0,7 · (P_renal − 93)/93                      (eq:druck-natriurese)
PT-Anteil        = 0,67 · Druckfaktor · f(Ang II) · f(ANP) · NHE3-Hemmung
```

Steigt der renale Perfusionsdruck, sinkt die proximale Rückresorption, und die
Natriumausscheidung steigt überproportional. Der Schnittpunkt dieser renalen Funktionskurve
mit der Salzzufuhr ist der Langzeit-Sollwert des Blutdrucks (Guyton-Diagramm). Der Schalter
„Druck-Natriurese aktiv" erlaubt, sie versuchsweise abzuschalten.

<a id="eq-natriumausscheidung"></a>

```
Na-Ausscheidung = max(filtrierte Last − Σ Rückresorption, 0,0015 · filtrierte Last)
                                                                (eq:natriumausscheidung)
```

Die Untergrenze bildet ab, dass kein Tubulussegment vollkommen dicht ist: die fraktionelle
Ausscheidung wird sehr klein, aber nie null.

<a id="eq-kaliumausscheidung"></a>

```
K-Ausscheidung = K₀ · f_sätt(Aldosteronwirkung) · (Fluss/Fluss₀)^0,35 · (K⁺/4,2)^1,5 · ENaC
                                                                 (eq:kaliumausscheidung)
```

Drei Treiber: Aldosteron (**sättigend** — ENaC und Na⁺/K⁺-ATPase lassen sich nur begrenzt
hochregulieren), distaler Fluss und das Plasmakalium selbst. Damit erklärt das Modell
Hypokaliämie unter Schleifendiuretikum _und_ unter Conn, und Hyperkaliämie unter
Spironolacton — mit demselben Ansatz.

### Wasser

<a id="eq-urinfluss"></a>

```
auszuscheidende Osmole = 2·(Na_Urin + K_Urin) + Harnstoff u. a.
maximale Konzentrierung = 50 + 1150 · NKCC2-Aktivität
Urinosmolalität         = 50 + (max − 50) · Perm/(Perm + 1,09)     (eq:urinosmolalitaet)
Urinvolumen             = auszuscheidende Osmole / Urinosmolalität  (eq:urinfluss)
freie Wasser-Clearance  = V − Osmolar-Clearance             (eq:freie-wasser-clearance)
```

Das Urinvolumen ergibt sich also aus den Osmolen, die hinaus müssen, und der Konzentration,
die das Sammelrohr erreichen kann. Vorteile: Wasser- und Osmolbilanz sind konstruktiv
konsistent; Diabetes insipidus (Permeabilität → 0 → Urin maximal verdünnt) und SIADH
brauchen keinen Sonderfall; und ein Schleifendiuretikum senkt zugleich die maximale
Konzentrierfähigkeit, weil es den Markgradienten zerstört.

### Reninfreisetzung

<a id="eq-reninsekretion"></a>

```
Freisetzung = f(P_renal) · f(NaCl an der Macula densa) · f(Sympathikus·β1)
              · f(Ang-II-Rückkopplung) · f(ANP) · Reninhemmer      (eq:reninsekretion)
```

Alle drei Stimuli sind **multiplikativ** und werden je Niere gerechnet; der Plasmapool sieht
den Mittelwert beider Seiten. Nur so ergibt „Renin ↑↑ aus der stenosierten Niere" überhaupt
einen Sinn.

---

## 5. Wo Medikamente angreifen

Kein Medikament verändert einen Anzeigewert direkt
([ADR-0005](../adr/0005-medikamente-wirken-nur-ueber-angriffspunkte.md)). Jedes wirkt auf
einen benannten Punkt im Modell:

| Wirkstoff           | Angriffspunkt           |
| ------------------- | ----------------------- |
| ACE-Hemmer          | `ace.activity`          |
| AT1-Blocker         | `at1.receptor`          |
| Reninhemmer         | `renin.secretion`       |
| Spironolacton       | `mr.receptor`           |
| Thiazid             | `ncc.transport`         |
| Schleifendiuretikum | `nkcc2.transport`       |
| β-Blocker           | `beta1.receptor`        |
| Ca-Antagonist       | `vsmc.calciumChannel`   |
| NSAR                | `pge2.afferentDilation` |
| Desmopressin        | `v2.receptor`           |

Kombinationen entstehen dadurch von selbst. Der GFR-Einbruch unter NSAR + ACE-Hemmer +
Diuretikum ist nirgends programmiert — er fällt aus den drei Angriffspunkten heraus.

---

## 6. Was dieses Modell nicht kann

- Keine Einzelschlag-Dynamik. Die Herzfrequenz geht als Mittelwert ein; unterhalb weniger
  Sekunden bildet das Modell nichts ab.
- Keine Säure-Basen-Regulation, keine Atmung, kein Sauerstofftransport. Die Signale
  (`arterialPh`, `paCO2MmHg`, `paO2MmHg`) sind vorgesehen und konstant gehalten.
- Keine transzelluläre Kaliumverschiebung (Insulin, β2, pH).
- Keine Autoregulation der Nierendurchblutung über die Renin-unabhängigen medullären
  Mechanismen, kein Harnstoffkreislauf im Detail.
- Kein Begriff von Tod oder Kreislaufversagen: bei extremen Einstellungen rechnet das
  Modell in physiologisch unmögliche Bereiche weiter. Siehe
  [validation.md](validation.md#grenzen).
