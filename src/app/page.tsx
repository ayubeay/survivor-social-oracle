"use client";

import { useState } from "react";
import { ScoreRing } from "@/components/ScoreRing";
import { RiskDrivers } from "@/components/RiskDrivers";
import { Timeline } from "@/components/Timeline";
import { StatsPanel } from "@/components/StatsPanel";

const DEMO_PROFILES = ["alpha_pumper", "solana_builder", "moon_signals", "degen_trader"];

interface ScoreResult {
  score: number;
  label: string;
  drivers: Array<{ factor: string; points: number; evidence: string }>;
  profile: {
    id: string;
    username: string;
    bio: string;
    namespace: string;
    wallet: string;
  };
  stats: {
    posts: number;
    transactions: number;
    swaps: number;
    tokensmentioned: Array<{ token: string; count: number }>;
    tokensTraded: string[];
  };
  timeline: any[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");

  async function handleScore(profileId?: string) {
    const id = profileId || query.trim();
    if (!id) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const isWallet = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(id);
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isWallet ? { wallet: id } : { profileId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResult(await res.json());
      setQuery(id);
    } catch (err: any) {
      setError(err.message || "Failed to score profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--text-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--text-secondary) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-secondary)] mono">
              Survivor Social Oracle
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Risk intelligence for{" "}
            <span className="text-[var(--accent-green)]">onchain social</span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl">
            Correlate social behavior with wallet activity. Detect promote-then-dump
            patterns, shill clustering, and bot accounts across Tapestry × Solana.
          </p>
        </header>

        {/* Search */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScore()}
                placeholder="Enter Tapestry profile ID or Solana wallet address..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-green)]/50 focus:ring-1 focus:ring-[var(--accent-green)]/20 transition-all"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[var(--accent-green)]/30 border-t-[var(--accent-green)] rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => handleScore()}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-[var(--accent-green)] text-[var(--bg-primary)] font-semibold text-sm rounded-lg hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all mono tracking-wide"
            >
              SCAN
            </button>
          </div>

          {/* Demo buttons */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mono">
              Demo:
            </span>
            {DEMO_PROFILES.map((id) => (
              <button
                key={id}
                onClick={() => handleScore(id)}
                disabled={loading}
                className="text-xs mono px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-green)]/30 transition-all disabled:opacity-30"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-lg border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5 text-[var(--accent-red)] text-sm mono">
            ✗ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="animate-fade-in">
            {/* Profile header */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-lg mono font-bold">
                {result.profile.username[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{result.profile.username}</h2>
                {result.profile.bio && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {result.profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Score + Drivers row */}
            <div className="grid md:grid-cols-[240px_1fr] gap-6 mb-6">
              <div className="flex justify-center items-start pt-2">
                <ScoreRing score={result.score} label={result.label} />
              </div>
              <RiskDrivers drivers={result.drivers} />
            </div>

            {/* Stats + Timeline row */}
            <div className="grid md:grid-cols-[1fr_1fr] gap-6">
              <StatsPanel
                stats={result.stats}
                wallet={result.profile.wallet}
              />
              <Timeline events={result.timeline} />
            </div>

            {/* Methodology note */}
            <div className="mt-8 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <p className="text-[11px] text-[var(--text-secondary)] mono leading-relaxed">
                <span className="text-[var(--text-primary)]">Methodology:</span>{" "}
                Deterministic scoring across 6 risk factors — promote-exit correlation
                (35%), shill clustering (15%), token concentration (15%), spam pattern
                (15%), engagement authenticity (10%), wallet age (10%). No ML black
                boxes. Every point is auditable.
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">⟐</div>
            <p className="text-[var(--text-secondary)] text-sm">
              Enter a profile ID or try a demo profile to see risk analysis
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-secondary)] mono">
          <span>Survivor Social Oracle × Solana Graveyard Hack 2026</span>
          <span>Tapestry + Helius</span>
        </footer>
      </div>
    </main>
  );
}

