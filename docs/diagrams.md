# Reelify Architecture Diagrams

Standalone Mermaid diagrams for the Attention Market Protocol. Render in GitHub,
VS Code (Markdown Preview Mermaid Support), or [mermaid.live](https://mermaid.live).

> Full narrative and tables: [architecture.md](./architecture.md)

---

## System Context

```mermaid
C4Context
    title Reelify System Context

    Person(bettor, "Bettor", "Stakes on content engagement")
    Person(creator, "Creator", "Creates prediction markets")
    Person(admin, "Protocol Admin", "Bootstraps config, settles markets")

    System(reelify, "Reelify Protocol", "Solana prediction markets on content engagement")

    System_Ext(instagram, "Instagram API", "Engagement data")
    System_Ext(tiktok, "TikTok API", "Engagement data")
    System_Ext(youtube, "YouTube API", "Engagement data")

    Rel(bettor, reelify, "place_bet, claim_reward")
    Rel(creator, reelify, "initialize_market")
    Rel(admin, reelify, "initialize_config, settle_market, close_market")
    Rel(reelify, instagram, "Poll engagement")
    Rel(reelify, tiktok, "Poll engagement")
    Rel(reelify, youtube, "Poll engagement")
```

---

## Program Module Map

```mermaid
block-beta
    columns 3

    block:PROGRAM:3
        columns 3
        lib["lib.rs\nentrypoint + declare_id"]
        constants["constants.rs\nseeds, limits"]
        errors["errors.rs\nAttentionMarketError"]
    end

    block:INSTRUCTIONS:3
        columns 3
        i1["initialize_market.rs"]
        i2["place_bet.rs"]
        i3["settle_market.rs"]
        i4["claim_reward.rs"]
        i5["close_market.rs"]
        space:2
    end

    block:STATE:3
        columns 3
        s1["config.rs"]
        s2["market.rs"]
        s3["bet.rs"]
    end

    lib --> i1
    lib --> i2
    lib --> i3
    lib --> i4
    lib --> i5
    i1 --> s1
    i1 --> s2
    i2 --> s2
    i2 --> s3
    i3 --> s2
    i4 --> s2
    i4 --> s3
    i5 --> s2
```

---

## Account Relationship (ER-style)

```mermaid
erDiagram
    CONFIG ||--o{ MARKET : governs
    MARKET ||--|| VAULT : escrows
    MARKET ||--o{ BET : contains
    MARKET {
        pubkey creator
        string content_id
        enum platform
        u64 engagement_threshold
        i64 deadline
        u64 total_over
        u64 total_under
        enum status
        option outcome
        u64 final_engagement
    }
    BET {
        pubkey market
        pubkey user
        enum side
        u64 amount
        bool claimed
    }
    CONFIG {
        pubkey authority
        u16 fee_bps
        u64 total_markets
    }
    VAULT {
        u64 lamports
    }
```

---

## Complete Lifecycle Flowchart

```mermaid
flowchart TB
    subgraph PHASE1["Phase 1: Bootstrap"]
        A1[Admin: initialize_config] --> A2[Config PDA live]
    end

    subgraph PHASE2["Phase 2: Market Open"]
        B1[Creator: initialize_market] --> B2[Market + Vault created]
        B2 --> B3[Bettors: place_bet]
        B3 --> B3
    end

    subgraph PHASE3["Phase 3: Resolution"]
        C1[Deadline reached] --> C2[Fetcher polls APIs]
        C2 --> C3[Oracle: settle_market]
        C3 --> C4{Over or Under wins?}
    end

    subgraph PHASE4["Phase 4: Distribution"]
        D1[Winners: claim_reward] --> D2[Payout from vault]
        D2 --> D3[Authority: close_market]
        D3 --> D4[Rent returned to creator]
    end

    A2 --> B1
    B3 --> C1
    C4 --> D1

    style PHASE1 fill:#E8F4FD
    style PHASE2 fill:#D5E8D4
    style PHASE3 fill:#FFF3CD
    style PHASE4 fill:#F8D7DA
```

---

## CPI Detail: place_bet

```mermaid
sequenceDiagram
    participant User as Bettor Wallet
    participant AMP as AMP Program
    participant Market as Market PDA
    participant Bet as Bet PDA
    participant Vault as Vault PDA
    participant SYS as System Program

    User->>AMP: place_bet(side, amount)
    AMP->>AMP: validate market open + deadline
    AMP->>SYS: CPI transfer(amount)
    SYS->>User: debit lamports
    SYS->>Vault: credit lamports
    AMP->>Market: update total_over / total_under
    AMP->>Bet: init bet account
    AMP-->>User: success
```

---

## CPI Detail: claim_reward

```mermaid
sequenceDiagram
    participant User as Winner Wallet
    participant AMP as AMP Program
    participant Config as Config PDA
    participant Market as Market PDA
    participant Bet as Bet PDA
    participant Vault as Vault PDA
    participant SYS as System Program

    User->>AMP: claim_reward()
    AMP->>AMP: verify settled + winning side + not claimed
    AMP->>Config: read fee_bps
    AMP->>AMP: calculate payout
    AMP->>SYS: CPI transfer(payout) with vault PDA signer
    SYS->>Vault: debit lamports
    SYS->>User: credit lamports
    AMP->>Bet: claimed = true
    AMP-->>User: success
```

---

## Rendering Tips

| Tool | How to use |
| ---- | ---------- |
| **GitHub** | Push to repo; Mermaid renders in `.md` files automatically |
| **VS Code** | Install "Markdown Preview Mermaid Support" extension |
| **mermaid.live** | Paste diagram code for PNG/SVG export |
| **Draw.io** | Import Mermaid or redraw for presentation slides |
| **Figma** | Use as reference for polished design system diagrams |
