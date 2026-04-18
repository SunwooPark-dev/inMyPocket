import Link from "next/link";

export default function FoundingMemberSuccessPage() {
  return (
    <main className="page-shell printable-page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <p className="hero__eyebrow">Membership lane inactive</p>
          <h1>Payment checkout is not active</h1>
          <p className="hero__lede">
            This project currently operates on a non-payment model while donation and advertising support are being considered.
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
