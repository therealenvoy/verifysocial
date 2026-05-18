import { InboxShell } from "@/components/inbox/inbox-shell";
import {
  getConversations,
  getCreatorForClerkUser,
  getConversationDetail,
  getMessages,
  type ConversationListItem,
  type MessageItem,
} from "@/lib/queries";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface LoadResult {
  conversations: ConversationListItem[];
  messages: MessageItem[];
  selectedId?: string;
  errorMessage?: string;
}

async function loadConversationView(conversationId: string): Promise<LoadResult> {
  let clerkUserId: string | null = null;
  try {
    const mod = await import("@clerk/nextjs/server").catch(() => null);
    if (mod && process.env.CLERK_SECRET_KEY) {
      const result = await mod.auth();
      clerkUserId = result.userId ?? null;
    }
  } catch (err) {
    logger.warn("inbox.detail.auth_unavailable", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (!clerkUserId) {
    return {
      conversations: [],
      messages: [],
      errorMessage: "Sign in to view conversations.",
    };
  }

  try {
    const creator = await getCreatorForClerkUser(clerkUserId);
    if (!creator) {
      return {
        conversations: [],
        messages: [],
        errorMessage: "No creator linked to this account.",
      };
    }
    const [conversations, detail, messages] = await Promise.all([
      getConversations(creator.id),
      getConversationDetail(conversationId),
      getMessages(conversationId),
    ]);

    if (!detail || detail.creatorId !== creator.id) {
      return {
        conversations,
        messages: [],
        errorMessage: "Conversation not found or not owned by this creator.",
      };
    }

    return {
      conversations,
      messages,
      selectedId: detail.id,
    };
  } catch (err) {
    logger.error("inbox.detail.load_failed", {
      conversationId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      conversations: [],
      messages: [],
      errorMessage: "Could not load conversation. Retry shortly.",
    };
  }
}

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const { conversations, messages, selectedId, errorMessage } =
    await loadConversationView(conversationId);

  return (
    <InboxShell
      conversations={conversations}
      initialMessages={messages}
      initialConversationId={selectedId}
      errorMessage={errorMessage}
    />
  );
}
