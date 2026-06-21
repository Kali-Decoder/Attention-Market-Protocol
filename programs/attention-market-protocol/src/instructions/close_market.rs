use anchor_lang::prelude::*;

use crate::{
    constants::CONFIG_SEED,
    errors::AttentionMarketError,
    state::{Config, Market, MarketStatus},
};

/// Closes a settled market account and returns rent to the creator.
#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ AttentionMarketError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        close = creator,
        has_one = creator,
        constraint = market.status == MarketStatus::Settled @ AttentionMarketError::MarketNotSettled,
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Receives closed account rent.
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,
}

pub fn close_market_handler(ctx: Context<CloseMarket>) -> Result<()> {
    ctx.accounts.market.status = MarketStatus::Closed;
    Ok(())
}
