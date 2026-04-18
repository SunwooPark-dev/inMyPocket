import {
  createFoundingMemberSignup,
  findLatestFoundingMemberSignupByIdentity,
  updateFoundingMemberSignup
} from "../../../lib/server-storage";
import { captureWeeklyUpdatesLead } from "../../../lib/waitlist";

type WaitlistPayload = {
  email?: string;
  zipCode?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as WaitlistPayload | null;
  const result = await captureWeeklyUpdatesLead(payload ?? {}, {
    findLatestFoundingMemberSignupByIdentity,
    createFoundingMemberSignup,
    updateFoundingMemberSignup
  });

  if (result.ok === false) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ message: result.message }, { status: result.status });
}
