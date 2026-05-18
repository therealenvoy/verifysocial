import { InboxShell } from "@/components/inbox/inbox-shell";
import {
  getConversations,
  getCreatorForClerkUser,
  type ConversationListItem,
} from "@/lib/queries";
import { logger } from "@/lib/logger";

// The inbox is per-user state; static prerendering would leak one creator's
// queue to another. Force-dynamic also lets us read auth headers at request
// time without disabling Next 15's caching elsewhere.
export const dynamic = "force-dynamic";

interface LoadResult {
  conversations: ConversationListItem[];
  errorMessage?: string;
}

async function loadInbox(): Promise<LoadResult> {
  let clerkUserId: string | null = null;
  try {
    // Clerk auth is wired in PR 3; until then the import may be unavailable
    // depending on env. Resolve dynamically and tolerate the failure path.
    const mod = await import("@clerk/nextjs/server").catch(() => null);
    if (mod && process.env.CLERK_SECRET_KEY) {
      const result = await mod.auth();
      clerkUserId = result.userId ?? null;
    }
  } catch (err) {
    logger.warn("inbox.auth_unavailable", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (!clerkUserId) {
    return {
      conversations: [],
      errorMessage:
        "Sign in to see conversations. Authentication wires up in PR 3.",
    };
  }

  try {
    const creator = await getCreatorForClerkUser(clerkUserId);
    if (!creator) {
      return {
        conversations: [],
        errorMessage:
          "No creator linked to this account yet. Connect a Fansly profile to populate the queue.",
      };
    }

    const conversations = await getConversations(creator.id);
    return { conversations };
  } catch (err) {
    logger.error("inbox.load_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      conversations: [],
      errorMessage:
        "Could not load conversations. Retry, or check the Railway logs if this persists.",
    };
  }
}

export default async function InboxPage() {
  const { conversations, errorMessage } = await loadInbox();
  return <InboxShell conversations={conversations} errorMessage={errorMessage} />;
}
