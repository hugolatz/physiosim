# Lerninhalte ergänzen

> Das Content-System selbst wird in **M3** gebaut. Diese Datei legt jetzt schon fest, wie
> Inhalte aussehen müssen, damit die Knoten im Modell (`contentId`) von Anfang an auf die
> richtigen Dateinamen zeigen.

## Wo

`apps/web/content/<id>.mdx` — der Dateiname ist die `id` und muss mit dem `contentId`
übereinstimmen, das im Modell hinterlegt ist. Welche Knoten das sind, findet man mit:

```bash
grep -rho "contentId: '[^']*'" packages/engine/src | sort -u
```

## Aufbau

```mdx
---
id: ang-ii
title: Angiotensin II
system: cardio-renal
tags: [RAAS, Vasokonstriktion, Niere]
sources:
  - 'Silbernagl/Despopoulos, Taschenatlas Physiologie'
  - 'Boron & Boulpaep, Medical Physiology'
---

## Basis

Mechanismus, Rezeptor, Stellung im Regelkreis. Vorklinikniveau.

## Klinik

Was das am Patienten bedeutet: ACE-Hemmer, Nierenarterienstenose, Herzinsuffizienz.

## Prüfung

3–5 Fragen im IMPP-Stil (Fünf-Antworten-Einfachauswahl), jeweils mit Begründung, warum
die Distraktoren falsch sind.
```

Beide Ebenen — Basis und Klinik — sind in der Oberfläche **gleichzeitig erreichbar**
(Tab-Umschaltung, keine getrennten Seiten). Das ist die didaktische Kernentscheidung:
der Mechanismus soll nie ohne seine klinische Konsequenz zu sehen sein und umgekehrt.

## Regeln

1. **`sources` ist Pflicht.** Die CI bricht ab, wenn das Feld fehlt oder leer ist.
2. **Keine Originalfragen des IMPP.** Sie sind urheberrechtlich geschützt. Eigene Fragen
   im selben Stil sind erwünscht.
3. **Keine Abbildungen aus Lehrbüchern.** Referenzieren ja, übernehmen nein. Eigene
   Grafiken gehören als SVG in den Inhalt.
4. **Zahlen im Text müssen zum Modell passen.** Wenn im Text „GFR 125 mL/min" steht, muss
   das Modell diesen Wert im Ruhezustand auch liefern — sonst widerspricht der Lerntext
   der Simulation daneben. Im Zweifel `docs/model/constants.md` prüfen.
5. **Deutsch.** Fachbegriffe in der im deutschsprachigen Studium üblichen Form.

## Lizenz

Inhalte stehen unter CC BY-SA 4.0 (siehe `LICENSE-CONTENT`), getrennt vom Code (MIT). Wer
beiträgt, stimmt dieser Lizenzierung zu.
