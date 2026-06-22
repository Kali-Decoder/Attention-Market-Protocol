pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use errors::*;
pub use instructions::*;
pub use state::*;

declare_id!("Ex4u9eFj65N9SQ1o5yCCCHuBuTPbhcnfEGi6W5tWuoq");

#[program]
pub mod attention_market_protocol {
    use super::*;

    /// Bootstrap global protocol configuration (one-time setup).
    pub fn initialize_config(ctx: Context<InitializeConfig>, fee_bps: u16) -> Result<()> {
        initialize_market::initialize_config_handler(ctx, fee_bps)
    }

    /// Create a prediction market for a piece of short-form content.
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        content_id: String,
        platform: Platform,
        engagement_threshold: u64,
        deadline: i64,
    ) -> Result<()> {
        initialize_market::initialize_market_handler(
            ctx,
            content_id,
            platform,
            engagement_threshold,
            deadline,
        )
    }

    /// Stake SOL on whether content engagement will finish over or under the threshold.
    pub fn place_bet(ctx: Context<PlaceBet>, side: BetSide, amount: u64) -> Result<()> {
        place_bet::place_bet_handler(ctx, side, amount)
    }

    /// Settle a market with observed engagement data from an off-chain oracle.
    pub fn settle_market(ctx: Context<SettleMarket>, final_engagement: u64) -> Result<()> {
        settle_market::settle_market_handler(ctx, final_engagement)
    }

    /// Claim winnings for a winning bet after settlement.
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        claim_reward::claim_reward_handler(ctx)
    }

    /// Close a settled market and reclaim rent.
    pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
        close_market::close_market_handler(ctx)
    }
}
