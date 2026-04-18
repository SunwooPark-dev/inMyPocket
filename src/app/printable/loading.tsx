export default function PrintableLoading() {
  return (
    <main className="page-shell printable-page">
      <section className="print-header">
        <div className="print-summary" aria-busy="true">
          <p className="hero__eyebrow">Large-print shopping list</p>
          <h1>Preparing your grocery plan</h1>
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </section>

      <section className="print-list" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="print-item">
            <div className="print-item__checkbox" />
            <div className="print-item__content">
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
