"use client";

export function ScoreRing({
  score,
  label,
  size = 180,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorMap: Record<string, string> = {
    LOW: "#00FF88",
    MEDIUM: "#FFB800",
    HIGH: "#FF6B35",
    CRITICAL: "#FF3366",
  };

  const color = colorMap[label] || "#8888A0";

  return (
    <div className="relative flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#2A2A3A"
          strokeWidth="6"
        />
        {/* Score ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s ease-out",
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="text-4xl font-bold mono"
          style={{ color, textShadow: `0 0 20px ${color}40` }}
        >
          {score}
        </span>
        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-1">
          / 100
        </span>
      </div>
      <span
        className="text-sm font-semibold tracking-[0.2em] uppercase mono"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

