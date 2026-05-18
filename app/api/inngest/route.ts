import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { inngestFunctions } from "@/inngest/functions";

/**
 * Inngest serve handler. Exposes GET (introspection), POST (run), PUT (sync).
 * In production the Inngest cloud invokes this URL; in dev the Inngest CLI
 * (`npx inngest-cli dev`) does. When INNGEST_SIGNING_KEY is set, requests
 * are HMAC-verified by the serve adapter.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
