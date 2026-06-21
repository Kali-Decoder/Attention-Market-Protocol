use anchor_lang::prelude::*;

use super::market::BetSide;

/// A user's stake on a specific market outcome.
#[account]
#[derive(InitSpace)]
pub struct Bet {
    /// Market this bet belongs to.
    pub market: Pubkey,
    /// Bettor wallet.
    pub user: Pubkey,
    /// Predicted side (Over or Under the engagement threshold).
    pub side: BetSide,
    /// Lamports staked on this bet.
    pub amount: u64,
    /// Whether winnings have been claimed.
    pub claimed: bool,
    /// Bump for the bet PDA.
    pub bump: u8,
}
