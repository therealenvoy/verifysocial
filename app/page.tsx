import Link from 'next/link';
import { ArrowRight, MessageSquare, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-surface" />
            </div>
            <h1 className="text-2xl font-semibold">VerifySocial</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-text hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/inbox"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary/90"
            >
              Open Inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="py-20">
          <div className="text-center">
            <h2 className="text-5xl font-bold tracking-tight">
              AI Protection Platform for{' '}
              <span className="text-primary">Adult Content Creators</span>
            </h2>
            <p className="mt-6 text-xl text-muted-text max-w-2xl mx-auto">
              Enterprise‑grade safety & compliance for OnlyFans, Fansly, and premium creators.
              Protect your income, automate risk detection, and scale securely.
            </p>
            <div className="mt-10">
              <Link
                href="/inbox"
                className="inline-flex items-center rounded-lg bg-primary px-8 py-4 text-lg font-medium text-surface hover:bg-primary/90"
              >
                Launch Inbox MVP
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-32 grid grid-cols-3 gap-8">
            <div className="rounded-xl border border-border p-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real‑Time Verification</h3>
              <p className="text-muted-text">
                AI‑powered identity & intent verification for every incoming message and fan.
              </p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <Zap className="h-12 w-12 text-success mb-4" />
              <h3 className="text-xl font-semibold mb-2">Automated Protection</h3>
              <p className="text-muted-text">
                Proactive risk detection, content moderation, and compliance guardrails.
              </p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <MessageSquare className="h-12 w-12 text-warning mb-4" />
              <h3 className="text-xl font-semibold mb-2">Platform Safety</h3>
              <p className="text-muted-text">
                Keep your OnlyFans, Fansly, and social media accounts secure from bans & flags.
              </p>
            </div>
          </div>
        </main>

        <footer className="mt-32 pt-8 border-t border-border text-center text-sm text-muted-text">
          <p>© 2025 VerifySocial. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}