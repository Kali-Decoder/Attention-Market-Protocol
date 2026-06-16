# Reelify — Attention Market Protocol Architecture

## Overview

Reelify is an on-chain prediction market protocol on Solana where users stake SOL on whether
a piece of short-form content will exceed (or fall below) an engagement threshold by a
deadline. This document maps program structure, accounts, CPIs, external integrations,
user flows, and error paths per Solana protocol architecture standards.

---

## Legend

| Symbol / Color | Meaning |
| -------------- | ------- |
| Blue box | On-chain Anchor program |
| Green box | Program-owned account (PDA) |
| Yellow box | User-owned account (signer / wallet) |
| Gray cylinder | Off-chain database / indexer |
| Cloud shape | External API service |
| Hexagon | Oracle / settlement authority |
| Solid arrow | Instruction call or control flow |
| Dashed arrow | Off-chain / async data flow |
| Diamond | Decision point |

---

## 1. Program Structure Visualization

Reelify v1 ships as a **single Anchor program** with six instructions. Off-chain services
handle engagement data fetching and settlement submission. Future versions may split into
separate programs (e.g. oracle registry, SPL token vault).

```mermaid
flowchart TB
    subgraph ONCHAIN["On-Chain Layer"]
        AMP["attention_market_protocol<br/>Program ID: 4BD12VMR..."]

        subgraph INSTRUCTIONS["Instructions"]
            IX1["initialize_config"]
            IX2["initialize_market"]
            IX3["place_bet"]
            IX4["settle_market"]
            IX5["claim_reward"]
            IX6["close_market"]
        end

        AMP --> INSTRUCTIONS
    end

    subgraph OFFCHAIN["Off-Chain Layer"]
        FE["Frontend<br/>(React + Wallet Adapter)"]
        EF[("Engagement Fetcher<br/>DB / Cache")]
        SS{{"Settlement Service<br/>(Oracle Authority)"}}
    end

    subgraph EXTERNAL["External Integrations"]
        IG["Instagram API"]
        TT["TikTok API"]
        YT["YouTube API"]
    end

    subgraph SOLANA["Solana Runtime"]
        SYS["System Program"]
    end

    FE -->|"initialize_market<br/>place_bet<br/>claim_reward"| AMP
    SS -->|"settle_market<br/>close_market"| AMP
    AMP -->|"CPI: transfer"| SYS

    EF -.->|"poll engagement"| IG
    EF -.->|"poll engagement"| TT
    EF -.->|"poll engagement"| YT
    SS -.->|"read final_engagement"| EF

    style AMP fill:#4A90D9,color:#fff
    style SYS fill:#888,color:#fff
    style FE fill:#E8F4FD
    style SS fill:#F5A623,color:#fff
    style EF fill:#D5E8D4
```

### Program Responsibilities

| Component | Responsibility |
| --------- | -------------- |
| `attention_market_protocol` | Market lifecycle, bet escrow, settlement logic, reward distribution |
| System Program | SOL transfers (user → vault on bet, vault → user on claim) |
| Engagement Fetcher | Polls social APIs, stores engagement snapshots |
| Settlement Service | Reads oracle data, submits `settle_market` as protocol authority |
| Frontend | Wallet connection, market discovery, bet placement, claim UI |

### Instruction → CPI Matrix

| Instruction | CPI Target | CPI Operation | Direction |
| ----------- | ---------- | ------------- | --------- |
| `place_bet` | System Program | `transfer` | User wallet → Vault PDA |
| `claim_reward` | System Program | `transfer` (PDA signer) | Vault PDA → User wallet |
| All `init` instructions | System Program | Account creation (via Anchor) | Payer → new accounts |

No cross-program invocations to SPL Token or Metaplex in v1. SOL-only escrow.

---

## 2. Account Structure Mapping

### Account Hierarchy

