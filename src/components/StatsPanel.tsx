"use client";

interface Stats {
  posts: number;
  transactions: number;
  swaps: number;
  tokensmentioned: Array<{ token: string; count: number }>;
  tokensTraded: string[];
}

export function StatsPanel({
  stats,
  wallet,
}: {
  stats: Stats;
  wallet: string;
}) {
  const shortWallet = wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "—";

  return (
    <div className="border border-[var(--border)] rounded-lg p-6 bg-[var(--bg-card)]">
      <h3 className="text-sm uppercase tracking-[0.15em] text-[var(--text-secondary)] mb-4 mono">
        Profile Stats
      </h3>

      {/* Wallet */}
      <div className="mb-4 pb-4 border-b border-[var(--border)]">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mono">
          Wallet
        </span>
        <a
          href={`https://solscan.io/account/${wallet}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm mono text-[var(--accent-blue)] hover:underline mt-1"
        >
          {shortWallet} ↗
        </a>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-[var(--border)]">
        <Stat label="Posts" value={stats.posts} />
        <Stat label="TXs (30d)" value={stats.transactions} />
        <Stat label="Swaps" value={stats.swaps} />
      </div>
      {stats.transactions === 0 && stats.posts > 0 && (
        <p className="text-[10px] text-[var(--accent-amber)] mono mb-4 pb-4 border-b border-[var(--border)]">
          No onchain txs observed for linked wallet — onchain correlation limited
        </p>
      )}

      {/* Tokens mentioned */}
      {stats.tokensmentioned.length > 0 && (
        <div className="mb-4 pb-4 border-b border-[var(--border)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mono block mb-2">
            Tokens Promoted
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stats.tokensmentioned
              .sort((a, b) => b.count - a.count)
              .map((t) => (
                <span
                  key={t.token}
                  className="text-[11px] mono px-2 py-1 rounded-md bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]"
                >
                  ${t.token}
                  {t.count > 1 && (
                    <span className="ml-1 text-[var(--accent-red)]">×{t.count}</span>
                  )}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Tokens traded */}
      {stats.tokensTraded.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mono block mb-2">
            Tokens Traded
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stats.tokensTraded.map((t) => {
              const promoted = stats.tokensmentioned.find(
                (m) => m.token === t
              );
              return (
                <span
                  key={t}
                  className={`text-[11px] mono px-2 py-1 rounded-md ${
                    promoted
                      ? "bg-[var(--accent-red)]/15 text-[var(--accent-red)] ring-1 ring-[var(--accent-red)]/30"
                      : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  }`}
                >
                  ${t}
                  {promoted && <span className="ml-1">⚠</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold mono">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mono mt-1">
        {label}
      </div>
    </div>
  );
}

