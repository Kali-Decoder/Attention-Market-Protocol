use anchor_lang::prelude::*;

use crate::{
    constants::{CONFIG_SEED, MAX_CONTENT_ID_LEN, MARKET_SEED, VAULT_SEED},
    errors::AttentionMarketError,
    state::{Config, Market, MarketStatus, Platform},
};

/// Creates a new engagement prediction market for a piece of short-form content.
#[derive(Accounts)]
#[instruction(content_id: String, platform: Platform)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED, content_id.as_bytes(), &[platform as u8]],
        bump,
    )]
    pub market: Account<'info, Market>,

    /// SOL vault that holds all bets for this market.
    #[account(
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_market_handler(
    ctx: Context<InitializeMarket>,
    content_id: String,
    platform: Platform,
    engagement_threshold: u64,
    deadline: i64,
) -> Result<()> {
    require!(
        !content_id.is_empty() && content_id.len() <= MAX_CONTENT_ID_LEN,
        AttentionMarketError::InvalidContentId
    );
    require!(
        engagement_threshold > 0,
        AttentionMarketError::InvalidThreshold
    );

    let clock = Clock::get()?;
    require!(deadline > clock.unix_timestamp, AttentionMarketError::InvalidDeadline);

    ctx.accounts.market.set_inner(Market {
        creator: ctx.accounts.creator.key(),
        platform,
        content_id,
        engagement_threshold,
        deadline,
        total_over: 0,
        total_under: 0,
        status: MarketStatus::Open,
        outcome: None,
        final_engagement: 0,
        bump: ctx.bumps.market,
        vault_bump: ctx.bumps.vault,
    });

    let config = &mut ctx.accounts.config;
    config.total_markets = config
        .total_markets
        .checked_add(1)
        .ok_or(AttentionMarketError::Overflow)?;

    Ok(())
}

/// Bootstraps the global protocol config. Required once before any market is created.
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_config_handler(ctx: Context<InitializeConfig>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= 10_000, AttentionMarketError::InvalidFee);

    ctx.accounts.config.set_inner(Config {
        authority: ctx.accounts.authority.key(),
        fee_bps,
        total_markets: 0,
        bump: ctx.bumps.config,
    });

    Ok(())
}
