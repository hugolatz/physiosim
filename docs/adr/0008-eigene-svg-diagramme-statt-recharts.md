# ADR-0008: Eigene SVG-Diagramme statt Recharts

- Status: angenommen
- Datum: 2026-07-29

## Kontext

Die Vorgabe nennt Recharts oder visx für Diagramme. Gebraucht werden in M2 zwei Dinge:
neun kleine Verlaufskurven (Small Multiples) im Messwertpanel und eine Druck-Volumen-Schleife
im Herzdetail. Beide zeichnen jeweils einen einzelnen Pfad mit optional hinterlegtem
Normbereich.

## Entscheidung

Die Diagramme werden direkt als SVG gezeichnet, ohne Diagrammbibliothek.

## Begründung

- Der Bedarf ist ein Polyline-Pfad plus ein Rechteck für den Normbereich. Recharts brächte
  dafür mehrere hundert Kilobyte in ein Bündel, das laut Definition of Done unter zwei
  Sekunden laden soll.
- Die gesamte Darstellung des Projekts hängt an den Design-Tokens
  (`var(--color-arterial)` und Geschwister) und muss Hell- und Dunkelmodus ohne
  JavaScript-Farbmischung mitmachen. Direktes SVG nimmt CSS-Variablen einfach an; bei einer
  Diagrammbibliothek kämpft man dagegen an.
- Die Ganzkörper- und Nephronansicht sind ohnehin handgeschriebenes SVG. Ein zweites,
  fremdes Zeichenmodell daneben hätte zwei Formensprachen ergeben.
- Der statische Export und die strenge CSP vertragen keine externen Ressourcen; weniger
  Abhängigkeiten heißt hier auch weniger Angriffsfläche.

## Konsequenzen

- Achsen, Legenden und Zoom müssen selbst geschrieben werden, falls sie später gebraucht
  werden. Für das Guyton-Diagramm (M3) ist das eingeplant und unkritisch — es ist ein
  Schnittpunkt zweier Kurven.
- Sollte je ein Diagramm mit Interaktion (Tooltip-Verfolgung, Brushing, Zoom) nötig werden,
  ist diese Entscheidung neu zu bewerten. Dann käme visx in Frage, weil es sich auf
  Primitive beschränkt und nicht auf fertige Diagrammtypen.