```mermaid
flowchart TB
    subgraph PROTOCOL["Protocol Scope (singleton)"]
        CONFIG["Config PDA<br/>seeds: ['config']<br/>Owner: AMP program"]
    end

    subgraph MARKET_SCOPE["Per-Market Scope"]
        MARKET["Market PDA<br/>seeds: ['market', content_id, platform]<br/>Owner: AMP program"]
        VAULT["Vault PDA<br/>seeds: ['vault', market]<br/>Owner: System Program<br/>Type: Lamport holder"]
    end

    subgraph USER_SCOPE["Per-User Per-Market"]
        BET["Bet PDA<br/>seeds: ['bet', market, user]<br/>Owner: AMP program"]
    end

    subgraph WALLETS["User Wallets"]
        CREATOR["Creator Wallet<br/>Signer"]
        BETTOR["Bettor Wallet<br/>Signer"]
        AUTHORITY["Protocol Authority<br/>Signer"]
    end

    CONFIG -->|"governs fee + authority"| MARKET
    MARKET -->|"1:1 escrow"| VAULT
    MARKET -->|"1:N positions"| BET
    CREATOR -->|"creates"| MARKET
    BETTOR -->|"stakes via"| BET
    BETTOR -->|"SOL flows to"| VAULT
    AUTHORITY -->|"settles / closes"| MARKET

    style CONFIG fill:#90EE90
    style MARKET fill:#90EE90
    style VAULT fill:#90EE90
    style BET fill:#90EE90
    style CREATOR fill:#FFFACD
    style BETTOR fill:#FFFACD
    style AUTHORITY fill:#FFFACD
```

### Account Detail Table

| Account | Type | Owner | Seeds | Primary Data |
| ------- | ---- | ----- | ----- | ------------ |
| **Config** | PDA | AMP | `["config"]` | `authority`, `fee_bps`, `total_markets`, `bump` |
| **Market** | PDA | AMP | `["market", content_id, platform_byte]` | `creator`, `platform`, `content_id`, `engagement_threshold`, `deadline`, `total_over`, `total_under`, `status`, `outcome`, `final_engagement`, bumps |
| **Bet** | PDA | AMP | `["bet", market, user]` | `market`, `user`, `side`, `amount`, `claimed`, `bump` |
| **Vault** | PDA | System Program | `["vault", market]` | Lamports (escrowed SOL) |
| **User Wallet** | Signer | User | — | SOL balance, transaction signer |

### PDA Derivation Flow

```mermaid
flowchart LR
    PROG["AMP Program ID"] --> CONFIG_D["find_program_address<br/>['config']"]
    PROG --> MARKET_D["find_program_address<br/>['market', content_id, platform]"]
    MARKET_D --> VAULT_D["find_program_address<br/>['vault', market_pubkey]"]
    MARKET_D --> BET_D["find_program_address<br/>['bet', market_pubkey, user_pubkey]"]

    CONFIG_D --> CONFIG["Config Account"]
    MARKET_D --> MARKET["Market Account"]
    VAULT_D --> VAULT["Vault (lamports only)"]
    BET_D --> BET["Bet Account"]

    style PROG fill:#4A90D9,color:#fff
    style CONFIG fill:#90EE90
    style MARKET fill:#90EE90
    style VAULT fill:#90EE90
    style BET fill:#90EE90
```

### Market State Machine

```mermaid
stateDiagram-v2
    [*] --> Open : initialize_market
    Open --> Open : place_bet
    Open --> Settled : settle_market
    Settled --> Settled : claim_reward
    Settled --> Closed : close_market
    Closed --> [*]
```

---

## 3. External Dependencies and Integrations

```mermaid
flowchart LR
    subgraph REELIFY["Reelify Stack"]
        AMP["AMP Program"]
        FE["Frontend"]
        EF[("Engagement DB")]
        SS{{"Settlement Oracle"}}
    end

    subgraph SOCIAL["Social Platform APIs ☁"]
        IG["Instagram Graph API"]
        TT["TikTok API"]
        YT["YouTube Data API"]
    end

    subgraph SOLANA_EXT["Solana Infrastructure"]
        RPC["Solana RPC Node"]
        IDX[("Indexer / Helius")]
        WAL["Wallet Adapter<br/>Phantom · Solflare"]
    end

    FE --> WAL
    FE --> RPC
    FE --> AMP
    EF --> IG
    EF --> TT
    EF --> YT
    SS --> EF
    SS --> RPC
    SS --> AMP
    IDX -.->|"market + bet events"| FE

    style IG fill:#E8F4FD
    style TT fill:#E8F4FD
    style YT fill:#E8F4FD
    style SS fill:#F5A623,color:#fff
    style EF fill:#D5E8D4
```

