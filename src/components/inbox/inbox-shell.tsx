"use client";

/**
 * Inbox shell — Client Component that owns the three-column layout and the
 * per-session selection state. All data arrives via props from the Server
 * Component at app/inbox/page.tsx; this component holds no hard-coded
 * conversations, profiles, or threads.
 *
 * Phase 1 keeps the visual register (dark glass, gradient avatars, status
 * chips) but drops the bespoke profile data that the original 879-line
 * mockup carried. Fan intelligence renders from real fan_profile fields
 * when present, with explicit empty states otherwise.
 */

import { useMemo, useState } from "react";
import {
  Bot,
  ChevronRight,
  Filter,
  Inbox as InboxIcon,
  LockKeyhole,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConversationListItem, MessageItem } from "@/lib/queries";

type AiMode = "Draft Only" | "Auto Low Risk" | "Sandbox";

const STATUS_TONE: Record<string, string> = {
  active: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  archived: "border-slate-300/25 bg-slate-300/10 text-slate-300",
  blocked: "border-rose-300/25 bg-rose-300/10 text-rose-200",
};

const AVATAR_GRADIENTS = [
  "from-sky-400 to-blue-600",
  "from-emerald-300 to-teal-600",
  "from-violet-300 to-fuchsia-600",
  "from-amber-300 to-orange-500",
  "from-rose-300 to-red-700",
] as const;

