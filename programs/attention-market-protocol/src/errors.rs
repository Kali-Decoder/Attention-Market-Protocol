use anchor_lang::prelude::*;

#[error_code]
pub enum AttentionMarketError {
    #[msg("Content ID must be between 1 and 64 bytes")]
    InvalidContentId,
    #[msg("Fee in basis points cannot exceed 10000")]
    InvalidFee,
    #[msg("Engagement threshold must be greater than zero")]
    InvalidThreshold,
    #[msg("Market deadline must be in the future")]
    InvalidDeadline,
    #[msg("Bet amount must be greater than zero")]
    ZeroBetAmount,
    #[msg("Market is not open for betting")]
    MarketNotOpen,
    #[msg("Market betting period has ended")]
    MarketExpired,
    #[msg("Market has not been settled yet")]
    MarketNotSettled,
    #[msg("Market has already been settled")]
    MarketAlreadySettled,
    #[msg("Market vault still holds unclaimed lamports")]
    VaultNotEmpty,
    #[msg("Bet has already been claimed")]
    AlreadyClaimed,
    #[msg("Only the winning side can claim rewards")]
    NotWinningBet,
    #[msg("Only the protocol authority can perform this action")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
