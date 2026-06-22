# Reelify Frontend

Prediction market UI for the Attention Market Protocol on Solana devnet.

## Devnet setup

```bash
cp .env.exmaple .env.local
npm install
npm run dev
```

**Required env vars:**

```
PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
PUBLIC_PROGRAM_ID=Ex4u9eFj65N9SQ1o5yCCCHuBuTPbhcnfEGi6W5tWuoq
```

In Phantom/Solflare: switch network to **Devnet** and request devnet SOL from a faucet.

## Demo flow

1. Connect wallet (Devnet)
2. **Demo Setup** (`/create`) → Seed all demo markets
3. **Markets** (`/`) → browse and click a market
4. Place Over/Under bet with devnet SOL
5. **My Bets** (`/my-bets`) → view positions

## Pages

| Route | Purpose |
| ----- | ------- |
| `/` | Browse live markets |
| `/markets/:platform/:contentId` | Market detail + bet panel |
| `/my-bets` | Your positions |
| `/create` | Seed demo markets on devnet |
| `/wallet` | Wallet info |
