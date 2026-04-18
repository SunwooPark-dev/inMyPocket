import { randomUUID } from "node:crypto";

import { getSupabaseServiceClient } from "./supabase.ts";
import type { ObservationEvidence } from "./domain.ts";

const EVIDENCE_BUCKET = "observation-evidence";

export type EvidenceUploadInput = {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  byteSize: number;
};

type EvidenceRecord = Record<string, unknown>;

function requireSupabase() {
  const client = getSupabaseServiceClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  return client;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

function mapEvidenceRecord(record: EvidenceRecord): ObservationEvidence {
  return {
    id: String(record.id),
    storagePath: String(record.storage_path),
    originalName: String(record.original_name),
    contentType: String(record.content_type),
    byteSize: Number(record.byte_size),
    uploadedAt: new Date(String(record.uploaded_at)).toISOString()
  };
}

export async function fetchEvidenceMap(evidenceIds: string[]) {
  if (evidenceIds.length === 0) {
    return new Map<string, ObservationEvidence>();
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("observation_evidence")
    .select("*")
    .in("id", evidenceIds);

  if (error) {
    throw new Error(`Failed to fetch observation evidence: ${error.message}`);
  }

  return new Map<string, ObservationEvidence>(
    ((data ?? []) as unknown[]).map((record: unknown) => {
      const evidence = mapEvidenceRecord(record as EvidenceRecord);
      return [evidence.id, evidence] as const;
    })
  );
}

export async function uploadEvidenceFile(file: EvidenceUploadInput) {
  const supabase = requireSupabase();
  const evidenceId = randomUUID();
  const storagePath = `manual-observations/${new Date().toISOString().slice(0, 10)}/${evidenceId}-${sanitizeFilename(file.originalName)}`;

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.contentType,
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload evidence: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from("observation_evidence")
    .insert({
      id: evidenceId,
      storage_path: storagePath,
      original_name: file.originalName,
      content_type: file.contentType,
      byte_size: file.byteSize
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([storagePath]);
    throw new Error(`Failed to save evidence metadata: ${error.message}`);
  }

  return mapEvidenceRecord(data as EvidenceRecord);
}

export async function deleteEvidenceById(evidence: ObservationEvidence) {
  const supabase = requireSupabase();
  await supabase.storage.from(EVIDENCE_BUCKET).remove([evidence.storagePath]);
  await supabase.from("observation_evidence").delete().eq("id", evidence.id);
}

export async function createEvidenceDownloadUrl(evidenceId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("observation_evidence")
    .select("*")
    .eq("id", evidenceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch evidence metadata: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const evidence = mapEvidenceRecord(data as EvidenceRecord);
  const { data: signed, error: signedError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(evidence.storagePath, 60);

  if (signedError) {
    throw new Error(`Failed to create signed evidence URL: ${signedError.message}`);
  }

  return {
    evidence,
    url: signed.signedUrl
  };
}
