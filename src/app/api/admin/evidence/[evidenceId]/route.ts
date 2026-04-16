import { NextResponse } from "next/server";

import { isAdminAuthorized } from "../../../../../lib/admin-auth";
import { createEvidenceDownloadUrl } from "../../../../../lib/server-storage";

type EvidenceRouteProps = {
  params: Promise<{
    evidenceId: string;
  }>;
};

export async function GET(_: Request, { params }: EvidenceRouteProps) {
  if (!(await isAdminAuthorized())) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  const { evidenceId } = await params;
  const signed = await createEvidenceDownloadUrl(evidenceId);

  if (!signed) {
    return Response.json({ error: "Evidence not found." }, { status: 404 });
  }

  return NextResponse.redirect(signed.url);
}
