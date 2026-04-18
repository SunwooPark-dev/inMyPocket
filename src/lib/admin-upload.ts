const MAX_EVIDENCE_BYTES = 6 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

export function validateEvidenceFileDescriptor(file: {
  size: number;
  type: string;
}) {
  if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
    return "Evidence file type is not allowed.";
  }

  if (file.size > MAX_EVIDENCE_BYTES) {
    return "Evidence file exceeds the 6MB limit.";
  }

  return null;
}

export const evidenceUploadPolicy = {
  maxBytes: MAX_EVIDENCE_BYTES,
  allowedTypes: Array.from(ALLOWED_EVIDENCE_TYPES)
};