function avatarTone(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function relativeTime(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export interface InboxShellProps {
  /** Conversation list from `getConversations(creatorId)`. */
  conversations: ConversationListItem[];
  /** Messages for the initially-selected conversation (if any). */
  initialMessages?: MessageItem[];
  /** Pre-selected conversation id from a route param like /inbox/<id>. */
  initialConversationId?: string;
  /** When set, renders an unrecoverable-error banner above the queue. */
  errorMessage?: string;
}

export function InboxShell({
  conversations,
  initialMessages = [],
  initialConversationId,
  errorMessage,
}: InboxShellProps) {
  const [aiMode, setAiMode] = useState<AiMode>("Draft Only");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId ?? conversations[0]?.id ?? null,
  );

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  return (
    <main className="relative h-screen overflow-hidden bg-[#05070d] text-[#f4f7fb]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(59,130,246,0.18),transparent)]" />
      <div className="relative z-10 flex h-full flex-col">
        <TopBar />
        {errorMessage ? (
          <div className="mx-3 mt-3 rounded-2xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <section className="hidden min-h-0 flex-1 grid-cols-[340px_minmax(520px,1fr)_380px] gap-3 p-3 xl:grid 2xl:grid-cols-[370px_minmax(620px,1fr)_420px]">
          <PriorityQueue
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <ConversationCanvas
            selected={selected}
            messages={selected && selected.id === initialConversationId ? initialMessages : []}
            aiMode={aiMode}
            onModeChange={setAiMode}
          />
          <FanIntelligence selected={selected} />
        </section>

        <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 xl:hidden">
          <MobileQueue
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <ConversationCanvas
            selected={selected}
            messages={selected && selected.id === initialConversationId ? initialMessages : []}
            aiMode={aiMode}
            onModeChange={setAiMode}
            compact
          />
          <FanIntelligence selected={selected} compact />
        </section>
      </div>
    </main>
  );
}

function TopBar() {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 backdrop-blur-2xl md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          <Sparkles className="h-5 w-5 text-sky-200" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-white">
            Inbox
          </p>
          <p className="truncate text-xs text-slate-400">
            Real conversations · drafts surface beneath
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusChip icon={Bot} label="AI Online" tone="sky" />
        <StatusChip icon={ShieldCheck} label="Safety Clean" tone="emerald" />
      </div>
    </header>
  );
}

function PriorityQueue({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_20px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
      <div className="border-b border-white/10 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Priority Queue
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {conversations.length} active
            </h2>
          </div>
          <button
            type="button"
            aria-label="Filter queue"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/10"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-4 flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm text-slate-400">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-500"
            placeholder="Find fan or signal"
          />
        </label>
      </div>

      <div className="h-full min-h-0 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <EmptyQueue />
        ) : (
          conversations.map((conversation) => (
            <QueueRow
              key={conversation.id}
              conversation={conversation}
              selected={conversation.id === selectedId}
              onSelect={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function EmptyQueue() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
        <InboxIcon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-white">No conversations yet</p>
      <p className="text-xs text-slate-400">
        When fans message your connected Fansly account, they appear here.
      </p>
    </div>
  );
}

function QueueRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ConversationListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const fanLabel = conversation.fanName ?? "Unknown fan";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group mb-2 w-full rounded-[22px] border p-3 text-left transition duration-200",
        selected
          ? "border-sky-300/35 bg-sky-300/[0.10] shadow-[0_0_0_1px_rgba(125,211,252,0.10),0_18px_44px_rgba(14,165,233,0.10)]"
          : "border-white/0 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.055]",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar seed={conversation.fanId} label={fanLabel} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white">{fanLabel}</p>
            <span className="shrink-0 text-xs text-slate-500">
              {relativeTime(conversation.lastMessageAt ?? conversation.updatedAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>{conversation.platform}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>{formatCents(conversation.totalSpentCents)}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>{conversation.lifecycleStage}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-slate-300">
            {conversation.lastMessagePreview ?? "No messages yet"}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-1 text-[11px]",
                STATUS_TONE[conversation.status] ?? "border-white/10 bg-white/[0.05] text-slate-300",
              )}
            >
              {conversation.status}
            </span>
            {selected ? <ChevronRight className="h-4 w-4 text-sky-200" /> : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function MobileQueue({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-3 backdrop-blur-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority Queue</p>
          <h2 className="text-lg font-semibold text-white">Active fans</h2>
        </div>
        <StatusChip icon={Bot} label="Online" tone="sky" />
      </div>
      {conversations.length === 0 ? (
        <EmptyQueue />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {conversations.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "min-w-[220px] rounded-2xl border p-3 text-left",
                conversation.id === selectedId
                  ? "border-sky-300/35 bg-sky-300/10"
                  : "border-white/10 bg-black/20",
              )}
            >
              <div className="flex items-center gap-2">
                <Avatar seed={conversation.fanId} label={conversation.fanName ?? ""} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {conversation.fanName ?? "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatCents(conversation.totalSpentCents)} spent
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationCanvas({
  selected,
  messages,
  aiMode,
  onModeChange,
  compact = false,
}: {
  selected: ConversationListItem | null;
  messages: MessageItem[];
  aiMode: AiMode;
  onModeChange: (mode: AiMode) => void;
  compact?: boolean;
}) {
  if (!selected) {
    return (
      <section className="flex min-h-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-10 text-center text-slate-400 backdrop-blur-2xl">
        <div>
          <p className="text-sm font-semibold text-white">No conversation selected</p>
          <p className="mt-2 text-xs">Pick a fan from the queue to start drafting.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-[0_20px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar seed={selected.fanId} label={selected.fanName ?? ""} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-white">
              {selected.fanName ?? "Unknown fan"}
            </h1>
            <p className="truncate text-xs text-slate-400">
              {selected.platform} · {formatCents(selected.totalSpentCents)} spent · {selected.lifecycleStage}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="More actions"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/10"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className={cn("grid min-h-0", compact ? "grid-cols-1" : "h-[calc(100%-73px)] grid-rows-[1fr_auto]")}>
        <div className="min-h-0 space-y-4 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-6 text-center text-sm text-slate-400">
              Open the conversation route to load the full thread.
            </div>
          ) : (
            messages.map((m) => <MessageRow key={m.id} message={m} />)
          )}
        </div>

        <div className="border-t border-white/10 bg-black/20 p-4 backdrop-blur-xl md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                AI Draft Surface
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                Reply mode
              </h2>
            </div>
            <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-1">
              {(["Draft Only", "Auto Low Risk", "Sandbox"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                    aiMode === mode
                      ? "bg-sky-300 text-slate-950"
                      : "text-slate-400 hover:bg-white/10 hover:text-slate-100",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ActionButton icon={Send} label="Send draft" primary />
            <ActionButton icon={ShieldCheck} label="Mark safe" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MessageRow({ message }: { message: MessageItem }) {
  const isAi = message.role === "ai_assistant";
  return (
    <div className={cn("flex", isAi ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[760px]", isAi ? "ml-8" : "mr-8")}>
        <div
          className={cn(
            "rounded-[24px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]",
            isAi
              ? "border-sky-200/18 bg-sky-300/[0.08]"
              : "border-white/10 bg-white/[0.055]",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-300">
              {isAi ? "AI Draft" : message.role}
            </span>
            <span className="text-xs text-slate-500">{relativeTime(message.createdAt)}</span>
          </div>
          <p className="text-[15px] leading-7 text-slate-100">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

function FanIntelligence({
  selected,
  compact = false,
}: {
  selected: ConversationListItem | null;
  compact?: boolean;
}) {
  if (!selected) {
    return (
      <aside className={cn("min-h-0", compact ? "" : "pr-1")}>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-slate-400 shadow-[0_20px_80px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Fan Intelligence</p>
          <p className="mt-3 text-sm">Select a fan to view spend, lifecycle, and memory.</p>
        </section>
      </aside>
    );
  }

  return (
    <aside className={cn("min-h-0 space-y-3 overflow-y-auto", compact ? "" : "pr-1")}>
      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Fan Intelligence
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {selected.fanName ?? "Unknown"}
            </h2>
            <p className="text-xs text-slate-400">{selected.platform}</p>
          </div>
          <button
            type="button"
            aria-label="Open fan profile"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/10"
          >
            <UserRound className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ValueTile label="Total spent" value={formatCents(selected.totalSpentCents)} />
          <ValueTile label="Lifecycle" value={selected.lifecycleStage} />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Controls</h3>
          <LockKeyhole className="h-4 w-4 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">
          Memory timeline and offer engine arrive in Phase 2 (RAG + persona tuning).
        </p>
      </section>
    </aside>
  );
}

function Avatar({
  seed,
  label,
  size = "md",
}: {
  seed: string;
  label: string;
  size?: "sm" | "md";
}) {
  const tone = avatarTone(seed);
  const initial = (label ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]",
        tone,
        size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-base",
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function StatusChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: "sky" | "emerald";
}) {
  return (
    <span
      className={cn(
        "hidden items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium backdrop-blur-xl sm:flex",
        tone === "sky"
          ? "border-sky-300/20 bg-sky-300/10 text-sky-100"
          : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function ValueTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  primary = false,
}: {
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition",
        primary
          ? "bg-sky-300 text-slate-950 hover:bg-sky-200"
          : "border border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
