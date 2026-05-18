'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Brain,
  Check,
  ChevronRight,
  CircleDollarSign,
  Command,
  Eye,
  Filter,
  Gift,
  LockKeyhole,
  MoreHorizontal,
  Pause,
  Radar,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Wand2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConversationStatus = 'live' | 'review' | 'safe' | 'blocked';

type Conversation = {
  id: string;
  fanName: string;
  handle: string;
  platform: string;
  lastMessage: string;
  timestamp: string;
  spend: number;
  lifetimeValue: number;
  lifecycle: string;
  status: ConversationStatus;
  priority: string;
  score: number;
  avatarTone: string;
};

type AiMode = 'Draft Only' | 'Auto Low Risk' | 'Sandbox';

const conversations: Conversation[] = [
  {
    id: '1',
    fanName: 'Alex Johnson',
    handle: '@alexj',
    platform: 'Fansly',
    lastMessage: 'Loved your latest post. Can you make a custom video?',
    timestamp: '2 min',
    spend: 245,
    lifetimeValue: 520,
    lifecycle: 'High intent',
    status: 'live',
    priority: 'Needs approval',
    score: 92,
    avatarTone: 'from-sky-400 to-blue-600',
  },
  {
    id: '2',
    fanName: 'Sam Rivera',
    handle: '@samr',
    platform: 'OnlyFans',
    lastMessage: 'Thanks for the reply. Buying the PPV now.',
    timestamp: '1h',
    spend: 89,
    lifetimeValue: 180,
    lifecycle: 'Warm',
    status: 'safe',
    priority: 'Revenue active',
    score: 74,
    avatarTone: 'from-emerald-300 to-teal-600',
  },
  {
    id: '3',
    fanName: 'Taylor Chen',
    handle: '@taylorc',
    platform: 'Fansly',
    lastMessage: 'Are you available for a live session this weekend?',
    timestamp: '3h',
    spend: 520,
    lifetimeValue: 1200,
    lifecycle: 'VIP',
    status: 'review',
    priority: 'Human review',
    score: 88,
    avatarTone: 'from-violet-300 to-fuchsia-600',
  },
  {
    id: '4',
    fanName: 'Jordan Lee',
    handle: '@jordanl',
    platform: 'OnlyFans',
    lastMessage: 'Your content is amazing.',
    timestamp: '5h',
    spend: 0,
    lifetimeValue: 0,
    lifecycle: 'Blocked',
    status: 'blocked',
    priority: 'Safety hold',
    score: 18,
    avatarTone: 'from-rose-300 to-red-700',
  },
];

const fanProfiles = {
  '1': {
    joined: 'Mar 12, 2025',
    trust: 'High',
    safety: 'Clean',
    nextBestAction: 'Approve custom-video qualifier',
    conversion: 78,
    interests: ['Cosplay', 'Gaming', 'Longer videos'],
    signals: [
      { label: 'Buying intent', value: 92, tone: 'bg-sky-400' },
      { label: 'Relationship warmth', value: 74, tone: 'bg-emerald-400' },
      { label: 'Upsell readiness', value: 81, tone: 'bg-amber-300' },
    ],
    memories: [
      'Prefers longer personalized videos.',
      'Responds best to playful, direct replies.',
      'Bought two PPVs after a question-led offer.',
    ],
    offer: 'Gaming Livestream Highlights',
    offerPrice: 25,
  },
  '2': {
    joined: 'Jan 04, 2025',
    trust: 'Medium',
    safety: 'Clean',
    nextBestAction: 'Confirm purchase and suggest bundle',
    conversion: 61,
    interests: ['Quick replies', 'Bundles', 'Behind the scenes'],
    signals: [
      { label: 'Buying intent', value: 70, tone: 'bg-sky-400' },
      { label: 'Relationship warmth', value: 64, tone: 'bg-emerald-400' },
      { label: 'Upsell readiness', value: 52, tone: 'bg-amber-300' },
    ],
    memories: [
      'Prefers short replies and fast delivery.',
      'Recently accepted a low-price PPV.',
      'Usually responds within one hour.',
    ],
    offer: 'Behind-the-Scenes Bundle',
    offerPrice: 19,
  },
  '3': {
    joined: 'Oct 19, 2024',
    trust: 'High',
    safety: 'Review',
    nextBestAction: 'Queue live-session draft for approval',
    conversion: 84,
    interests: ['Live sessions', 'Premium content', 'VIP access'],
    signals: [
      { label: 'Buying intent', value: 88, tone: 'bg-sky-400' },
      { label: 'Relationship warmth', value: 86, tone: 'bg-emerald-400' },
      { label: 'Upsell readiness', value: 77, tone: 'bg-amber-300' },
    ],
    memories: [
      'High-value fan with consistent premium purchases.',
      'Likes availability windows and concrete options.',
      'Review suggested live-session language before sending.',
    ],
    offer: 'VIP Weekend Session',
    offerPrice: 75,
  },
  '4': {
    joined: 'May 01, 2025',
    trust: 'Low',
    safety: 'Blocked',
    nextBestAction: 'Keep automation paused',
    conversion: 8,
    interests: ['Generic'],
    signals: [
      { label: 'Buying intent', value: 12, tone: 'bg-sky-400' },
      { label: 'Relationship warmth', value: 18, tone: 'bg-emerald-400' },
      { label: 'Upsell readiness', value: 4, tone: 'bg-amber-300' },
    ],
    memories: [
      'Account is blocked by current safety rules.',
      'Do not send offers until reviewed.',
      'Automation must remain disabled.',
    ],
    offer: 'No offer available',
    offerPrice: 0,
  },
};

