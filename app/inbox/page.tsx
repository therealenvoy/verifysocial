'use client';
import { useState, useEffect } from 'react';
import {
  MessageSquare, User, Gift, Search, Filter, ChevronRight, Check, Edit, X, Send,
  Clock, AlertCircle, Shield, DollarSign, Zap, Target, Heart, Calendar, Star, MoreVertical,
  Settings, ArrowRight, Plus, Sun, Moon, Circle, Bell, ExternalLink, Lock, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ConversationItem from '@/components/inbox/conversation-item';
import ChatHeader from '@/components/inbox/chat-header';
import MessageBubble from '@/components/inbox/message-bubble';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Button } from '@/components/ui/button';

// Mock data
const conversations = [
  {
    id: '1',
    fanName: 'Alex Johnson',
    lastMessage: 'Hey! Loved your latest post. Can you make a custom video?',
    timestamp: '2 min ago',
    unread: true,
    spend: 245,
    lifecycle: 'High‑Intent',
    safety: 'safe',
    platform: 'Fansly',
    avatarColor: 'bg-blue-100 text-blue-600',
  },
  {
    id: '2',
    fanName: 'Sam Rivera',
    lastMessage: 'Thanks for the reply! Buying the PPV now.',
    timestamp: '1 hour ago',
    unread: false,
    spend: 89,
    lifecycle: 'Warm',
    safety: 'safe',
    platform: 'OnlyFans',
    avatarColor: 'bg-green-100 text-green-600',
  },
  {
    id: '3',
    fanName: 'Taylor Chen',
    lastMessage: 'Are you available for a live session this weekend?',
    timestamp: '3 hours ago',
    unread: true,
    spend: 520,
    lifecycle: 'VIP',
    safety: 'review',
    platform: 'Fansly',
    avatarColor: 'bg-purple-100 text-purple-600',
  },
  {
    id: '4',
    fanName: 'Jordan Lee',
    lastMessage: 'Your content is amazing!',
    timestamp: '5 hours ago',
    unread: false,
    spend: 0,
    lifecycle: 'Blocked',
    safety: 'blocked',
    platform: 'OnlyFans',
    avatarColor: 'bg-red-100 text-red-600',
  },
];

const messages = [
  { id: 'm1', sender: 'fan', text: 'Hey! Loved your latest post. Can you make a custom video?', timestamp: '2:45 PM' },
  { id: 'm2', sender: 'ai', text: 'Hi Alex! I’d love to help with a custom video. My rates start at $50 for a 3‑minute personalized video. What did you have in mind?', timestamp: '2:46 PM', confidence: 'high', safety: 'passed', mode: 'Draft Only' },
  { id: 'm3', sender: 'fan', text: 'Something intimate, maybe 5 minutes? I can pay $80.', timestamp: '2:47 PM' },
  { id: 'm4', sender: 'ai', text: 'That works! For a 5‑minute intimate video, my rate is $100. I can deliver within 24 hours. Would you like to proceed?', timestamp: '2:48 PM', confidence: 'medium', safety: 'needs‑review', mode: 'Draft Only' },
];

const getFanDetails = (conversationId: string) => {
  const base = {
    name: 'Alex Johnson',
    platform: 'Fansly',
    joinDate: 'Mar 12, 2025',
    totalSpent: 245,
    lifetimeValue: 520,
    lifecycleStage: 'High‑Intent',
    interests: ['Cosplay', 'Gaming', 'Intimate Q&A'],
    memoryNotes: 'Prefers longer videos. Has bought 2 PPVs before.',
    lastPpvOffered: 'Cosplay Behind‑the‑Scenes ($30)',
    suggestedPpv: 'Gaming Livestream Highlights ($25)',
    aiMode: 'Draft Only',
    aiTrust: 'High',
    safetyStatus: 'Clean',
    auditStatus: 'No flags',
  };

  if (conversationId === '4') {
    return {
      ...base,
      name: 'Jordan Lee',
      platform: 'OnlyFans',
      totalSpent: 0,
      lifetimeValue: 0,
      lifecycleStage: 'Blocked',
      interests: ['Generic'],
      memoryNotes: 'User blocked for policy violations.',
      safetyStatus: 'Blocked',
      auditStatus: 'Major flags',
    };
  }

  if (conversationId === '2') {
    return {
      ...base,
      name: 'Sam Rivera',
      totalSpent: 89,
      lifetimeValue: 180,
      lifecycleStage: 'Warm',
      interests: ['Custom Requests', 'Quick Replies'],
      safetyStatus: 'Clean',
    };
  }

  if (conversationId === '3') {
    return {
      ...base,
      name: 'Taylor Chen',
      totalSpent: 520,
      lifetimeValue: 1200,
      lifecycleStage: 'VIP',
      interests: ['Live Sessions', 'Premium Content'],
      safetyStatus: 'Under Review',
    };
  }

  return base;
};

