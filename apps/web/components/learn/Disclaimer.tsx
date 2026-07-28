/**
 * Required on every simulation page (Definition of Done Nr. 7).
 */
export function Disclaimer() {
  return (
    <aside
      role="note"
      className="rounded-sm border-l-2 px-4 py-3 text-sm"
      style={{
        borderColor: 'var(--color-arterial)',
        backgroundColor: 'var(--color-paper-raised)',
        color: 'var(--color-ink-muted)',
      }}
    >
      <strong style={{ color: 'var(--color-ink)' }}>Didaktisches Modell.</strong> PhysioSim ist
      stark vereinfacht und dient ausschließlich dem Lernen. Es ist{' '}
      <strong style={{ color: 'var(--color-ink)' }}>nicht</strong> für die Patientenversorgung
      bestimmt und ersetzt weder Lehrbuch, Leitlinie noch ärztliche Entscheidung.
    </aside>
  );
}
