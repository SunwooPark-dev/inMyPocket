import { isAdminAuthorized } from "../../../../../lib/admin-auth.ts";
import { createEvidenceDownloadUrl } from "../../../../../lib/observation-evidence-store.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EvidenceRouteProps = {
  params: Promise<{
    evidenceId: string;
  }>;
};

type EvidenceRouteDeps = {
  isAdminAuthorized: typeof isAdminAuthorized;
  createEvidenceDownloadUrl: typeof createEvidenceDownloadUrl;
};

const defaultDeps: EvidenceRouteDeps = {
  isAdminAuthorized,
  createEvidenceDownloadUrl
};

export async function handleEvidenceDownload(
  evidenceId: string,
  deps: EvidenceRouteDeps = defaultDeps
) {
  if (!(await deps.isAdminAuthorized())) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  try {
    if (!UUID_PATTERN.test(evidenceId)) {
      return Response.json({ error: "Evidence not found." }, { status: 404 });
    }

    const signed = await deps.createEvidenceDownloadUrl(evidenceId);

    if (!signed) {
      return Response.json({ error: "Evidence not found." }, { status: 404 });
    }

    return new Response(null, {
      status: 307,
      headers: {
        Location: signed.url
      }
    });
  } catch {
    return Response.json({ error: "Evidence download failed." }, { status: 500 });
  }
}

export async function GET(_: Request, { params }: EvidenceRouteProps, deps: EvidenceRouteDeps = defaultDeps) {
  const { evidenceId } = await params;
  return handleEvidenceDownload(evidenceId, deps);
}
