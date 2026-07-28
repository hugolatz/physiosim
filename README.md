# PhysioSim

Interaktiver Physiologie-Simulator für Medizinstudierende im deutschsprachigen Raum.

Man verändert einen Parameter — Kochsalzzufuhr, Blutvolumen, ACE-Hemmer-Dosis — und der
ganze Körper reagiert: Animation, Messwerte, Kurven und Erklärtext stammen alle aus
**einem** Rechenmodell. Die Grafik zeigt nie etwas anderes als das, was das Modell rechnet.

> **Kein klinisches Werkzeug.** PhysioSim ist ein didaktisches, stark vereinfachtes Modell.
> Es ist nicht für die Patientenversorgung bestimmt und ersetzt weder Lehrbuch, Leitlinie
> noch ärztliche Entscheidung.

## Stand

Meilenstein M0 (Fundament) und M1 (Simulationskern). Die Oberfläche ist bis M2 bewusst
schlicht: eine Debug-Seite mit Reglern und Zahlen. Erst kommt das Modell, dann die Optik.

## Schnellstart

```bash
npm install
npm run dev
```

Die App läuft dann auf http://localhost:3000, die Debug-Oberfläche des Simulationskerns
unter http://localhost:3000/debug.

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
packages/engine    Simulationskern — reines TypeScript, keine React-Abhängigkeit
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
