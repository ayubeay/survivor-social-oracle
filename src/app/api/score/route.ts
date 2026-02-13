import { NextRequest, NextResponse } from "next/server";

const TAPESTRY_URL = "https://api.usetapestry.dev/api/v1";
const HELIUS_URL = "https://api.helius.xyz/v0";

function tKey() { return process.env.TAPESTRY_API_KEY || ""; }
function hKey() { return process.env.HELIUS_API_KEY || ""; }

function getPostText(p: any): string {
  if (typeof p.content === "string") return p.content;
  if (typeof p.content === "object" && p.content?.content) return String(p.content.content);
  if (Array.isArray(p.properties)) {
    const found = p.properties.find((pr: any) => pr.key === "content");
    if (found) return String(found.value);
  }
  return "";
}

function generatePostIds(profileId: string): string[] {
  const prefixes: Record<string, { prefix: string; count: number }> = {
    alpha_pumper: { prefix: "pump", count: 5 },
    solana_builder: { prefix: "build", count: 3 },
    moon_signals: { prefix: "bot", count: 8 },
    degen_trader: { prefix: "degen", count: 4 },
    rug_master: { prefix: "rug", count: 13 },
  };
  const config = prefixes[profileId];
  if (!config) return [];
  return Array.from({ length: config.count }, (_, i) =>
    `${config.prefix}-${String(i + 1).padStart(3, "0")}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileId, wallet: inputWallet } = body;
    if (!profileId && !inputWallet) {
      return NextResponse.json({ error: "profileId or wallet required" }, { status: 400 });
    }

    let wallet = inputWallet || "";
    let profile: any = null;

    if (profileId) {
      const pRes = await fetch(`${TAPESTRY_URL}/profiles/${profileId}?apiKey=${tKey()}`);
      if (!pRes.ok) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      const pData = await pRes.json();
      wallet = pData.walletAddress || wallet;
      profile = pData.profile;
    } else if (inputWallet) {
      try {
        const sr = await fetch(`${TAPESTRY_URL}/search/profiles?apiKey=${tKey()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: inputWallet, limit: 5, offset: 0 }),
        });
        if (sr.ok) {
          const sd = await sr.json();
          const ps = sd.profiles || (Array.isArray(sd) ? sd : []);
          if (ps.length > 0) { profile = ps[0].profile || ps[0]; wallet = ps[0].walletAddress || inputWallet; }
        }
      } catch {}
      if (!profile) {
        profile = { id: inputWallet.slice(0,8), username: inputWallet.slice(0,4)+"..."+inputWallet.slice(-4), bio: "Wallet-only analysis", namespace: "unknown" };
      }
    }

    const possibleIds = generatePostIds(profileId || profile?.id || "");
    const posts: any[] = [];
    for (const pid of possibleIds) {
      try { const r = await fetch(`${TAPESTRY_URL}/contents/${pid}?apiKey=${tKey()}`); if (r.ok) { const d = await r.json(); posts.push(d.content || d); } } catch {}
    }
    try {
      const lr = await fetch(`${TAPESTRY_URL}/contents?apiKey=${tKey()}&profileId=${profileId || profile?.id || ""}&limit=50`);
      if (lr.ok) { const ld = await lr.json(); const listed = Array.isArray(ld) ? ld : ld.contents || []; for (const c of listed) { if (!posts.find((p: any) => p.id === c.id)) posts.push(c); } }
    } catch {}

    let txs: any[] = []; let swaps: any[] = [];
    if (wallet && hKey()) {
      try { const tr = await fetch(`${HELIUS_URL}/addresses/${wallet}/transactions?api-key=${hKey()}&limit=30`); if (tr.ok) { txs = await tr.json(); swaps = txs.filter((t: any) => t.type === "SWAP" || t.events?.swap); } } catch {}
    }

    const mentions = new Map<string, number>();
    for (const p of posts) { const text = getPostText(p); const tickers = text.match(/\$([A-Z]{2,10})/g) || []; tickers.forEach((t: string) => { const c = t.replace("$",""); mentions.set(c, (mentions.get(c)||0)+1); }); }

    const tradedSymbols = new Set<string>();
    for (const tx of swaps) {
      const s = tx.events?.swap;
      if (s == null) { continue; }
      if (s.nativeInput) tradedSymbols.add('SOL');
      if (s.nativeOutput) tradedSymbols.add('SOL');
      if (s.tokenInputs?.[0]?.symbol) tradedSymbols.add(s.tokenInputs[0].symbol);
      if (s.tokenOutputs?.[0]?.symbol) tradedSymbols.add(s.tokenOutputs[0].symbol);
      if (s.tokenInputs?.[0]?.mint) tradedSymbols.add(s.tokenInputs[0].mint.slice(0,8));
      if (s.tokenOutputs?.[0]?.mint) tradedSymbols.add(s.tokenOutputs[0].mint.slice(0,8));
    }

    let score = 0;
    const drivers: Array<{factor:string;points:number;evidence:string}> = [];
    const maxM = Math.max(0,...mentions.values());
    if (maxM >= 2) { const pts = Math.min(20, maxM*7); score += pts; drivers.push({factor:"Shill Clustering",points:pts,evidence:`Same token promoted ${maxM}x across posts`}); }
    const uT = mentions.size;
    if (uT > 0 && posts.length/uT > 2) { score += 15; drivers.push({factor:"Token Concentration",points:15,evidence:`${posts.length} posts promoting only ${uT} token(s)`}); }
    if (posts.length > 0 && txs.length === 0) { score += 20; drivers.push({factor:"Engagement Authenticity",points:20,evidence:`${posts.length} social posts but zero on-chain transactions`}); } else if (posts.length > txs.length*2) { score += 10; drivers.push({factor:"Engagement Authenticity",points:10,evidence:`${posts.length} posts vs ${txs.length} transactions`}); }
    if (uT >= 6) { score += 15; drivers.push({factor:"Spam Pattern",points:15,evidence:`${uT} different tokens promoted — shotgun approach`}); }
    const overlap = [...mentions.keys()].filter(t => tradedSymbols.has(t));
    if (overlap.length > 0) {
      const pts = Math.min(35, overlap.length * 15);
      score += pts;
      const evidence = overlap.join(", ") + " promoted in posts AND traded on-chain (" + swaps.length + " swaps detected)";
      drivers.push({factor:"Promote \u2192 Exit",points:pts,evidence:evidence});
    }
    score = Math.min(100, score);
    const label = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

    const timeline: any[] = [];
    for (const p of posts) { const text = getPostText(p); timeline.push({timestamp:p.created_at||0,type:"post",content:text,tokens:text.match(/\$([A-Z]{2,10})/g)||[]}); }
    for (const tx of txs.slice(0,10)) {
      const isSwap = tx.type === "SWAP" || tx.events?.swap;
      const e: any = {
        timestamp: (tx.timestamp || 0) * 1000,
        type: isSwap ? "swap" : "tx",
        content: tx.type + " via " + (tx.source || "unknown"),
        signature: tx.signature,
      };
      if (tx.events?.swap) {
        const s = tx.events.swap;
        const inSym = s.nativeInput ? "SOL" : (s.tokenInputs?.[0]?.symbol || s.tokenInputs?.[0]?.mint?.slice(0,6) || "?");
        const outSym = s.nativeOutput ? "SOL" : (s.tokenOutputs?.[0]?.symbol || s.tokenOutputs?.[0]?.mint?.slice(0,6) || "?");
        e.tokenIn = inSym;
        e.tokenOut = outSym;
        e.content = inSym + " -> " + outSym + " via " + (tx.source || "unknown");
      }
      timeline.push(e);
    }
    timeline.sort((a,b) => a.timestamp - b.timestamp);

    return NextResponse.json({ score, label, drivers, profile: { id:profile.id, username:profile.username, bio:profile.bio, namespace:profile.namespace, wallet }, stats: { posts:posts.length, transactions:txs.length, swaps:swaps.length, tokensmentioned:[...mentions.entries()].map(([k,v])=>({token:k,count:v})), tokensTraded:[...tradedSymbols] }, timeline });
  } catch (err: any) { return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 }); }
}
