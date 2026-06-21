use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::{BET_SEED, VAULT_SEED},
    errors::AttentionMarketError,
    state::{Bet, BetSide, Market, MarketStatus},
};

/// Places a stake on whether content engagement will finish over or under the threshold.
#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = market.status == MarketStatus::Open @ AttentionMarketError::MarketNotOpen,
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [BET_SEED, market.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: PDA vault validated by seeds.
    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump = market.vault_bump,
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn place_bet_handler(ctx: Context<PlaceBet>, side: BetSide, amount: u64) -> Result<()> {
    require!(amount > 0, AttentionMarketError::ZeroBetAmount);

    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp <= ctx.accounts.market.deadline,
        AttentionMarketError::MarketExpired
    );

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    let market = &mut ctx.accounts.market;
    match side {
        BetSide::Over => {
            market.total_over = market
                .total_over
                .checked_add(amount)
                .ok_or(AttentionMarketError::Overflow)?;
        }
        BetSide::Under => {
            market.total_under = market
                .total_under
                .checked_add(amount)
                .ok_or(AttentionMarketError::Overflow)?;
        }
    }

    ctx.accounts.bet.set_inner(Bet {
        market: market.key(),
        user: ctx.accounts.user.key(),
        side,
        amount,
        claimed: false,
        bump: ctx.bumps.bet,
    });

    Ok(())
}
