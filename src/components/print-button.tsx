"use client";

export function PrintButton() {
  return (
    <button type="button" className="button button--secondary" onClick={() => window.print()}>
      Print this list
    </button>
  );
}
