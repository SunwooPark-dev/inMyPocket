"use client";

import Link from "next/link";

type PrintableErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PrintableError({ reset }: PrintableErrorProps) {
  return (
    <main className="page-shell printable-page">
      <section className="print-header">
        <div className="print-summary">
          <p className="hero__eyebrow">Large-print shopping list</p>
          <h1>We couldn’t prepare your grocery plan.</h1>
          <p className="print-summary__stat">Please try again in a moment.</p>
        </div>

        <div className="hero__actions">
          <button className="button" type="button" onClick={() => reset()}>
            Try again
          </button>
          <Link className="button button--secondary" href="/">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
