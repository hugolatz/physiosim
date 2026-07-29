# PhysioSim

Interaktiver Physiologie-Simulator für Medizinstudierende im deutschsprachigen Raum.

Man verändert einen Parameter — Kochsalzzufuhr, Blutvolumen, ACE-Hemmer-Dosis — und der
ganze Körper reagiert: Animation, Messwerte, Kurven und Erklärtext stammen alle aus
**einem** Rechenmodell. Die Grafik zeigt nie etwas anderes als das, was das Modell rechnet.

> **Kein klinisches Werkzeug.** PhysioSim ist ein didaktisches, stark vereinfachtes Modell.
> Es ist nicht für die Patientenversorgung bestimmt und ersetzt weder Lehrbuch, Leitlinie
> noch ärztliche Entscheidung.

## Stand

Meilenstein M0 (Fundament), M1 (Simulationskern), M2 (Visualisierung) und M3 (Lernen).

Die Startseite ist der Simulator: eine lebende Ganzkörperansicht, in der das Herz mit der
berechneten Frequenz schlägt, die Gefäßweite dem Widerstand folgt, die Nieren ihre eigene
Durchblutung tragen und Tropfen im Takt des Urinflusses fallen. Herz und Nieren sind
anklickbar und führen eine Ebene tiefer — beim Nephron mit getrennt dargestellten
Arteriolen, Filtrationsdrücken und segmentweisen Rückresorptionspfeilen.

Dazu ein **„Warum?"-Panel**, das die Kausalkette aus den Faktoren erzeugt, die die Module
beim Rechnen mitgeschrieben haben — es zitiert also die Zahlen, die das Ergebnis erzeugt
haben, statt sie nachzuerzählen. Jedes Glied der Kette führt weiter: entweder eine Ebene
tiefer zur nächsten Frage oder in den Lerninhalt. 24 Lerninhalte liegen als MDX vor, jeweils
mit Basis, Klinik und Prüfungsfragen; die Quellenangabe ist Pflicht und wird von der CI
erzwungen. Der vollständige Zustand steht in der Adresszeile und lässt sich als Link teilen.

**Grundregel der Darstellung:** jede Animationseigenschaft wird in
`apps/web/lib/visuals.ts` aus einer Modellgröße berechnet. Nichts bewegt sich aus
dekorativen Gründen. Wo das Modell eine Größe nicht kennt — etwa die Durchblutung einzelner
Extremitäten — bekommt sie auch keinen eigenen Bildkanal, sondern teilt sich einen
gemeinsamen Index, und die Bildunterschrift sagt das.

## Schnellstart

```bash
npm install
npm run dev
```

Die App läuft dann auf http://localhost:3000. Unter http://localhost:3000/debug liegt
zusätzlich die vollständige Wertetabelle des Simulationskerns.

## Werkzeuge

| Befehl                  | Wirkung                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Entwicklungsserver der Web-App                                   |
| `npm run build`         | Statischer Export nach `apps/web/out`                            |
| `npm run lint`          | ESLint über das ganze Monorepo                                   |
| `npm run typecheck`     | TypeScript ohne Emit, alle Workspaces                            |
| `npm test`              | Vitest: Unit-, Invarianten- und Validierungsszenarien der Engine |
| `npm run test:coverage` | Testabdeckung der Engine (Ziel ≥ 85 %)                           |

## Aufbau

```
apps/web           Next.js-Oberfläche (App Router, TypeScript strict)
  components/body    Ganzkörperansicht
  components/organs  Nephron- und Herzdetail
  components/learn   „Warum?"-Panel, Lerninhalt-Panel, Szenarien, Quiz
  content            Lerninhalte als MDX, Quellenangabe verpflichtend
  lib/visuals.ts     Zuordnung Modellgröße → Bildeigenschaft
packages/engine    Simulationskern — reines TypeScript, keine React-Abhängigkeit
  src/explain      erzeugt die Kausalketten aus den mitgeschriebenen Faktoren
packages/ui        geteilte Design-Tokens und Primitives
docs/model         Gleichungen, Konstanten, Quellen, Validierungsverhalten
docs/adr           Architecture Decision Records
```

Der Kern kennt die Oberfläche nicht. Jedes Körpersystem ist ein Modul mit derselben
Schnittstelle (`SystemModel`) und tauscht sich über einen gemeinsamen Signalraum
(`OrganismBus`) mit den anderen aus. Ein zweites System hinzuzufügen heißt: eine neue
Datei unter `packages/engine/src/systems/` anlegen und registrieren — der Kern bleibt
unangetastet.

## Modell prüfen ohne Code zu lesen

`docs/model/raas.md` beschreibt sämtliche Gleichungen, `docs/model/constants.md` alle
Konstanten mit Quelle bzw. mit ausdrücklicher Kennzeichnung als Kalibrierungsgröße, und
`docs/model/validation.md` das erwartete Verhalten in jedem Szenario. Diese drei Dateien
sind für Physiologie-Dozentinnen und -Dozenten geschrieben, nicht für Entwickler.

## Lizenz

Code: [MIT](LICENSE). Lerninhalte unter `apps/web/content`:
[CC BY-SA 4.0](LICENSE-CONTENT).
