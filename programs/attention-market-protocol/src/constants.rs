use anchor_lang::prelude::*;

/// PDA seed prefixes used across the program.
#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const MARKET_SEED: &[u8] = b"market";
#[constant]
pub const BET_SEED: &[u8] = b"bet";
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

/// Maximum length, in bytes, of a content identifier (URL hash, platform ID, etc.).
pub const MAX_CONTENT_ID_LEN: usize = 64;

/// Fee denominator: fees are expressed in basis points (1 bps = 0.01%).
pub const BPS_DENOMINATOR: u64 = 10_000;
