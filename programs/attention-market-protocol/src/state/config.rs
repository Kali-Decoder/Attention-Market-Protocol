use anchor_lang::prelude::*;

/// Global protocol configuration. One instance per deployment.
#[account]
#[derive(InitSpace)]
pub struct Config {
    /// Protocol administrator allowed to settle markets.
    pub authority: Pubkey,
    /// Protocol fee taken from the losing pool on settlement, in basis points.
    pub fee_bps: u16,
    /// Total number of markets created.
    pub total_markets: u64,
    /// Bump for the config PDA.
    pub bump: u8,
}
