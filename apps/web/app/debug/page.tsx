import type { Metadata } from 'next';
import { DebugSimulator } from '@/components/controls/DebugSimulator';
import { Disclaimer } from '@/components/learn/Disclaimer';

export const metadata: Metadata = {
  title: 'Simulationskern — PhysioSim',
  description: 'Regler und Messwerte des kardiorenalen Modells (Meilenstein M1).',
};

export default function DebugPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
          Simulationskern
        </h1>
        <p className="max-w-3xl text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          Meilenstein M1: Regler links, Messwerte rechts. Die Oberfläche ist absichtlich schlicht —
          die Ganzkörperansicht kommt in M2. Jeder Wert hier stammt aus dem Rechenmodell, nicht aus
          einer Tabelle.
        </p>
      </header>
      <DebugSimulator />
      <div className="mt-8">
        <Disclaimer />
      </div>
    </main>
  );
}