| Integration | Shape | Role | Connection Point |
| ----------- | ----- | ---- | ---------------- |
| Instagram / TikTok / YouTube APIs | Cloud | Engagement data source | Engagement Fetcher polls on interval |
| Engagement DB | Cylinder | Cached metrics, historical snapshots | Settlement Service reads at deadline |
| Settlement Oracle | Hexagon | Trusted authority for `settle_market` | Signs with Config.authority key |
| Solana RPC | Cloud | Transaction submission | Frontend + Settlement Service |
| Indexer | Cylinder | Market discovery, bet history | Frontend read path |

---

## 4. User Interaction Flows

### 4a. Market Creation (Creator)

```mermaid
flowchart TD
    START([Creator opens app]) --> CONNECT{Wallet connected?}
    CONNECT -->|No| WALLET[Connect wallet]
    WALLET --> CONNECT
    CONNECT -->|Yes| FORM[Fill content ID, platform,<br/>threshold, deadline]
    FORM --> VALID{Valid inputs?}
    VALID -->|No| ERR1[Show validation error]
    ERR1 --> FORM
    VALID -->|Yes| TX1["initialize_market"]
    TX1 --> CREATED[Market PDA + Vault PDA created<br/>Status: Open]
    CREATED --> END([Market listed])

    style VALID fill:#FFD700
    style ERR1 fill:#FF6B6B,color:#fff
```

### 4b. Bet Placement (Bettor)

```mermaid
flowchart TD
    START([Bettor selects market]) --> SIDE[Choose Over or Under]
    SIDE --> AMT[Enter SOL amount]
    AMT --> CHECK1{Market Open?}
    CHECK1 -->|No| ERR1[Error: MarketNotOpen]
    CHECK1 -->|Yes| CHECK2{Before deadline?}
    CHECK2 -->|No| ERR2[Error: MarketExpired]
    CHECK2 -->|Yes| CHECK3{Amount > 0?}
    CHECK3 -->|No| ERR3[Error: ZeroBetAmount]
    CHECK3 -->|Yes| TX["place_bet"]
    TX --> CPI["CPI: System Program transfer<br/>user → vault"]
    CPI --> BET_CREATED[Bet PDA created<br/>Pool totals updated]
    BET_CREATED --> END([Bet confirmed])

    style CHECK1 fill:#FFD700
    style CHECK2 fill:#FFD700
    style CHECK3 fill:#FFD700
    style ERR1 fill:#FF6B6B,color:#fff
    style ERR2 fill:#FF6B6B,color:#fff
    style ERR3 fill:#FF6B6B,color:#fff
```

### 4c. Settlement and Reward Claim

```mermaid
flowchart TD
    START([Deadline passes]) --> FETCH["Engagement Fetcher<br/>polls platform API"]
    FETCH --> ORACLE{{Settlement Service}}
    ORACLE --> SETTLE["settle_market(final_engagement)"]
    SETTLE --> DECIDE{final_engagement<br/>>= threshold?}
    DECIDE -->|Yes| OVER[Outcome: Over wins]
    DECIDE -->|No| UNDER[Outcome: Under wins]
    OVER --> SETTLED[Market status: Settled]
    UNDER --> SETTLED

    SETTLED --> CLAIM_START([Winner calls claim_reward])
    CLAIM_START --> CHECK1{Market settled?}
    CHECK1 -->|No| ERR1[Error: MarketNotSettled]
    CHECK1 -->|Yes| CHECK2{Winning side?}
    CHECK2 -->|No| ERR2[Error: NotWinningBet]
    CHECK2 -->|Yes| CHECK3{Already claimed?}
    CHECK3 -->|Yes| ERR3[Error: AlreadyClaimed]
    CHECK3 -->|No| PAYOUT["Calculate payout<br/>stake + proportional share - fee"]
    PAYOUT --> CPI["CPI: vault → user transfer"]
    CPI --> DONE([Reward claimed])

    SETTLED --> CLOSE([Authority calls close_market])
    CLOSE --> RENT[Rent returned to creator]

    style DECIDE fill:#FFD700
    style CHECK1 fill:#FFD700
    style CHECK2 fill:#FFD700
    style CHECK3 fill:#FFD700
    style ERR1 fill:#FF6B6B,color:#fff
    style ERR2 fill:#FF6B6B,color:#fff
    style ERR3 fill:#FF6B6B,color:#fff
    style ORACLE fill:#F5A623,color:#fff
```

