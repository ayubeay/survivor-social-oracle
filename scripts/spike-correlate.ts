import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const T_URL = "https://api.usetapestry.dev/api/v1";
const H_URL = "https://api.helius.xyz/v0";
const T_KEY = process.env.TAPESTRY_API_KEY;
const H_KEY = process.env.HELIUS_API_KEY;
if (!T_KEY || !H_KEY) { console.error("Need both API keys"); process.exit(1); }

async function main() {
  const profileId = process.argv[2] || "alpha_pumper";
  console.log(`=== SCORING: ${profileId} ===\n`);

  // Get profile + wallet
  const pRes = await fetch(`${T_URL}/profiles/${profileId}?apiKey=${T_KEY}`);
  if (!pRes.ok) { console.error("Profile not found"); process.exit(1); }
  const pData = await pRes.json();
  const wallet = pData.walletAddress;
  console.log(`Profile: ${pData.profile.username}`);
  console.log(`Wallet: ${wallet}\n`);

  // Get posts
  const postIds = profileId === "alpha_pumper"
    ? ["pump-001","pump-002","pump-003","pump-004","pump-005"]
    : profileId === "solana_builder"
    ? ["build-001","build-002","build-003"]
    : ["bot-001","bot-002","bot-003","bot-004","bot-005","bot-006","bot-007","bot-008"];

  const posts: any[] = [];
  for (const pid of postIds) {
    const r = await fetch(`${T_URL}/contents/${pid}?apiKey=${T_KEY}`);
    if (r.ok) { const d = await r.json(); posts.push(d.content || d); }
  }
  console.log(`Posts: ${posts.length}`);

  // Extract token mentions
  const mentions = new Map<string, number>();
  for (const p of posts) {
    const tickers = (p.content || "").match(/\$([A-Z]{2,10})/g) || [];
    tickers.forEach((t: string) => {
      const clean = t.replace("$", "");
      mentions.set(clean, (mentions.get(clean) || 0) + 1);
    });
  }
  console.log(`Tokens mentioned: ${[...mentions.entries()].map(([k,v]) => `${k}(${v}x)`).join(", ") || "none"}`);

  // Get wallet txs
  const txRes = await fetch(`${H_URL}/addresses/${wallet}/transactions?api-key=${H_KEY}&limit=20`);
  const txs = txRes.ok ? await txRes.json() : [];
  const swaps = txs.filter((t: any) => t.type === "SWAP");
  console.log(`Transactions: ${txs.length} (${swaps.length} swaps)\n`);

  // SCORE
  let score = 0;
  const drivers: string[] = [];

  // 1. Shill clustering
  const maxMentions = Math.max(0, ...mentions.values());
  if (maxMentions >= 2) {
    const pts = Math.min(20, maxMentions * 7);
    score += pts;
    drivers.push(`Shill Clustering: token promoted ${maxMentions}x (+${pts})`);
  }

  // 2. Token concentration
  const uniqueTokens = mentions.size;
  if (uniqueTokens > 0 && posts.length / uniqueTokens > 2) {
    score += 15;
    drivers.push(`Token Concentration: ${posts.length} posts across only ${uniqueTokens} tokens (+15)`);
  }

  // 3. Engagement authenticity
  if (posts.length > 0 && txs.length === 0) {
    score += 20;
    drivers.push(`Engagement Auth: ${posts.length} posts but zero on-chain txs (+20)`);
  } else if (posts.length > txs.length * 2) {
    score += 10;
    drivers.push(`Engagement Auth: ${posts.length} posts vs ${txs.length} txs — unbalanced (+10)`);
  }

  // 4. Spam pattern (8+ token calls)
  if (uniqueTokens >= 6) {
    score += 15;
    drivers.push(`Spam Pattern: ${uniqueTokens} different tokens promoted (+15)`);
  }

  // 5. Promote-exit (if swap data overlaps with mentions)
  const tradedSymbols = new Set<string>();
  for (const tx of swaps) {
    const s = tx.events?.swap;
    if (s?.tokenInputs?.[0]?.symbol) tradedSymbols.add(s.tokenInputs[0].symbol);
    if (s?.tokenOutputs?.[0]?.symbol) tradedSymbols.add(s.tokenOutputs[0].symbol);
  }
  const overlap = [...mentions.keys()].filter(t => tradedSymbols.has(t));
  if (overlap.length > 0) {
    const pts = Math.min(35, overlap.length * 15);
    score += pts;
    drivers.push(`Promote-Exit: ${overlap.join(",")} both promoted AND traded (+${pts})`);
  }

  score = Math.min(100, score);
  const label = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

  console.log("=".repeat(40));
  console.log(`RISK SCORE: ${score}/100 — ${label}`);
  console.log("=".repeat(40));
  for (const d of drivers) console.log(`  * ${d}`);
  if (drivers.length === 0) console.log("  * No risk patterns detected");
  console.log("");
}

main().catch(console.error);
