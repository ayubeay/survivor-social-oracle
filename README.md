# Survivor Social Oracle

**Risk intelligence for onchain social behavior.**

Built for the [Solana Graveyard Hack 2026](https://www.colosseum.org) — Onchain Social track (Tapestry bounty).

> "Onchain social didn't fail because of UX — it failed because users can't see coordinated manipulation."

## Live Demo

**[survivor-social-oracle.vercel.app](https://survivor-social-oracle.vercel.app)**

## What It Does

Correlates Tapestry social posts with Helius wallet transaction data to detect:

- **Promote → Exit** — shill tokens then dump (35% weight)
- **Shill Clustering** — same token promoted repeatedly (15%)
- **Token Concentration** — many posts about few tokens (15%)
- **Spam Pattern** — shotgun promotion across 6+ tokens (15%)
- **Engagement Authenticity** — post/transaction ratio (10%)
- **Wallet Age** — new wallets with aggressive behavior (10%)

Every score is deterministic and auditable. No ML black boxes.

## Architecture
```
Tapestry Social API ──┐
                      ├── Correlation Engine ── Scoring Engine ── Next.js UI
Helius TX History ────┘
```

## Demo Profiles

| Profile | Score | Pattern |
|---------|-------|---------|
| solana_builder | 20 LOW | Clean dev, no token promotion |
| degen_trader | 35 MEDIUM | Promotes $SOL, wallet has real swaps |
| alpha_pumper | 40 MEDIUM | Repeated $BONK/$WIF/$POPCAT shilling |
| moon_signals | 49 MEDIUM | Spam across 8 different tokens |

## Quick Start
```bash
npm install
cp .env.example .env.local  # Add TAPESTRY_API_KEY and HELIUS_API_KEY
npm run dev
```

## Tech Stack

- [Tapestry Protocol](https://usetapestry.dev) — Social graph + posts
- [Helius](https://helius.dev) — Solana transaction history
- Next.js 14 + Tailwind CSS

## API

**POST /api/score**
```json
{ "profileId": "alpha_pumper" }
{ "wallet": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" }
```

Returns: score (0-100), label, risk drivers, profile stats, activity timeline.

## License

MIT
