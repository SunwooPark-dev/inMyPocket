"use client";

import Link from "next/link";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ reset }: RootErrorProps) {
  return (
    <main className="page-shell">
      <section className="hero hero--compact">
        <div className="hero__content">
          <p className="hero__eyebrow">North Atlanta pilot for older households</p>
          <h1>We couldn’t load today’s grocery comparison.</h1>
          <p className="hero__lede">
            Please try again in a moment. You can still open the large-text shopping list while we
            refresh this view.
          </p>
          <div className="hero__actions">
            <button className="button" type="button" onClick={() => reset()}>
              Try again
            </button>
            <Link className="button button--secondary" href="/printable">
              Print a large-text shopping list
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
