import test from "node:test";
import assert from "node:assert/strict";

import { GET, handleEvidenceDownload } from "../src/app/api/admin/evidence/[evidenceId]/route.ts";

const VALID_EVIDENCE_ID = "11111111-1111-4111-8111-111111111111";

test("admin evidence download rejects unauthorized requests with 401", async () => {
  let storeCalls = 0;

  const response = await handleEvidenceDownload(VALID_EVIDENCE_ID, {
    isAdminAuthorized: async () => false,
    createEvidenceDownloadUrl: async () => {
      storeCalls += 1;
      return { evidence: null as never, url: "https://signed.example.com/evidence" };
    }
  });

  assert.equal(response.status, 401);
  assert.equal(storeCalls, 0);
  assert.deepEqual(await response.json(), { error: "Admin access required." });
});

test("admin evidence download hides malformed evidence ids behind 404", async () => {
  let storeCalls = 0;

  const response = await handleEvidenceDownload("not-a-uuid", {
    isAdminAuthorized: async () => true,
    createEvidenceDownloadUrl: async () => {
      storeCalls += 1;
      return { evidence: null as never, url: "https://signed.example.com/evidence" };
    }
  });

  assert.equal(response.status, 404);
  assert.equal(storeCalls, 0);
  assert.deepEqual(await response.json(), { error: "Evidence not found." });
});

test("admin evidence download returns 404 when the evidence row is missing", async () => {
  const response = await handleEvidenceDownload(VALID_EVIDENCE_ID, {
    isAdminAuthorized: async () => true,
    createEvidenceDownloadUrl: async () => null
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Evidence not found." });
});

test("admin evidence download returns a 307 redirect with the signed location", async () => {
  const response = await handleEvidenceDownload(VALID_EVIDENCE_ID, {
    isAdminAuthorized: async () => true,
    createEvidenceDownloadUrl: async () => ({
      evidence: {
        id: VALID_EVIDENCE_ID,
        storagePath: "manual/receipt.jpg",
        originalName: "receipt.jpg",
        contentType: "image/jpeg",
        byteSize: 1024,
        uploadedAt: "2026-04-19T00:00:00.000Z"
      },
      url: "https://signed.example.com/manual/receipt.jpg"
    })
  });

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("Location"), "https://signed.example.com/manual/receipt.jpg");
});

test("admin evidence download maps storage or signing failures to 500", async () => {
  const response = await handleEvidenceDownload(VALID_EVIDENCE_ID, {
    isAdminAuthorized: async () => true,
    createEvidenceDownloadUrl: async () => {
      throw new Error("signed url creation failed");
    }
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Evidence download failed."
  });
});

test("GET unwraps promised params and delegates to the same route contract", async () => {
  const response = await GET(new Request("https://example.com/api/admin/evidence"), {
    params: Promise.resolve({ evidenceId: VALID_EVIDENCE_ID })
  }, {
    isAdminAuthorized: async () => true,
    createEvidenceDownloadUrl: async () => ({
      evidence: {
        id: VALID_EVIDENCE_ID,
        storagePath: "manual/receipt.jpg",
        originalName: "receipt.jpg",
        contentType: "image/jpeg",
        byteSize: 1024,
        uploadedAt: "2026-04-19T00:00:00.000Z"
      },
      url: "https://signed.example.com/manual/receipt.jpg"
    })
  });

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("Location"), "https://signed.example.com/manual/receipt.jpg");
});
