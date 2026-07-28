import Link from 'next/link';
import { Disclaimer } from '@/components/learn/Disclaimer';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-4">
        <p
          className="text-xs tracking-[0.2em] uppercase"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          Meilenstein M1 — Simulationskern
        </p>
        <h1
          className="text-5xl leading-tight font-semibold"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          PhysioSim
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-ink-muted)' }}>
          Physiologie als System: ein Parameter ändert sich, und der ganze Körper antwortet.
          Animation, Messwerte, Kurven und Erklärung stammen aus einem einzigen Rechenmodell.
        </p>
      </header>

      <nav className="flex flex-wrap gap-3">
        <Link
          href="/debug"
          className="rounded-sm px-5 py-3 text-sm font-medium transition-colors"
          style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
        >
          Simulationskern öffnen
        </Link>
      </nav>

      <section
        className="grid gap-6 border-t pt-8 text-sm sm:grid-cols-3"
        style={{ borderColor: 'var(--color-rule)' }}
      >
        {[
          {
            color: 'var(--color-arterial)',
            title: 'Kreislauf',
            body: 'Frank-Starling, Barorezeptorreflex, peripherer Widerstand.',
          },
          {
            color: 'var(--color-filtrate)',
            title: 'Niere',
            body: 'Zwei Nieren, Autoregulation, Tubulussegmente, Druck-Natriurese.',
          },
          {
            color: 'var(--color-signal)',
            title: 'RAAS',
            body: 'Renin, Angiotensin II, Aldosteron, ADH und ANP.',
          },
        ].map((item) => (
          <article key={item.title} className="space-y-2">
            <span
              className="block h-1 w-10 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <h2 className="font-medium">{item.title}</h2>
            <p style={{ color: 'var(--color-ink-muted)' }}>{item.body}</p>
          </article>
        ))}
      </section>

      <Disclaimer />
    </main>
  );
}
