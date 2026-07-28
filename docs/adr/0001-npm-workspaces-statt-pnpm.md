# ADR-0001: npm-Workspaces statt pnpm

- Status: angenommen
- Datum: 2026-07-28

## Kontext

Die Projektvorgabe nennt pnpm als Paketmanager. Auf der Entwicklungsmaschine ist pnpm
nicht installiert; das bestehende Schwesterprojekt (alkocheck) nutzt npm mit
`package-lock.json`, und Netlify baut dort mit npm. Node liegt in Version 24 lokal und
20 in der Build-Umgebung vor, npm 11 ist mitgeliefert.

## Entscheidung

Wir nutzen **npm-Workspaces**. Die Verzeichnisstruktur des Monorepos bleibt exakt wie
vorgegeben (`apps/*`, `packages/*`), lediglich `pnpm-workspace.yaml` entfällt zugunsten
des `workspaces`-Feldes in der Wurzel-`package.json`.

## Begründung

Der Vorteil von pnpm (harte Links, strengere Abhängigkeitsauflösung) wiegt hier weniger
als ein einheitlicher Werkzeugkasten über beide Projekte des Nutzers hinweg: eine
Installationsart, ein Lockfile-Format, eine CI-Cache-Konfiguration, keine zusätzliche
globale Installation. Das Projekt hat drei Workspaces, nicht dreißig.

## Konsequenzen

- `npm ci` in der CI, `cache: npm` in `actions/setup-node`.
- Phantom-Abhängigkeiten sind mit npm technisch möglich; dagegen hilft, dass die Engine
  bewusst **keine** Laufzeitabhängigkeiten hat.
- Ein Wechsel zu pnpm bleibt später möglich: Lockfile löschen, `pnpm-workspace.yaml`
  anlegen, CI-Schritt tauschen.
