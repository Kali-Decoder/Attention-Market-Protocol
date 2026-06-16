# Reelify User Flows

## 1. Protocol Bootstrap (Admin)

1. Admin calls `initialize_config` with fee in basis points.
2. Config PDA is created at `["config"]`.

## 2. Create a Market (Creator)

1. Creator selects a content URL / ID and platform (Instagram, TikTok, YouTube).
2. Creator sets an engagement threshold (e.g. 100,000 views) and deadline.
3. Creator calls `initialize_market`.
4. Market and vault PDAs are created; market status is **Open**.

## 3. Place a Bet (Bettor)

1. Bettor connects wallet and browses open markets.
2. Bettor chooses **Over** or **Under** and enters a SOL amount.
3. Bettor calls `place_bet`; lamports transfer to the market vault.
4. A Bet PDA tracks the user's position.

## 4. Settlement (Oracle / Authority)

1. After the deadline, the settlement service fetches engagement data.
2. Authority calls `settle_market` with `final_engagement`.
3. Outcome is determined: Over wins if `final_engagement >= threshold`.
4. Market status becomes **Settled**.

## 5. Claim Rewards (Winner)

1. Winning bettors call `claim_reward`.
2. Program calculates proportional share of the losing pool (minus fee).
3. Lamports transfer from vault to bettor; bet marked as claimed.

## 6. Close Market (Authority)

1. After settlement and claims, authority calls `close_market`.
2. Market account is closed; rent returned to creator.
