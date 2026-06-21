use anchor_lang::prelude::*;

/// Supported short-form content platforms.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Platform {
    Instagram,
    TikTok,
    YouTube,
}

/// Lifecycle status of a prediction market.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MarketStatus {
    Open,
    Settled,
    Closed,
}

/// Which side of the engagement threshold bettors can take.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BetSide {
    Over,
    Under,
}

/// A prediction market for a single piece of short-form content.
#[account]
#[derive(InitSpace)]
pub struct Market {
    /// Creator of this market.
    pub creator: Pubkey,
    /// Platform the content lives on.
    pub platform: Platform,
    /// Unique content identifier (URL hash, post ID, etc.).
    #[max_len(64)]
    pub content_id: String,
    /// Engagement target (views, likes, etc.) bettors predict over/under.
    pub engagement_threshold: u64,
    /// Unix timestamp after which no new bets are accepted.
    pub deadline: i64,
    /// Total lamports staked on the Over side.
    pub total_over: u64,
    /// Total lamports staked on the Under side.
    pub total_under: u64,
    /// Current market status.
    pub status: MarketStatus,
    /// Winning side, set during settlement.
    pub outcome: Option<BetSide>,
    /// Observed engagement at settlement time.
    pub final_engagement: u64,
    /// Bump for the market PDA.
    pub bump: u8,
    /// Bump for the vault PDA holding staked lamports.
    pub vault_bump: u8,
}

impl Market {
    pub fn winning_pool(&self) -> Option<u64> {
        self.outcome.map(|side| match side {
            BetSide::Over => self.total_over,
            BetSide::Under => self.total_under,
        })
    }

    pub fn losing_pool(&self) -> Option<u64> {
        self.outcome.map(|side| match side {
            BetSide::Over => self.total_under,
            BetSide::Under => self.total_over,
        })
    }
}
