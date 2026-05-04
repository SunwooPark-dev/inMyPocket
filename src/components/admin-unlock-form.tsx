"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { adminUnlockRateLimitPolicy } from "../lib/admin-rate-limit";
import {
  formatAdminUnlockFeedback,
  type AdminUnlockErrorPayload
} from "../lib/admin-unlock-feedback";

type AdminUnlockFormProps = {
  unlocked: boolean;
};

export function AdminUnlockForm({ unlocked }: AdminUnlockFormProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/admin/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as AdminUnlockErrorPayload | null;
      setStatus("error");
      setMessage(formatAdminUnlockFeedback(payload));
      return;
    }

    setToken("");
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  if (unlocked) {
    return (
      <div className="hero__actions">
        <span className="pill pill--good">Admin unlocked</span>
        <button type="button" className="button button--secondary" onClick={handleLogout}>
          Lock admin
        </button>
      </div>
    );
  }

  return (
    <form className="waitlist-form" onSubmit={handleUnlock}>
      <label>
        Admin access token
        <input
          type="password"
          autoComplete="current-password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
        />
      </label>

      <button type="submit" className="button" disabled={status === "saving"}>
        {status === "saving" ? "Unlocking..." : "Unlock admin"}
      </button>

      <p className="hero__lede">
        {adminUnlockRateLimitPolicy.maxAttempts} failed attempts in{" "}
        {Math.floor(adminUnlockRateLimitPolicy.windowMs / 60000)} minutes trigger a{" "}
        {Math.floor(adminUnlockRateLimitPolicy.lockoutMs / 60000)}-minute lockout in this local runtime.
      </p>
      {message ? <p className="form-message form-message--error">{message}</p> : null}
    </form>
  );
}
