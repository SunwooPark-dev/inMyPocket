import Link from "next/link";

export default function FoundingMemberSuccessPage() {
  return (
    <main className="page-shell printable-page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <p className="hero__eyebrow">Founding member</p>
          <h1>Payment received</h1>
          <p className="hero__lede">
            Your payment was submitted. We will confirm founding member access by email after the
            payment processor finishes status updates.
          </p>
          <div className="hero__actions">
            <Link className="button" href="/">
              Back to dashboard
            </Link>
            <Link className="button button--secondary" href="/printable">
              Open printable list
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
