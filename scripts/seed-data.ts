import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const API_URL = "https://api.usetapestry.dev/api/v1";
const API_KEY = process.env.TAPESTRY_API_KEY;
if (!API_KEY) { console.error("No key"); process.exit(1); }

async function post(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}?apiKey=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function createProfile(username: string, wallet: string, bio: string) {
  console.log(`Creating profile: ${username}`);
  const r = await post("/profiles/findOrCreate", {
    walletAddress: wallet, username, bio,
    blockchain: "SOLANA", execution: "FAST_UNCONFIRMED",
  });
  console.log(`  ${r.status} — ${r.data?.operation || "OK"}`);
}

async function createContent(id: string, profileId: string, content: string) {
  const r = await post("/contents/findOrCreate", {
    id, profileId,
    properties: [
      { key: "content", value: content },
      { key: "contentType", value: "text" },
    ],
    blockchain: "SOLANA", execution: "FAST_UNCONFIRMED",
  });
  console.log(`  ${id}: ${r.status} — ${content.slice(0, 50)}`);
}

async function main() {
  console.log("=== SEEDING TEST DATA ===\n");

  console.log("--- Profile 1: alpha_pumper (SUSPICIOUS) ---");
  await createProfile("alpha_pumper", "DYw8jCTfBox68YbcEhfjNkSwEPLk9AV9MiDsqNRVYJCp", "Early alpha calls. 100x or nothing.");
  await createContent("pump-001", "alpha_pumper", "$BONK about to rip hard, load up before it moons");
  await createContent("pump-002", "alpha_pumper", "Still early on $BONK. If you are not in you are ngmi");
  await createContent("pump-003", "alpha_pumper", "$WIF looking absolutely bullish. Aping in heavy");
  await createContent("pump-004", "alpha_pumper", "Told you about $WIF. Already 3x. Next target $POPCAT");
  await createContent("pump-005", "alpha_pumper", "$POPCAT is the next 10x. Buying more now");

  console.log("\n--- Profile 2: solana_builder (CLEAN) ---");
  await createProfile("solana_builder", "7nYB8sCeLNqjXvRUY5QBnGXAH1QCfJJfmYMaDbBwvxKB", "Building on Solana. Shipping code not alpha.");
  await createContent("build-001", "solana_builder", "Just deployed our new smart contract for onchain governance");
  await createContent("build-002", "solana_builder", "Working on integrating Tapestry social features into our dApp");
  await createContent("build-003", "solana_builder", "Shipped a bug fix for our token vesting contract");

  console.log("\n--- Profile 3: moon_signals (BOT-LIKE) ---");
  await createProfile("moon_signals", "3Kp2jd5S8nGrTDkhaT4YmvqVdaXjJQHGFnCPVPBkR8st", "FREE ALPHA. Follow for 100x calls daily");
  const tokens = ["$MYRO", "$BOME", "$SLERF", "$MEW", "$TNSR", "$JUP", "$KMNO", "$RENDER"];
  for (let i = 0; i < 8; i++) {
    await createContent(`bot-${String(i+1).padStart(3,"0")}`, "moon_signals", `${tokens[i]} is about to EXPLODE. Do not miss this gem. Easy 10x from here`);
  }

  console.log("\n=== DONE ===");
  console.log("  alpha_pumper  — SUSPICIOUS");
  console.log("  solana_builder — CLEAN");
  console.log("  moon_signals  — BOT-LIKE");
}

main().catch(console.error);
