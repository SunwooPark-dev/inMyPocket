import Link from "next/link";

export default function FoundingMemberCancelPage() {
  return (
    <main className="page-shell printable-page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <p className="hero__eyebrow">Founding member</p>
          <h1>Checkout canceled</h1>
          <p className="hero__lede">
            No charge was completed. You can return to the dashboard and restart checkout whenever
            you are ready.
          </p>
          <div className="hero__actions">
            <Link className="button" href="/">
              Return home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
