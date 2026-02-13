import { NextRequest, NextResponse } from "next/server";

const TAPESTRY_URL = "https://api.usetapestry.dev/api/v1";
const HELIUS_URL = "https://api.helius.xyz/v0";

function tKey() { return process.env.TAPESTRY_API_KEY || ""; }
function hKey() { return process.env.HELIUS_API_KEY || ""; }

export async function POST(req: NextRequest) {
  try {
    const { profileId } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    // 1. Get profile
    const pRes = await fetch(`${TAPESTRY_URL}/profiles/${profileId}?apiKey=${tKey()}`);
    if (!pRes.ok) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const pData = await pRes.json();
    const wallet = pData.walletAddress;
    const profile = pData.profile;

    // 2. Get posts — try known patterns
    const possibleIds = generatePostIds(profileId);
    const posts: any[] = [];
    for (const pid of possibleIds) {
      try {
        const r = await fetch(`${TAPESTRY_URL}/contents/${pid}?apiKey=${tKey()}`);
        if (r.ok) {
          const d = await r.json();
          posts.push(d.content || d);
        }
      } catch {}
    }

    // Also try the contents list endpoint
    try {
      const listRes = await fetch(
        `${TAPESTRY_URL}/contents?apiKey=${tKey()}&profileId=${profileId}&limit=50`
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        const listed = Array.isArray(listData) ? listData : listData.contents || [];
        for (const c of listed) {
          if (!posts.find((p: any) => p.id === c.id)) {
            posts.push(c);
          }
        }
      }
    } catch {}

    // 3. Get wallet txs from Helius
    let txs: any[] = [];
    let swaps: any[] = [];
    if (wallet && hKey()) {
      try {
        const txRes = await fetch(
          `${HELIUS_URL}/addresses/${wallet}/transactions?api-key=${hKey()}&limit=30`
        );
        if (txRes.ok) {
          txs = await txRes.json();
          swaps = txs.filter((t: any) => t.type === "SWAP" || t.events?.swap);
        }
      } catch {}
    }

    // Helper: extract text content from a post (handles nested Tapestry format)
    function getPostText(p: any): string {
      if (typeof p.content === "string") return p.content;
      if (typeof p.content === "object" && p.content?.content) return String(p.content.content);
      if (Array.isArray(p.properties)) {
        const found = p.properties.find((pr: any) => pr.key === "content");
        if (found) return String(found.value);
      }
      return "";
    }

    // 4. Extract mentions
    const mentions = new Map<string, number>();
    for (const p of posts) {
      const tickers = getPostText(p).match(/\$([A-Z]{2,10})/g) || [];
      tickers.forEach((t: string) => {
        const clean = t.replace("$", "");
        mentions.set(clean, (mentions.get(clean) || 0) + 1);
      });
    }

    // 5. Extract traded tokens
    const tradedSymbols = new Set<string>();
    for (const tx of swaps) {
      const s = tx.events?.swap;
      if (s?.tokenInputs?.[0]?.symbol) tradedSymbols.add(s.tokenInputs[0].symbol);
      if (s?.tokenOutputs?.[0]?.symbol) tradedSymbols.add(s.tokenOutputs[0].symbol);
    }

    // 6. Score
    let score = 0;
    const drivers: Array<{ factor: string; points: number; evidence: string }> = [];

    // Shill clustering
    const maxMentions = Math.max(0, ...mentions.values());
    if (maxMentions >= 2) {
      const pts = Math.min(20, maxMentions * 7);
      score += pts;
      drivers.push({
        factor: "Shill Clustering",
        points: pts,
        evidence: `Same token promoted ${maxMentions}x across posts`,
      });
    }

    // Token concentration
    const uniqueTokens = mentions.size;
    if (uniqueTokens > 0 && posts.length / uniqueTokens > 2) {
      score += 15;
      drivers.push({
        factor: "Token Concentration",
        points: 15,
        evidence: `${posts.length} posts promoting only ${uniqueTokens} token(s)`,
      });
    }

    // Engagement authenticity
    if (posts.length > 0 && txs.length === 0) {
      score += 20;
      drivers.push({
        factor: "Engagement Authenticity",
        points: 20,
        evidence: `${posts.length} social posts but zero on-chain transactions`,
      });
    } else if (posts.length > txs.length * 2) {
      score += 10;
      drivers.push({
        factor: "Engagement Authenticity",
        points: 10,
        evidence: `${posts.length} posts vs ${txs.length} transactions — unbalanced`,
      });
    }

    // Spam pattern
    if (uniqueTokens >= 6) {
      score += 15;
      drivers.push({
        factor: "Spam Pattern",
        points: 15,
        evidence: `${uniqueTokens} different tokens promoted — shotgun approach`,
      });
    }

    // Promote-exit
    const overlap = [...mentions.keys()].filter((t) => tradedSymbols.has(t));
    if (overlap.length > 0) {
      const pts = Math.min(35, overlap.length * 15);
      score += pts;
      drivers.push({
        factor: "Promote → Exit",
        points: pts,
        evidence: `${overlap.join(", ")} promoted in posts AND traded on-chain`,
      });
    }

    score = Math.min(100, score);
    const label = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

    // Build timeline
    const timeline: any[] = [];
    for (const p of posts) {
      timeline.push({
        timestamp: p.created_at || 0,
        type: "post",
        content: getPostText(p),
        tokens: getPostText(p).match(/\$([A-Z]{2,10})/g) || [],
      });
    }
    for (const tx of txs.slice(0, 10)) {
      const entry: any = {
        timestamp: (tx.timestamp || 0) * 1000,
        type: tx.type === "SWAP" ? "swap" : "tx",
        content: `${tx.type || "TX"} via ${tx.source || "unknown"}`,
        signature: tx.signature,
      };
      if (tx.events?.swap) {
        const s = tx.events.swap;
        entry.tokenIn = s.tokenInputs?.[0]?.symbol || s.tokenInputs?.[0]?.mint?.slice(0, 8);
        entry.tokenOut = s.tokenOutputs?.[0]?.symbol || s.tokenOutputs?.[0]?.mint?.slice(0, 8);
      }
      timeline.push(entry);
    }
    timeline.sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json({
      score,
      label,
      drivers,
      profile: {
        id: profile.id,
        username: profile.username,
        bio: profile.bio,
        namespace: profile.namespace,
        wallet,
      },
      stats: {
        posts: posts.length,
        transactions: txs.length,
        swaps: swaps.length,
        tokensmentioned: [...mentions.entries()].map(([k, v]) => ({ token: k, count: v })),
        tokensTraded: [...tradedSymbols],
      },
      timeline,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

function generatePostIds(profileId: string): string[] {
  const prefixes: Record<string, { prefix: string; count: number }> = {
    alpha_pumper: { prefix: "pump", count: 5 },
    solana_builder: { prefix: "build", count: 3 },
    moon_signals: { prefix: "bot", count: 8 },
  };

  const config = prefixes[profileId];
  if (!config) return [];

  return Array.from({ length: config.count }, (_, i) =>
    `${config.prefix}-${String(i + 1).padStart(3, "0")}`
  );
}

