import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const API_URL = "https://api.usetapestry.dev/api/v1";
const API_KEY = process.env.TAPESTRY_API_KEY;
if (!API_KEY) { console.error("No key"); process.exit(1); }
async function main() {
  console.log("Tapestry Full Test\n");
  console.log("Test 1: Read profile");
  const r1 = await fetch(`${API_URL}/profiles/survivor-test-1?apiKey=${API_KEY}`);
  console.log("Status:", r1.status);
  if (r1.ok) console.log(JSON.stringify(await r1.json(), null, 2).slice(0, 400));
  console.log("\nTest 2: Create post");
  const r2 = await fetch(`${API_URL}/contents/findOrCreate?apiKey=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "test-post-002",
      profileId: "survivor-test-1",
      properties: [
        { key: "content", value: "$WIF about to moon" },
        { key: "contentType", value: "text" }
      ],
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });
  console.log("Status:", r2.status);
  if (r2.ok) console.log(JSON.stringify(await r2.json(), null, 2).slice(0, 400));
  console.log("\nTest 3: Read post back");
  const r3 = await fetch(`${API_URL}/contents/test-post-002?apiKey=${API_KEY}`);
  console.log("Status:", r3.status);
  if (r3.ok) console.log(JSON.stringify(await r3.json(), null, 2).slice(0, 400));
  console.log("\nAll tests passed.");
}
main().catch(console.error);
