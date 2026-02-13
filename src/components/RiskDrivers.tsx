"use client";

export function RiskDrivers({
  drivers,
}: {
  drivers: Array<{ factor: string; points: number; evidence: string }>;
}) {
  if (!drivers.length) {
    return (
      <div className="border border-[var(--border)] rounded-lg p-6 bg-[var(--bg-card)]">
        <h3 className="text-sm uppercase tracking-[0.15em] text-[var(--text-secondary)] mb-4 mono">
          Risk Drivers
        </h3>
        <p className="text-[var(--accent-green)] mono text-sm">
          ✓ No risk signals detected
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-lg p-6 bg-[var(--bg-card)]">
      <h3 className="text-sm uppercase tracking-[0.15em] text-[var(--text-secondary)] mb-4 mono">
        Risk Drivers
      </h3>
      <div className="space-y-4">
        {drivers
          .sort((a, b) => b.points - a.points)
          .map((d, i) => (
            <div
              key={i}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{d.factor}</span>
                <span className="mono text-sm text-[var(--accent-red)]">
                  +{d.points}
                </span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 mb-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (d.points / 35) * 100)}%`,
                    background: d.points >= 20 ? "var(--accent-red)" : d.points >= 10 ? "var(--accent-amber)" : "var(--accent-blue)",
                  }}
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mono">
                {d.evidence}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

