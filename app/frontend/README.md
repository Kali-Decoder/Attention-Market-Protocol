# Reelify Frontend

Prediction market UI for the Attention Market Protocol on Solana.

## Demo flow

1. **Start local validator + deploy program**
   ```bash
   anchor test
   # or: solana-test-validator & anchor deploy
   ```

2. **Seed demo markets** (one-time per validator session)
   ```bash
   npm run seed:demo
   ```
   Or use the in-app **Demo Setup** page (`/create`) after connecting your wallet.

3. **Run the frontend**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173

4. **Connect wallet** (Phantom / Solflare on localhost)

5. **Browse markets** → click a card → bet Over/Under with SOL

## Pages

| Route | Purpose |
| ----- | ------- |
| `/` | Browse live & settled markets |
| `/markets/:platform/:contentId` | Market detail + bet panel |
| `/my-bets` | Your positions & claims |
| `/create` | Seed demo markets on localnet |
| `/wallet` | Wallet balance & disconnect |

## Environment

Copy `.env.exmaple` to `.env.local`:

```
PUBLIC_SOLANA_RPC_URL=http://127.0.0.1:8899
PUBLIC_PROGRAM_ID=4BD12VMRQiPgG8dtvW2BaMgZW2QiVzG9CESRHGGP9u1j
```

## Demo markets

Six pre-configured markets (TikTok, Instagram, YouTube) with titles, thresholds, and deadlines. Metadata lives in `src/lib/demoMarkets.ts`; on-chain state is created via seed script or `/create` page.
