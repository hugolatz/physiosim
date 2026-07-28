# ADR-0007: Netlify statt Vercel, statischer Export

- Status: angenommen
- Datum: 2026-07-28

## Kontext

Die Projektvorgabe nennt Vercel. Das bestehende Schwesterprojekt des Nutzers (alkocheck)
liegt auf Netlify, konfiguriert über eine `netlify.toml` mit Security-Headern; eine
Vercel-CLI oder ein Vercel-Projekt existiert auf der Maschine nicht.

Gleichzeitig gilt für PhysioSim: kein Backend, keine Datenbank, kein Login, keine
LLM-Aufrufe zur Laufzeit, Zustand ausschließlich in URL-Parametern. Es gibt nichts, was
serverseitig gerendert werden müsste.

## Entscheidung

Deployment auf **Netlify** über die GitHub-Integration. Die Next.js-App wird als
**statischer Export** (`output: 'export'`) gebaut; Netlify liefert reine Dateien aus
`apps/web/out` aus. Die Security-Header werden aus dem Schwesterprojekt übernommen und auf
den tatsächlichen Bedarf zusammengestrichen (keine externen Verbindungen mehr nötig).

## Begründung

- Ein Werkzeugkasten und ein Anbieter über beide Projekte des Nutzers.
- Statische Auslieferung ist die schnellste Variante und stützt die Vorgabe „Ladezeit
  unter 2 Sekunden" ohne weitere Maßnahmen.
- Ohne Serverlaufzeit gibt es keine Kaltstarts, keine Serverkosten und eine deutlich
  kleinere Angriffsfläche; die CSP kann `connect-src 'self'` setzen.

## Konsequenzen

- Keine Server Actions, keine Route Handler, keine Middleware, kein ISR. Alle dynamischen
  Routen (`/sim/[systemId]`, `/organ/[organId]`) brauchen `generateStaticParams` — bei
  einer bekannten, endlichen Menge an Systemen und Organen unproblematisch.
- Schriften werden über `next/font` zur Bauzeit selbst gehostet, keine externen Requests.
- Ein Wechsel zu Vercel bliebe möglich: `output: 'export'` entfernen, `netlify.toml`
  durch die Vercel-Projektkonfiguration ersetzen.