type MobileTab = 'chats' | 'thread' | 'fan' | 'ppv';
type AiMode = 'Draft Only' | 'Auto Low Risk' | 'Sandbox';

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState('1');
  const [mobileTab, setMobileTab] = useState<MobileTab>('chats');
  const [aiMode, setAiMode] = useState<AiMode>('Draft Only');
  const [conversationsEmpty] = useState(false); // simulate non-empty for now
  const [darkMode, setDarkMode] = useState(true);
  const [isSandbox, setIsSandbox] = useState(true);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (!newMode) { // newMode false means light theme active
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      setDarkMode(false);
      document.documentElement.classList.add('light');
    } else {
      setDarkMode(true);
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleSandbox = () => setIsSandbox(!isSandbox);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const fanDetails = getFanDetails(selectedConversationId);

  // If empty, show onboarding
  if (conversationsEmpty) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">No conversations yet.</h1>
          <p className="text-muted-text mb-8">
            Send a test message in Sandbox to see how your AI drafts replies and suggests PPVs.
          </p>
          <button className="rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary/90 transition">
            Go to Sandbox
          </button>
        </div>
      </div>
    );
  }

  // Desktop layout - Linear Dark Theme
  return (
    <div className="h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      {/* Header - Linear precision */}
      <header className="flex h-12 items-center justify-between px-6 border-b border-subtle bg-surface-panel/50 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-medium tracking-tight">Creator Inbox</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-text-tertiary font-mono">
            <Zap className="h-3 w-3 text-primary" />
            <span>AI Assistant</span>
            <div className="h-0.5 w-0.5 rounded-full bg-border-medium mx-1" />
            <span className="text-success">Safety: All Clear</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-xs">
            <button
              onClick={toggleSandbox}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition",
                isSandbox 
                  ? "bg-warning/10 text-warning border border-warning/20" 
                  : "border border-medium hover:bg-surface-elevated text-text-tertiary"
              )}
            >
              {isSandbox ? 'Sandbox Active' : 'Live Mode'}
            </button>
          </div>
          <button
            onClick={toggleDarkMode}
            className="h-7 w-7 rounded border border-medium flex items-center justify-center hover:bg-surface-elevated transition text-text-tertiary hover:text-foreground"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition">
            New Message
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop three columns */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          
          {/* Left: Conversation list - Linear precision */}
          <div className="w-80 border-r border-subtle bg-surface-panel overflow-y-auto">
            <div className="sticky top-0 bg-surface-panel border-b border-subtle p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full rounded border border-medium bg-surface-elevated py-1.5 pl-9 pr-3 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-sans"
                />
              </div>
              <div className="mt-2.5 flex gap-1">
                <button className="rounded px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition">
                  All
                </button>
                <button className="rounded px-2.5 py-1 text-xs font-medium border border-medium hover:bg-surface-elevated text-text-secondary transition">
                  Unread
                </button>
                <button className="rounded px-2.5 py-1 text-xs font-medium border border-medium hover:bg-surface-elevated text-text-secondary transition">
                  VIP
                </button>
                <button className="ml-auto text-text-tertiary hover:text-foreground hover:bg-surface-elevated rounded p-1 transition">
                  <Filter className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="p-1">
              {conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  id={conv.id}
                  fanName={conv.fanName}
                  lastMessage={conv.lastMessage}
                  timestamp={conv.timestamp}
                  unread={conv.unread}
                  spend={conv.spend}
                  lifecycle={conv.lifecycle}
                  safety={conv.safety}
                  platform={conv.platform}
                  avatarColor={conv.avatarColor}
                  selected={selectedConversationId === conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                />
              ))}
            </div>
          </div>

          {/* Center: Chat thread */}
          <div className="flex-1 border-r border-subtle bg-surface-panel overflow-hidden flex flex-col">
            <ChatHeader
              fanName={selectedConversation?.fanName || ''}
              platform={selectedConversation?.platform || ''}
              spend={selectedConversation?.spend || 0}
              timestamp={selectedConversation?.timestamp || ''}
              avatarColor={selectedConversation?.avatarColor || ''}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  sender={msg.sender}
                  text={msg.text}
                  timestamp={msg.timestamp}
                  confidence={msg.confidence}
                  safety={msg.safety}
                  mode={msg.mode}
                />
              ))}
            </div>

            {/* AI composer & actions */}
            <div className="border-t border-subtle p-4 bg-surface-panel">
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">AI MODE</span>
                  <div className="flex rounded border border-medium overflow-hidden">
                    {(['Draft Only', 'Auto Low Risk', 'Sandbox'] as const).map(mode => (
                      <button
                        key={mode}
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium transition font-mono',
                          aiMode === mode
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-transparent hover:bg-surface-elevated text-text-secondary'
                        )}
                        onClick={() => setAiMode(mode)}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Draft composer */}
              <div className="rounded border border-medium bg-surface-elevated p-4 mb-4">
                <p className="text-sm text-text-secondary">
                  Hi Alex! I’d love to help with a custom video. My rates start at $50 for a 3‑minute personalized video. What did you have in mind?
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary font-mono">
                  <Target className="h-3 w-3 text-primary" />
                  <span>Confidence: <span className="text-success font-medium">HIGH</span></span>
                  <span className="text-border-medium">|</span>
                  <span>Safety: <span className="text-success font-medium">PASSED</span></span>
                  <span className="text-border-medium">|</span>
                  <span className="text-primary">AI‑GENERATED</span>
                </div>
              </div>

              {/* Action buttons - Linear precision */}
              <div className="flex gap-2">
                <button className="flex-1 rounded border border-medium py-2 text-xs font-medium hover:bg-surface-elevated transition flex items-center justify-center gap-2 text-text-secondary hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                  Reject
                </button>
                <button className="flex-1 rounded border border-medium py-2 text-xs font-medium hover:bg-surface-elevated transition flex items-center justify-center gap-2 text-text-secondary hover:text-foreground">
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button className="flex-1 rounded border border-medium py-2 text-xs font-medium hover:bg-surface-elevated transition flex items-center justify-center gap-2 text-text-secondary hover:text-foreground">
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button className="flex-1 rounded bg-primary py-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition flex items-center justify-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>

              {/* PPV suggestion - compact attachment */}
              <div className="mt-4 p-3 border border-medium rounded bg-success/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-3.5 w-3.5 text-success" />
                    <div>
                      <h4 className="text-xs font-medium text-success uppercase tracking-wider">SUGGESTED PPV</h4>
                      <p className="text-xs text-text-secondary">Cosplay Behind‑the‑Scenes — $30</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="rounded border border-success/30 px-2.5 py-1 text-xs hover:bg-success/10 text-success transition">
                      Attach
                    </button>
                    <button className="rounded bg-success px-2.5 py-1 text-xs text-primary-foreground hover:bg-success/90 transition">
                      Offer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Fan inspector - Linear glassmorphism */}
          <div className="w-96 border-l border-subtle bg-surface-panel/80 backdrop-blur-sm overflow-y-auto p-5">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className={cn('h-8 w-8 rounded flex items-center justify-center text-sm font-medium', selectedConversation?.avatarColor)}>
                  {selectedConversation?.fanName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-medium tracking-tight">{selectedConversation?.fanName}</h2>
                  <p className="text-xs text-text-tertiary font-mono">
                    {selectedConversation?.platform} • JOINED {fanDetails.joinDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Spend & Value */}
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary font-mono">
                  SPEND & VALUE
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 border border-medium rounded bg-surface-elevated">
                    <p className="text-xs text-text-tertiary">Total Spent</p>
                    <p className="text-2xl font-bold tracking-tight">${fanDetails.totalSpent}</p>
                  </div>
                  <div className="p-3 border border-medium rounded bg-surface-elevated">
                    <p className="text-xs text-text-tertiary">Lifetime Value</p>
                    <p className="text-2xl font-bold tracking-tight">${fanDetails.lifetimeValue}</p>
                  </div>
                </div>
              </section>

              {/* Lifecycle */}
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary font-mono">
                  LIFECYCLE
                </h3>
                <div className="p-3 border border-medium rounded bg-surface-elevated">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-text-secondary">{fanDetails.lifecycleStage}</span>
                    <span className="text-xs font-medium text-primary">HIGH‑INTENT</span>
                  </div>
                  <div className="h-1 rounded-full bg-border-subtle overflow-hidden">
                    <div className="h-full w-3/4 bg-primary" />
                  </div>
                </div>
              </section>

              {/* Interests */}
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary font-mono">
                  INTERESTS
                </h3>
                <div className="flex flex-wrap gap-1">
                  {fanDetails.interests.map(int => (
                    <span key={int} className="px-2 py-1 text-xs border border-medium rounded bg-surface-elevated text-text-secondary">
                      {int}
                    </span>
                  ))}
                </div>
              </section>

              {/* Memory notes */}
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary font-mono">
                  MEMORY NOTES
                </h3>
                <div className="p-3 border border-medium rounded bg-surface-elevated">
                  <p className="text-sm text-text-secondary">{fanDetails.memoryNotes}</p>
                </div>
              </section>

              {/* PPV History */}
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary font-mono">
                  PPV HISTORY
                </h3>
                <div className="space-y-2">
                  <div className="p-3 border border-medium rounded bg-surface-elevated">
                    <p className="text-xs text-text-tertiary">Last Offered</p>
                    <p className="text-sm font-medium">{fanDetails.lastPpvOffered}</p>
                  </div>
                  <div className="p-3 border border-success/30 rounded bg-success/5">
                    <p className="text-xs text-success uppercase tracking-wider">SUGGESTED PPV</p>
                    <p className="text-sm font-medium text-text-secondary">{fanDetails.suggestedPpv}</p>
                  </div>
                </div>
              </section>

              {/* AI Trust & Safety */}
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary font-mono">
                  AI TRUST & SAFETY
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
                    <span className="text-sm text-text-secondary">AI Mode</span>
                    <span className="text-sm font-medium font-mono">{fanDetails.aiMode}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
                    <span className="text-sm text-text-secondary">Trust Level</span>
                    <span className="text-sm font-medium text-success">HIGH</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
                    <span className="text-sm text-text-secondary">Safety Status</span>
                    <span className="text-sm font-medium text-success">CLEAN</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-text-secondary">Audit Status</span>
                    <span className="text-sm font-medium text-text-tertiary">NO FLAGS</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Mobile layout - tabs */}
        <div className="flex-1 lg:hidden flex flex-col">
          <div className="flex-1 overflow-hidden p-4">
            {mobileTab === 'chats' && (
              <div className="space-y-3">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg"
                    onClick={() => setMobileTab('thread')}
                  >
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', conv.avatarColor)}>
                      {conv.fanName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{conv.fanName}</h3>
                        <span className="text-xs text-muted-text">{conv.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-text truncate">{conv.lastMessage}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span>${conv.spend}</span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span>{conv.lifecycle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {mobileTab === 'thread' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setMobileTab('chats')} className="text-primary">
                    ← Back
                  </button>
                  <h2 className="font-semibold">Chat</h2>
                </div>
                {/* Simplified thread for mobile */}
                <div className="space-y-3">
                  {messages.slice(0, 2).map(msg => (
                    <div key={msg.id} className="p-3 border border-border rounded-lg">
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs text-muted-text mt-1">{msg.timestamp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mobileTab === 'fan' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setMobileTab('thread')} className="text-primary">
                    ← Back
                  </button>
                  <h2 className="font-semibold">Fan Details</h2>
                </div>
                {/* Simplified fan details */}
                <div className="space-y-4">
                  <div className="p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium">Spend & Value</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-muted-text">Total Spent</span>
                      <span className="font-medium">${fanDetails.totalSpent}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mobileTab === 'ppv' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setMobileTab('thread')} className="text-primary">
                    ← Back
                  </button>
                  <h2 className="font-semibold">PPV</h2>
                </div>
                {/* PPV suggestions */}
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-sm font-medium">Suggested PPV</p>
                  <p className="text-sm text-muted-text mt-1">{fanDetails.suggestedPpv}</p>
                  <button className="w-full mt-3 py-2 bg-primary text-surface rounded-md text-sm font-medium">
                    Offer Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile tab bar */}
          <div className="border-t border-border">
            <div className="flex">
              {(['chats', 'thread', 'fan', 'ppv'] as MobileTab[]).map(tab => (
                <button
                  key={tab}
                  className={cn(
                    'flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1',
                    mobileTab === tab ? 'text-primary' : 'text-muted-text'
                  )}
                  onClick={() => setMobileTab(tab)}
                >
                  {tab === 'chats' && <MessageSquare className="h-4 w-4" />}
                  {tab === 'thread' && <User className="h-4 w-4" />}
                  {tab === 'fan' && <Target className="h-4 w-4" />}
                  {tab === 'ppv' && <Gift className="h-4 w-4" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}