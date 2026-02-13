"use client";

interface TimelineEvent {
  timestamp: number;
  type: "post" | "swap" | "tx";
  content: string;
  tokens?: string[];
  tokenIn?: string;
  tokenOut?: string;
  signature?: string;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;

  return (
    <div className="border border-[var(--border)] rounded-lg p-6 bg-[var(--bg-card)]">
      <h3 className="text-sm uppercase tracking-[0.15em] text-[var(--text-secondary)] mb-4 mono">
        Activity Timeline
      </h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border)]" />

        <div className="space-y-4">
          {events.map((e, i) => {
            const isPost = e.type === "post";
            const isSwap = e.type === "swap";
            const dotColor = isPost
              ? "bg-[var(--accent-blue)]"
              : isSwap
              ? "bg-[var(--accent-red)]"
              : "bg-[var(--text-secondary)]";

            const time = e.timestamp
              ? new Date(e.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";

            return (
              <div
                key={i}
                className="flex gap-4 pl-6 relative animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Dot */}
                <div
                  className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full ${dotColor} border-2 border-[var(--bg-card)]`}
                  style={{
                    boxShadow: isSwap
                      ? "0 0 8px rgba(255,51,102,0.4)"
                      : isPost
                      ? "0 0 8px rgba(68,136,255,0.4)"
                      : "none",
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded mono font-medium"
                      style={{
                        background: isPost
                          ? "rgba(68,136,255,0.15)"
                          : isSwap
                          ? "rgba(255,51,102,0.15)"
                          : "rgba(136,136,160,0.15)",
                        color: isPost
                          ? "var(--accent-blue)"
                          : isSwap
                          ? "var(--accent-red)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {e.type}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] mono">
                      {time}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--text-primary)] leading-relaxed truncate">
                    {e.content}
                  </p>

                  {/* Token tags */}
                  {e.tokens && e.tokens.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {e.tokens.map((t, j) => (
                        <span
                          key={j}
                          className="text-[10px] mono px-1.5 py-0.5 rounded bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Swap details */}
                  {isSwap && e.tokenIn && e.tokenOut && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-[var(--accent-red)]/10 text-[var(--accent-red)]">
                        {e.tokenIn} → {e.tokenOut}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

