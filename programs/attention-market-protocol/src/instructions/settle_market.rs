use anchor_lang::prelude::*;

use crate::{
    constants::CONFIG_SEED,
    errors::AttentionMarketError,
    state::{BetSide, Config, Market, MarketStatus},
};

/// Records final engagement and determines the winning side of the market.
#[derive(Accounts)]
pub struct SettleMarket<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ AttentionMarketError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        constraint = market.status == MarketStatus::Open @ AttentionMarketError::MarketNotOpen,
    )]
    pub market: Account<'info, Market>,
}

pub fn settle_market_handler(ctx: Context<SettleMarket>, final_engagement: u64) -> Result<()> {
    let market = &mut ctx.accounts.market;

    let outcome = if final_engagement >= market.engagement_threshold {
        BetSide::Over
    } else {
        BetSide::Under
    };

    market.final_engagement = final_engagement;
    market.outcome = Some(outcome);
    market.status = MarketStatus::Settled;

    Ok(())
}
