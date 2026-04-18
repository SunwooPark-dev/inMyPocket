"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import {
  getWaitlistIntroCopy,
  getWaitlistSubmitLabel,
  getWaitlistTrustPoints,
  normalizeWaitlistMessage,
  type WaitlistAudience
} from "../lib/waitlist-form-content";
import { buildWaitlistEventDetail, trackWaitlistEvent } from "../lib/waitlist-events";
import { buildWaitlistSubmissionRequest } from "../lib/waitlist";

type WaitlistFormProps = {
  defaultZip: string;
  checkoutEnabled: boolean;
};

export function WaitlistForm({ defaultZip, checkoutEnabled }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState(defaultZip);
  const [audience, setAudience] = useState<WaitlistAudience>("self");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;
    trackWaitlistEvent(
      buildWaitlistEventDetail({
        eventType: "viewed",
        checkoutEnabled,
        audience,
        zipCode
      })
    );
  }, [audience, checkoutEnabled, zipCode]);

  function handleAudienceChange(nextAudience: WaitlistAudience) {
    setAudience(nextAudience);
    trackWaitlistEvent(
      buildWaitlistEventDetail({
        eventType: "audience_selected",
        checkoutEnabled,
        audience: nextAudience,
        zipCode,
        email
      })
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("saving");
    setMessage("");
    trackWaitlistEvent(
      buildWaitlistEventDetail({
        eventType: "submit_started",
        checkoutEnabled,
        audience,
        zipCode,
        email
      })
    );

    const submission = buildWaitlistSubmissionRequest({
      checkoutEnabled,
      email,
      zipCode
    });

    const response = await fetch(submission.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(submission.body)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      const normalizedMessage = normalizeWaitlistMessage(
        payload?.error ?? "We couldn’t start that yet. Please try again."
      );
      setStatus("error");
      setMessage(normalizedMessage);
      trackWaitlistEvent(
        buildWaitlistEventDetail({
          eventType: "submit_failed",
          checkoutEnabled,
          audience,
          zipCode,
          email,
          errorMessage: normalizedMessage
        })
      );
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { checkoutUrl?: string; message?: string }
      | null;

    if (submission.expectsCheckoutUrl) {
      if (!payload?.checkoutUrl) {
        const fallbackMessage = "We couldn’t start that yet. Please try again.";
        setStatus("error");
        setMessage(fallbackMessage);
        trackWaitlistEvent(
          buildWaitlistEventDetail({
            eventType: "submit_failed",
            checkoutEnabled,
            audience,
            zipCode,
            email,
            errorMessage: fallbackMessage
          })
        );
        return;
      }

      trackWaitlistEvent(
        buildWaitlistEventDetail({
          eventType: "submit_succeeded",
          checkoutEnabled,
          audience,
          zipCode,
          email
        })
      );
      window.location.assign(payload.checkoutUrl);
      return;
    }

    const successMessage = payload?.message ?? "You’re signed up for weekly updates.";
    setStatus("done");
    setMessage(successMessage);
    trackWaitlistEvent(
      buildWaitlistEventDetail({
        eventType: "submit_succeeded",
        checkoutEnabled,
        audience,
        zipCode,
        email
      })
    );
  }

  const trustPoints = getWaitlistTrustPoints(audience);

  return (
    <form className="waitlist-form" onSubmit={handleSubmit}>
      <div className="toolbar__group">
        <span className="toolbar__label">Who are these updates for?</span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${audience === "self" ? "chip--active" : ""}`}
            aria-pressed={audience === "self"}
            onClick={() => handleAudienceChange("self")}
          >
            For me
          </button>
          <button
            type="button"
            className={`chip ${audience === "caregiver" ? "chip--active" : ""}`}
            aria-pressed={audience === "caregiver"}
            onClick={() => handleAudienceChange("caregiver")}
          >
            I shop for someone else
          </button>
        </div>
      </div>

      <p className="waitlist-form__intro">{getWaitlistIntroCopy(checkoutEnabled, audience)}</p>

      <ul className="compact-list compact-list--wide">
        {trustPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <label>
        Email
        <input
          type="email"
          inputMode="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        ZIP code
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{5}"
          value={zipCode}
          onChange={(event) => setZipCode(event.target.value)}
          required
        />
      </label>

      <button type="submit" className="button" disabled={status === "saving"}>
        {getWaitlistSubmitLabel(status)}
      </button>

      {message ? (
        <p className={status === "error" ? "form-message form-message--error" : "form-message"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