const thread = [
  {
    id: 'm1',
    sender: 'fan',
    timestamp: '2:45 PM',
    text: 'Hey. Loved your latest post. Can you make a custom video?',
  },
  {
    id: 'm2',
    sender: 'ai',
    timestamp: '2:46 PM',
    text: 'Hi Alex, I can help with that. My custom videos start at $50 for 3 minutes. What vibe did you have in mind?',
    intent: 'Custom request',
    salesFit: 'High',
    safety: 'Passed',
  },
  {
    id: 'm3',
    sender: 'fan',
    timestamp: '2:47 PM',
    text: 'Something personal, maybe 5 minutes. I can pay $80.',
  },
];

const commandItems = ['Approve draft', 'Attach PPV', 'Pause AI', 'Open memory', 'Human takeover'];

const statusStyles: Record<ConversationStatus, string> = {
  live: 'border-sky-300/25 bg-sky-300/10 text-sky-200',
  review: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  safe: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
  blocked: 'border-rose-300/25 bg-rose-300/10 text-rose-200',
};

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState('1');
  const [aiMode, setAiMode] = useState<AiMode>('Draft Only');

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0],
    [selectedConversationId]
  );
  const fanDetails = fanProfiles[selectedConversation.id as keyof typeof fanProfiles];

  return (
    <main className="relative h-screen overflow-hidden bg-[#05070d] text-[#f4f7fb]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(59,130,246,0.18),transparent)]" />
      <div className="relative z-10 flex h-full flex-col">
        <TopBar />

        <section className="hidden min-h-0 flex-1 grid-cols-[340px_minmax(520px,1fr)_380px] gap-3 p-3 xl:grid 2xl:grid-cols-[370px_minmax(620px,1fr)_420px]">
          <PriorityQueue
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
          <ConversationCanvas
            aiMode={aiMode}
            conversation={selectedConversation}
            fanDetails={fanDetails}
            onModeChange={setAiMode}
          />
          <FanIntelligence
            conversation={selectedConversation}
            fanDetails={fanDetails}
          />
        </section>

        <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 xl:hidden">
          <MobileQueue
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
          <ConversationCanvas
            aiMode={aiMode}
            conversation={selectedConversation}
            fanDetails={fanDetails}
            onModeChange={setAiMode}
            compact
          />
          <FanIntelligence
            conversation={selectedConversation}
            fanDetails={fanDetails}
            compact
          />
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
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold tracking-tight text-white">Liquid Glass Command Center</p>
            <span className="hidden rounded-full border border-sky-300/25 bg-sky-300/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-sky-100 md:inline">
              Sandbox
            </span>
          </div>
          <p className="truncate text-xs text-slate-400">AI inbox, memory, offers, and safety controls</p>
        </div>
      </div>

      <div className="hidden min-w-[320px] max-w-[520px] flex-1 items-center px-8 lg:flex">
        <button className="flex h-11 w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 text-left text-sm text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition hover:border-white/18 hover:bg-white/[0.055]">
          <span className="flex items-center gap-2">
            <Command className="h-4 w-4 text-slate-500" />
            Search actions, fans, PPVs
          </span>
          <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-500">⌘K</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <StatusChip icon={Bot} label="AI Online" tone="sky" />
        <StatusChip icon={ShieldCheck} label="Safety Clean" tone="emerald" />
        <button
          className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-slate-200 backdrop-blur-xl transition hover:bg-white/10 md:flex"
          aria-label="Open review mode"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function PriorityQueue({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_20px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
      <div className="border-b border-white/10 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Priority Queue</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Revenue cockpit</h2>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/10">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MetricPill label="Queue" value="14" />
          <MetricPill label="Review" value="3" tone="amber" />
          <MetricPill label="Today" value="$326" tone="emerald" />
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
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              'group mb-2 w-full rounded-[22px] border p-3 text-left transition duration-200',
              selectedId === conversation.id
                ? 'border-sky-300/35 bg-sky-300/[0.10] shadow-[0_0_0_1px_rgba(125,211,252,0.10),0_18px_44px_rgba(14,165,233,0.10)]'
                : 'border-white/0 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.055]'
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar conversation={conversation} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{conversation.fanName}</p>
                  <span className="shrink-0 text-xs text-slate-500">{conversation.timestamp}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>{conversation.platform}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>${conversation.spend}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>{conversation.lifecycle}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-slate-300">{conversation.lastMessage}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={cn('rounded-full border px-2 py-1 text-[11px]', statusStyles[conversation.status])}>
                    {conversation.priority}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Radar className="h-3 w-3 text-sky-300" />
                    {conversation.score}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function MobileQueue({
  selectedId,
  onSelect,
}: {
  selectedId: string;
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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              'min-w-[220px] rounded-2xl border p-3 text-left',
              selectedId === conversation.id ? 'border-sky-300/35 bg-sky-300/10' : 'border-white/10 bg-black/20'
            )}
          >
            <div className="flex items-center gap-2">
              <Avatar conversation={conversation} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{conversation.fanName}</p>
                <p className="text-xs text-slate-500">${conversation.spend} spent</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationCanvas({
  conversation,
  fanDetails,
  aiMode,
  onModeChange,
  compact = false,
}: {
  conversation: Conversation;
  fanDetails: (typeof fanProfiles)[keyof typeof fanProfiles];
  aiMode: AiMode;
  onModeChange: (mode: AiMode) => void;
  compact?: boolean;
}) {
  return (
    <section className="min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-[0_20px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar conversation={conversation} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-white">{conversation.fanName}</h1>
            <p className="truncate text-xs text-slate-400">
              {conversation.platform} · {conversation.handle} · LTV ${conversation.lifetimeValue}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 md:block">
            Human takeover
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/10">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={cn('grid min-h-0', compact ? 'grid-cols-1' : 'h-[calc(100%-73px)] grid-rows-[1fr_auto]')}>
        <div className="min-h-0 overflow-y-auto p-4 md:p-6">
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InsightTile icon={Target} label="Next action" value={fanDetails.nextBestAction} />
            <InsightTile icon={CircleDollarSign} label="Offer fit" value={`${fanDetails.conversion}% conversion`} tone="emerald" />
            <InsightTile icon={ShieldCheck} label="Trust" value={`${fanDetails.trust} · ${fanDetails.safety}`} tone="sky" />
          </div>

          <div className="space-y-4">
            {thread.map((message) => (
              <MessageRow key={message.id} message={message} conversation={conversation} />
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/20 p-4 backdrop-blur-xl md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">AI Draft Surface</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Next best reply</h2>
            </div>
            <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-1">
              {(['Draft Only', 'Auto Low Risk', 'Sandbox'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-medium transition',
                    aiMode === mode ? 'bg-sky-300 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-200/20 bg-[linear-gradient(135deg,rgba(56,189,248,0.13),rgba(255,255,255,0.045)_45%,rgba(16,185,129,0.08))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
            <div className="mb-3 flex items-center gap-2 text-xs text-sky-100">
              <Wand2 className="h-4 w-4" />
              <span>Generated from 3 memories, latest message, and PPV catalog</span>
            </div>
            <p className="text-[15px] leading-7 text-slate-100">
              Hi Alex, I can do a 5-minute custom. For that level of personalization I would price it at $100 and make it feel more tailored to you. Want me to send the details and lock the slot?
            </p>
            <div className="mt-4 grid gap-2 text-xs md:grid-cols-4">
              <DraftSignal label="Intent" value="Custom request" />
              <DraftSignal label="Sales fit" value="High" tone="emerald" />
              <DraftSignal label="Safety" value="Passed" tone="emerald" />
              <DraftSignal label="Mode" value={aiMode} tone="amber" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <ActionButton icon={X} label="Reject" />
            <ActionButton icon={Pause} label="Pause AI" />
            <ActionButton icon={Check} label="Approve" />
            <ActionButton icon={Send} label="Send" primary />
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[22px] border border-emerald-300/20 bg-emerald-300/[0.07] p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
                <Gift className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Suggested PPV</p>
                <p className="text-sm font-semibold text-white">
                  {fanDetails.offer} · ${fanDetails.offerPrice}
                </p>
              </div>
            </div>
            <button className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">
              Attach offer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FanIntelligence({
  conversation,
  fanDetails,
  compact = false,
}: {
  conversation: Conversation;
  fanDetails: (typeof fanProfiles)[keyof typeof fanProfiles];
  compact?: boolean;
}) {
  return (
    <aside className={cn('min-h-0 space-y-3 overflow-y-auto', compact ? '' : 'pr-1')}>
      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Fan Intelligence</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{conversation.fanName}</h2>
            <p className="text-xs text-slate-400">Joined {fanDetails.joined}</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/10">
            <UserRound className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ValueTile label="Total spent" value={`$${conversation.spend}`} />
          <ValueTile label="Lifetime value" value={`$${conversation.lifetimeValue}`} />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Signal stack</h3>
          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-400">
            {conversation.lifecycle}
          </span>
        </div>
        <div className="space-y-4">
          {fanDetails.signals.map((signal) => (
            <SignalBar key={signal.label} {...signal} />
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Memory timeline</h3>
          <Brain className="h-4 w-4 text-sky-200" />
        </div>
        <div className="space-y-3">
          {fanDetails.memories.map((memory, index) => (
            <div key={memory} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                {index < fanDetails.memories.length - 1 && <span className="mt-1 h-full w-px bg-white/10" />}
              </div>
              <p className="pb-3 text-sm leading-6 text-slate-300">{memory}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Offer engine</h3>
          <ArrowUpRight className="h-4 w-4 text-emerald-200" />
        </div>
        <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Next offer</p>
          <p className="mt-2 text-base font-semibold text-white">{fanDetails.offer}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-semibold tracking-tight text-white">${fanDetails.offerPrice}</span>
            <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-slate-950">
              {fanDetails.conversion}% fit
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Controls</h3>
          <LockKeyhole className="h-4 w-4 text-slate-400" />
        </div>
        <div className="grid gap-2">
          {commandItems.map((item) => (
            <button key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10">
              {item}
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

function MessageRow({
  message,
  conversation,
}: {
  message: (typeof thread)[number];
  conversation: Conversation;
}) {
  const isAi = message.sender === 'ai';

  return (
    <div className={cn('flex', isAi ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[760px]', isAi ? 'ml-8' : 'mr-8')}>
        <div
          className={cn(
            'rounded-[24px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]',
            isAi
              ? 'border-sky-200/18 bg-sky-300/[0.08]'
              : 'border-white/10 bg-white/[0.055]'
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-300">{isAi ? 'AI Draft' : conversation.fanName}</span>
            <span className="text-xs text-slate-500">{message.timestamp}</span>
          </div>
          <p className="text-[15px] leading-7 text-slate-100">{message.text}</p>
          {isAi && (
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-3 text-xs md:grid-cols-3">
              <DraftSignal label="Intent" value={message.intent ?? 'Relationship'} />
              <DraftSignal label="Sales fit" value={message.salesFit ?? 'Medium'} tone="emerald" />
              <DraftSignal label="Safety" value={message.safety ?? 'Passed'} tone="emerald" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({
  conversation,
  size = 'md',
}: {
  conversation: Conversation;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]',
        conversation.avatarTone,
        size === 'sm' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base'
      )}
    >
      {conversation.fanName.charAt(0)}
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
  tone: 'sky' | 'emerald';
}) {
  return (
    <span
      className={cn(
        'hidden items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium backdrop-blur-xl sm:flex',
        tone === 'sky'
          ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
          : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function MetricPill({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'amber' | 'emerald';
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold',
          tone === 'emerald' && 'text-emerald-200',
          tone === 'amber' && 'text-amber-200',
          tone === 'slate' && 'text-white'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InsightTile({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: 'slate' | 'sky' | 'emerald';
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <Icon
          className={cn(
            'h-4 w-4',
            tone === 'sky' && 'text-sky-200',
            tone === 'emerald' && 'text-emerald-200',
            tone === 'slate' && 'text-slate-400'
          )}
        />
      </div>
      <p className="text-sm font-semibold leading-5 text-white">{value}</p>
    </div>
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

function SignalBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DraftSignal({
  label,
  value,
  tone = 'sky',
}: {
  label: string;
  value: string;
  tone?: 'sky' | 'emerald' | 'amber';
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 truncate text-xs font-semibold',
          tone === 'sky' && 'text-sky-100',
          tone === 'emerald' && 'text-emerald-100',
          tone === 'amber' && 'text-amber-100'
        )}
      >
        {value}
      </p>
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
      className={cn(
        'flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition',
        primary
          ? 'bg-sky-300 text-slate-950 hover:bg-sky-200'
          : 'border border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