---

## 5. End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Admin
    participant Creator
    participant Bettor
    participant Frontend
    participant AMP as AMP Program
    participant SYS as System Program
    participant Fetcher as Engagement Fetcher
    participant Oracle as Settlement Service
    participant API as Social Platform API

    Admin->>Frontend: initialize_config(fee_bps)
    Frontend->>AMP: initialize_config
    AMP-->>Frontend: Config PDA created

    Creator->>Frontend: Create market
    Frontend->>AMP: initialize_market
    AMP-->>Frontend: Market + Vault PDAs

    Bettor->>Frontend: place_bet(Over, amount)
    Frontend->>AMP: place_bet
    AMP->>SYS: CPI transfer (user → vault)
    AMP-->>Frontend: Bet PDA created

    Note over Fetcher,API: Deadline elapses
    Fetcher->>API: GET engagement metrics
    API-->>Fetcher: views, likes, shares
    Oracle->>Fetcher: Read final_engagement
    Oracle->>AMP: settle_market(final_engagement)
    AMP-->>Oracle: Outcome set

    Bettor->>Frontend: claim_reward
    Frontend->>AMP: claim_reward
    AMP->>SYS: CPI transfer (vault → user, PDA sign)
    AMP-->>Frontend: Payout sent

    Oracle->>AMP: close_market
    AMP-->>Oracle: Rent to creator
```

---

## 6. Program Interaction Matrix

| Caller | Instruction | Accounts Read | Accounts Written | CPI | Auth Required |
| ------ | ----------- | ------------- | ---------------- | --- | ------------- |
| Admin | `initialize_config` | — | Config (init) | System (create) | Admin signer |
| Creator | `initialize_market` | Config | Config, Market (init) | System (create) | Creator signer |
| Bettor | `place_bet` | Market | Market, Bet (init), Vault | System (transfer) | Bettor signer |
| Authority | `settle_market` | Config, Market | Market | — | Config.authority |
| Winner | `claim_reward` | Config, Market, Bet | Bet, Vault | System (transfer) | Bettor signer |
| Authority | `close_market` | Config, Market | Market (close) | — | Config.authority |

### Data Flow Summary

```
place_bet:    User SOL ──CPI──▶ Vault PDA        | Market.total_over/under ↑
settle_market: final_engagement ──▶ Market.outcome, status
claim_reward:  Vault PDA ──CPI──▶ User SOL       | Bet.claimed = true
close_market:  Market rent ──▶ Creator wallet
```

---

## 7. Account Management Lifecycle

```mermaid
flowchart LR
    subgraph CREATE["Account Creation"]
        C1["initialize_config → Config PDA"]
        C2["initialize_market → Market PDA"]
        C3["place_bet → Bet PDA"]
        C4["Vault PDA (implicit, lamport-only)"]
    end

    subgraph UPDATE["State Updates"]
        U1["place_bet → total_over / total_under"]
        U2["settle_market → outcome, status, final_engagement"]
        U3["claim_reward → bet.claimed = true"]
    end

    subgraph CLOSE["Account Closure"]
        X1["close_market → Market closed, rent to creator"]
        X2["Bet accounts persist until manual close (future)"]
    end

    CREATE --> UPDATE --> CLOSE
