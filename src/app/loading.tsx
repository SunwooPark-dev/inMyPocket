export default function Loading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">North Atlanta pilot for older households</p>
          <h1>See which grocery store is cheapest today for your regular basket.</h1>
          <p className="hero__lede">
            Checking today&apos;s prices and comparing the same basket across nearby stores.
          </p>
        </div>
      </section>

      <section className="decision-card loading-card" aria-busy="true">
        <p className="decision-card__eyebrow">Checking today&apos;s answer</p>
        <div className="decision-card__grid">
          <div className="decision-card__content">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--price" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
          <div className="decision-card__support">
            <div className="trust-bar">
              <span className="pill pill--quiet">Public prices only</span>
              <span className="pill pill--quiet">Same basket across stores</span>
              <span className="pill pill--quiet">Checked today</span>
            </div>
            <p className="summary-note">We&apos;re checking today&apos;s basket now.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
