# ADR-0005: Medikamente wirken ausschließlich über benannte Angriffspunkte

- Status: angenommen
- Datum: 2026-07-28

## Kontext

Ein Simulator könnte einen ACE-Hemmer bequem als „MAP minus 12 mmHg" abbilden. Das wäre
falsch gelernt: Studierende sollen sehen, _warum_ der Druck fällt, und sie sollen erleben,
dass derselbe Wirkstoff bei Nierenarterienstenose die GFR einbrechen lässt.

## Entscheidung

Jede Intervention wirkt nur über eine Menge benannter Angriffspunkte
(`ModulationSite`, z. B. `ace.activity`, `nkcc2.transport`, `mr.receptor`,
`pge2.afferentDilation`). Ein Angriffspunkt ist ein multiplikativer Faktor auf eine
Modellgröße; 1 bedeutet unbeeinflusst. Die Dosis-Wirkungs-Beziehung ist ein
Emax/EC50-Modell über der Wirkstärke 0–100 %.

Kein Medikament darf einen Anzeigewert (MAP, GFR, Urinvolumen) direkt verändern.

## Begründung

- Kombinationseffekte entstehen von selbst: NSAID plus ACE-Hemmer plus Diuretikum ergibt
  den GFR-Einbruch, ohne dass jemand diesen Fall programmiert hat.
- Das „Warum?"-Panel kann die Kausalkette aus den aktiven Angriffspunkten erzeugen.
- Die Mechanismus-Zoomstufe kann genau den gehemmten Transporter markieren.

## Konsequenzen

- Emax- und EC50-Werte sind überwiegend **didaktische Setzungen**, keine Lehrbuchwerte.
  Sie werden in `docs/model/constants.md` ausdrücklich so gekennzeichnet.
- Neue Wirkstoffe brauchen entweder einen vorhandenen Angriffspunkt oder einen neuen —
  Letzteres ist eine bewusste Modellerweiterung mit ADR.