```

| Event | Account | Action | Rent Payer |
| ----- | ------- | ------ | ---------- |
| Protocol bootstrap | Config | `init` | Admin |
| Market creation | Market | `init` | Creator |
| First bet on market | Vault | receives lamports | — |
| Each bet | Bet | `init` | Bettor |
| Settlement | Market | mutate | — |
| Claim | Bet, Vault | mutate + transfer | — |
| Close | Market | `close` | Creator receives rent |

---

## 8. Error Paths and Decision Points

All on-chain errors are defined in `errors.rs`:

| Error | Trigger Point | User Impact |
| ----- | ------------- | ----------- |
| `InvalidContentId` | `initialize_market` | Transaction reverts |
| `InvalidFee` | `initialize_config` | Transaction reverts |
| `InvalidThreshold` | `initialize_market` | Transaction reverts |
| `InvalidDeadline` | `initialize_market` | Transaction reverts |
| `ZeroBetAmount` | `place_bet` | Transaction reverts |
| `MarketNotOpen` | `place_bet`, `settle_market` | Transaction reverts |
| `MarketExpired` | `place_bet` | Transaction reverts |
| `MarketNotSettled` | `claim_reward`, `close_market` | Transaction reverts |
| `AlreadyClaimed` | `claim_reward` | Transaction reverts |
| `NotWinningBet` | `claim_reward` | Loser cannot claim |
| `Unauthorized` | `settle_market`, `close_market` | Non-authority rejected |
| `Overflow` | Any arithmetic | Transaction reverts |

```mermaid
flowchart TD
    IX[Instruction invoked] --> VALIDATE{Account constraints<br/>+ require! checks}
    VALIDATE -->|Fail| REVERT[Transaction reverted<br/>Error code returned]
    VALIDATE -->|Pass| EXEC[Execute logic]
    EXEC --> CPI_NEEDED{CPI required?}
    CPI_NEEDED -->|Yes| CPI["System Program CPI"]
    CPI --> CPI_OK{CPI success?}
    CPI_OK -->|No| REVERT
    CPI_OK -->|Yes| WRITE[Write account state]
    CPI_NEEDED -->|No| WRITE
    WRITE --> SUCCESS[Transaction success]

    style VALIDATE fill:#FFD700
    style CPI_NEEDED fill:#FFD700
    style CPI_OK fill:#FFD700
    style REVERT fill:#FF6B6B,color:#fff
    style SUCCESS fill:#51CF66,color:#fff
```

---

## 9. Fee Model

Protocol fee (`fee_bps`) is deducted from the **losing pool** before distribution:

```
fee          = losing_pool × fee_bps / 10_000
distributable = losing_pool - fee
share         = distributable × (bet.amount / winning_pool)
payout        = bet.amount + share
```

Example: 1 SOL on Over, 1 SOL on Under, Over wins, 2% fee:
- `fee = 0.02 SOL`, `distributable = 0.98 SOL`
- Winner payout = `1.0 + 0.98 = 1.98 SOL`

---

## 10. Future Architecture (v2 Roadmap)

```mermaid
flowchart TB
    subgraph V2["Planned Extensions"]
        SPL["SPL Token Vault Program"]
        ORACLE_REG["Oracle Registry Program"]
        FEE_DIST["Creator Fee Distribution"]
    end

    AMP_V1["AMP Program v1<br/>(current)"] --> AMP_V2["AMP Program v2"]
    AMP_V2 --> SPL
    AMP_V2 --> ORACLE_REG
    AMP_V2 --> FEE_DIST

    style AMP_V1 fill:#4A90D9,color:#fff
    style AMP_V2 fill:#4A90D9,color:#fff
```

| Extension | Description |
| --------- | ----------- |
| SPL token betting | Replace SOL vault with token vault CPI to SPL Token program |
| Multi-oracle settlement | Oracle registry program with weighted engagement sources |
| Creator revenue share | Fee split to content creator wallet on settlement |
| Indexer integration | Real-time market feed via Helius / custom Geyser plugin |

---

## 11. Architecture Checklist

| Criterion | Status |
| --------- | ------ |
| All programs represented | ✅ AMP program + System Program CPI |
| Account structures mapped | ✅ Config, Market, Bet, Vault PDAs |
| Program interactions illustrated | ✅ CPI matrix + sequence diagram |
| External dependencies shown | ✅ Social APIs, oracle, RPC, indexer |
| Decision points included | ✅ Settlement, claim, validation flows |
| Error paths documented | ✅ Full error table + revert flow |
| Clear, consistent labeling | ✅ Legend + instruction labels on arrows |
| PDA derivation shown | ✅ Seed diagram |
| State machine documented | ✅ Open → Settled → Closed |
| Off-chain services mapped | ✅ Fetcher, settlement, frontend |

---

## File Reference

```
programs/attention-market-protocol/src/
├── instructions/
│   ├── initialize_market.rs   # initialize_config + initialize_market
│   ├── place_bet.rs
│   ├── settle_market.rs
│   ├── claim_reward.rs
│   └── close_market.rs
├── state/
│   ├── config.rs
│   ├── market.rs
│   └── bet.rs
├── errors.rs
├── constants.rs
└── lib.rs
```

Program ID (localnet): `4BD12VMRQiPgG8dtvW2BaMgZW2QiVzG9CESRHGGP9u1j`
