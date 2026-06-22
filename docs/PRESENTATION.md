# 2-Minute Presentation — Reelify

**Hard limit:** 3 minutes · **Target:** 2 minutes · **Have this repo open and terminal ready before you're called.**

---

## Pre-flight (do this 5 minutes before)

```bash
# Terminal 1 — frontend (already running is best)
cd app/frontend && npm run dev
# → http://localhost:5173

# Terminal 2 — tests (ready to paste one command)
cd attention-market-protocol
solana config set --url devnet
npm run test:devnet          # devnet happy path (market + betting)
# OR for full settlement flow on local validator:
anchor test                  # all tests green, ~30s
```

- Phantom/Solflare on **Devnet**, wallet funded
- Browser tab: homepage reel feed
- Second tab: Solana Explorer program page (link below)
- Optional: pre-record `anchor test` or `npm run test:devnet` as backup

**Devnet Program ID:** `Ex4u9eFj65N9SQ1o5yCCCHuBuTPbhcnfEGi6W5tWuoq`  
**Explorer:** https://explorer.solana.com/address/Ex4u9eFj65N9SQ1o5yCCCHuBuTPbhcnfEGi6W5tWuoq?cluster=devnet

---

## 2-minute script (≈250 words)

| Time | What to show | What to say |
| ---- | ------------ | ----------- |
| **0:00–0:25** | Slide 1 or README title | "Creators and brands can't easily price short-form content before it goes viral. Reelify is a Solana prediction market: users bet SOL on whether a reel hits an engagement target by a deadline — Over or Under." |
| **0:25–0:50** | Slide 2 (architecture) or `lib.rs` | "On-chain Anchor program handles markets, escrow vaults, bets, settlement, and payouts. Off-chain oracle feeds engagement later; for the demo we simulate live views and engagement in the UI." |
| **0:50–1:25** | **Frontend** — reel feed | "Here's the live demo on devnet. Vertical feed of markets — swipe between TikTok, Instagram, YouTube. Views tick up; engagement moves toward the target. I connect my wallet, pick Over or Under, and stake devnet SOL. My Bets shows my position and claim flow after settlement." |
| **1:25–1:55** | **Terminal** — `npm run test:devnet` | "Program is deployed to devnet at this ID. Tests create markets, place Over/Under bets, settle, claim, and close — the full happy path. [Run command or play recording.] All passing." |
| **1:55–2:00** | Explorer or README | "Program ID and test screenshot are in the README. Happy to take questions." |

---

## 5 slides (optional — paste into Google Slides / Canva)

### Slide 1 — Problem
- Short-form content engagement is unpredictable
- No on-chain way to bet on *will this reel hit X views by Friday?*
- Creators, fans, and traders want skin in the game

### Slide 2 — Solution
- **Reelify** = prediction market on Solana (Anchor)
- Bet **Over** or **Under** an engagement threshold
- Winners split the losing pool (minus 2% protocol fee)

### Slide 3 — On-chain design
- `Config` → `Market` → `Bet` + vault PDA
- Instructions: initialize → create market → place bet → settle → claim → close
- Platforms: Instagram, TikTok, YouTube

### Slide 4 — Frontend demo
- Reel-style market feed
- Wallet connect (Phantom / Solflare, devnet)
- Live simulated engagement + real on-chain bets

### Slide 5 — Devnet + tests
- **Program ID:** `Ex4u9eFj65N9SQ1o5yCCCHuBuTPbhcnfEGi6W5tWuoq`
- `npm run test:devnet` — market, betting, settlement suite
- README + Explorer link

---

## Live demo flow (frontend, ~35 seconds)

1. **Home** — swipe reel feed; point out views ↑ and engagement meter
2. **Tap Over** on a market → market detail
3. **Connect wallet** (if needed) → bet 0.1 SOL Over
4. **My Bets** — show active position (side, stake, status)
5. *(Optional if time)* Explorer → program ID

---

## Test demo (terminal, ~25 seconds)

**Option A — Devnet (matches submission):**
```bash
npm run test:devnet
```
Shows: config, create market, Over/Under bets. Settlement tests run when your wallet is protocol authority.

**Option B — Full happy path (best for live screen share):**
```bash
anchor test
```
Local validator + deploy + all tests including settle, claim, close.

**Backup:** Pre-record Option B; play if network is slow.

---

## One-liners for Q&A

- **Why Solana?** Fast, cheap txs; PDAs for escrow without a custom token in v1.
- **Oracle?** Authority calls `settle_market` with observed engagement; fetcher service is roadmap.
- **What's simulated?** Live view/engagement numbers in UI; bets and SOL are real on devnet.
