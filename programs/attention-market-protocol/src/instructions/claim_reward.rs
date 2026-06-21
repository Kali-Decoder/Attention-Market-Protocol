use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::{BET_SEED, BPS_DENOMINATOR, CONFIG_SEED, VAULT_SEED},
    errors::AttentionMarketError,
    state::{Bet, Config, Market, MarketStatus},
};

/// Claims a proportional share of the losing pool for a winning bet.
#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        constraint = market.status == MarketStatus::Settled @ AttentionMarketError::MarketNotSettled,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [BET_SEED, market.key().as_ref(), user.key().as_ref()],
        bump = bet.bump,
        has_one = user @ AttentionMarketError::Unauthorized,
        has_one = market,
        constraint = !bet.claimed @ AttentionMarketError::AlreadyClaimed,
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: PDA vault validated by seeds; signed via market PDA seeds.
    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump = market.vault_bump,
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn claim_reward_handler(ctx: Context<ClaimReward>) -> Result<()> {
    let bet = &ctx.accounts.bet;
    let market = &ctx.accounts.market;
    let outcome = market.outcome.ok_or(AttentionMarketError::MarketNotSettled)?;

    require!(bet.side == outcome, AttentionMarketError::NotWinningBet);

    let winning_pool = market
        .winning_pool()
        .ok_or(AttentionMarketError::MarketNotSettled)?;
    let losing_pool = market.losing_pool().unwrap_or(0);

    let payout = if winning_pool == 0 {
        bet.amount
    } else {
        let fee = losing_pool
            .checked_mul(ctx.accounts.config.fee_bps as u64)
            .ok_or(AttentionMarketError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(AttentionMarketError::Overflow)?;

        let distributable = losing_pool
            .checked_sub(fee)
            .ok_or(AttentionMarketError::Overflow)?;

        let share = distributable
            .checked_mul(bet.amount)
            .ok_or(AttentionMarketError::Overflow)?
            .checked_div(winning_pool)
            .ok_or(AttentionMarketError::Overflow)?;

        bet.amount
            .checked_add(share)
            .ok_or(AttentionMarketError::Overflow)?
    };

    let market_key = market.key();
    let vault_seeds = &[
        VAULT_SEED,
        market_key.as_ref(),
        &[market.vault_bump],
    ];
    let signer = &[&vault_seeds[..]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            signer,
        ),
        payout,
    )?;

    ctx.accounts.bet.claimed = true;

    Ok(())
}
