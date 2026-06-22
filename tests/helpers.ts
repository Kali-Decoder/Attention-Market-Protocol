import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AttentionMarketProtocol } from "../target/types/attention_market_protocol";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

export const FEE_BPS = 200; // 2%
export const THRESHOLD = new anchor.BN(100_000);
export const BET_AMOUNT = new anchor.BN(0.5 * LAMPORTS_PER_SOL);

export const Platform = {
  Instagram: { instagram: {} },
  TikTok: { tikTok: {} },
  YouTube: { youTube: {} },
} as const;

export const BetSide = {
  Over: { over: {} },
  Under: { under: {} },
} as const;

export function setupProvider() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace
    .AttentionMarketProtocol as Program<AttentionMarketProtocol>;
  const payer = (provider.wallet as anchor.Wallet).payer;
  return { provider, program, payer, connection: provider.connection };
}

export function pdas(
  program: Program<AttentionMarketProtocol>,
  contentId: string,
  platform: (typeof Platform)[keyof typeof Platform] = Platform.Instagram
) {
  const config = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];

  const platformByte = Buffer.from([
    "instagram" in platform ? 0 : "tikTok" in platform ? 1 : 2,
  ]);
  const market = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), Buffer.from(contentId), platformByte],
    program.programId
  )[0];

  const vault = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), market.toBuffer()],
    program.programId
  )[0];

  const bet = (user: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), market.toBuffer(), user.toBuffer()],
      program.programId
    )[0];

  return { config, market, vault, bet };
}

export async function fundedKeypair(
  connection: anchor.web3.Connection,
  payer: Keypair,
  sol = 1
): Promise<Keypair> {
  const kp = Keypair.generate();
  const lamports = sol * LAMPORTS_PER_SOL;
  const tx = new anchor.web3.Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: kp.publicKey,
      lamports,
    })
  );
  await anchor.web3.sendAndConfirmTransaction(connection, tx, [payer]);
  return kp;
}

export async function initializeConfig(
  program: Program<AttentionMarketProtocol>,
  authority: PublicKey,
  config: PublicKey
) {
  await program.methods
    .initializeConfig(FEE_BPS)
    .accountsPartial({
      authority,
      config,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function ensureConfig(
  program: Program<AttentionMarketProtocol>,
  authority: PublicKey,
  config: PublicKey
) {
  const info = await program.provider.connection.getAccountInfo(config);
  if (!info) {
    await initializeConfig(program, authority, config);
  }
}

export async function getProtocolAuthority(
  program: Program<AttentionMarketProtocol>,
  config: PublicKey
): Promise<PublicKey> {
  const configAccount = await program.account.config.fetch(config);
  return configAccount.authority;
}

export async function ensureMarket(
  program: Program<AttentionMarketProtocol>,
  creator: PublicKey,
  config: PublicKey,
  market: PublicKey,
  vault: PublicKey,
  contentId: string,
  platform: (typeof Platform)[keyof typeof Platform],
  threshold: anchor.BN,
  deadline: anchor.BN
) {
  const info = await program.provider.connection.getAccountInfo(market);
  if (!info) {
    await initializeMarket(
      program,
      creator,
      config,
      market,
      vault,
      contentId,
      platform,
      threshold,
      deadline
    );
  }
}

export async function initializeMarket(
  program: Program<AttentionMarketProtocol>,
  creator: PublicKey,
  config: PublicKey,
  market: PublicKey,
  vault: PublicKey,
  contentId: string,
  platform: (typeof Platform)[keyof typeof Platform],
  threshold: anchor.BN,
  deadline: anchor.BN
) {
  await program.methods
    .initializeMarket(contentId, platform, threshold, deadline)
    .accountsPartial({
      creator,
      config,
      market,
      vault,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
