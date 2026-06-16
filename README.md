# Reelify — Attention Market Protocol

An on-chain prediction market on Solana where users stake on the future
engagement of short-form content (Instagram Reels, TikToks, YouTube Shorts).

## Project Structure

```
attention-market-protocol/
├── programs/attention-market-protocol/
│   └── src/
│       ├── instructions/     # initialize_market, place_bet, settle_market, ...
│       ├── state/          # market, bet, config accounts
│       ├── errors.rs
│       ├── constants.rs
│       └── lib.rs
├── app/
│   ├── frontend/           # React frontend (placeholder)
│   └── api/                # engagement-fetcher, settlement-service (placeholder)
├── tests/
│   ├── market.test.ts
│   ├── betting.test.ts
│   └── settlement.test.ts
└── docs/
    ├── architecture.md    # Full protocol architecture (diagrams, accounts, CPIs, errors)
    ├── diagrams.md        # Standalone Mermaid diagrams for rendering/export
    └── user-flows.md
```

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solanalabs.com/cli/install)
- [Anchor](https://www.anchor-lang.com/docs/installation) v0.32+
- Node.js 18+

## Build

```bash
anchor build
```

## Test

```bash
anchor test
```

## Program Instructions

| Instruction         | Description                                      |
| ------------------- | ------------------------------------------------ |
| `initialize_config` | Bootstrap global protocol config (one-time)      |
| `initialize_market` | Create a prediction market for a piece of content |
| `place_bet`         | Stake SOL on Over or Under the engagement target  |
| `settle_market`     | Record final engagement and determine outcome     |
| `claim_reward`      | Winners claim proportional share of losing pool   |
| `close_market`      | Close settled market and reclaim rent             |

## Program ID (localnet)

```
4BD12VMRQiPgG8dtvW2BaMgZW2QiVzG9CESRHGGP9u1j
```

## Documentation

| Doc | Contents |
| --- | -------- |
| [architecture.md](./docs/architecture.md) | Program structure, account mapping, CPI matrix, external integrations, error paths, checklist |
| [diagrams.md](./docs/diagrams.md) | Standalone Mermaid diagrams (system context, lifecycle, CPI sequences) |
| [user-flows.md](./docs/user-flows.md) | Step-by-step user journeys |

## Next Steps

- [ ] Engagement oracle integration (Instagram / TikTok / YouTube APIs)
- [ ] Frontend with wallet adapter
- [ ] SPL token support for betting
- [ ] Market discovery indexing
# Attention-Market-Protocol-
