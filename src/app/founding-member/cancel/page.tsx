import Link from "next/link";

export default function FoundingMemberCancelPage() {
  return (
    <main className="page-shell printable-page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <p className="hero__eyebrow">Membership lane inactive</p>
          <h1>Payment checkout is not active</h1>
          <p className="hero__lede">
            No payment flow is currently offered. Return to the dashboard to keep using weekly updates and the price comparison experience.
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
