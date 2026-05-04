import { ReactNode } from "react";

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  variant?: "primary" | "secondary" | "support";
  children: ReactNode;
};

export function SectionCard({
  eyebrow,
  title,
  variant = "secondary",
  children
}: SectionCardProps) {
  return (
    <section className={`section-card section-card--${variant}`}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  );
}
