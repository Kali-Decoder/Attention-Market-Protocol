import { AnchorProvider, BN, Program, web3 } from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import idl from '../idl/attention_market_protocol.json'
import { DEMO_MARKETS } from './demoMarkets'

const PROGRAM_ID = new PublicKey(
  process.env.PUBLIC_PROGRAM_ID || 'GA8XxXazz9FLrWk13AudkFTRwwF3MD3CZoDKbq24Xs46',
)

export type Platform = 'instagram' | 'tikTok' | 'youTube'
export type BetSide = 'over' | 'under'
export type MarketStatus = 'open' | 'settled' | 'closed'

export type MarketAccount = {
  publicKey: PublicKey
  creator: PublicKey
  platform: Platform
  contentId: string
  engagementThreshold: BN
  deadline: BN
  totalOver: BN
  totalUnder: BN
  status: MarketStatus
  outcome: BetSide | null
  finalEngagement: BN
}

export type BetAccount = {
  publicKey: PublicKey
  market: PublicKey
  user: PublicKey
  side: BetSide
  amount: BN
  claimed: boolean
}

type WalletLike = WalletContextState & { connection: Connection }

function toPlatformEnum(platform: Platform) {
  if (platform === 'instagram') return { instagram: {} }
  if (platform === 'tikTok') return { tikTok: {} }
  return { youTube: {} }
}

function toBetSideEnum(side: BetSide) {
  return side === 'over' ? { over: {} } : { under: {} }
}

function parsePlatform(raw: Record<string, unknown>): Platform {
  if ('tikTok' in raw) return 'tikTok'
  if ('youTube' in raw) return 'youTube'
  return 'instagram'
}

function parseBetSide(raw: Record<string, unknown> | null): BetSide | null {
  if (!raw) return null
  if ('under' in raw) return 'under'
  return 'over'
}

function parseStatus(raw: Record<string, unknown>): MarketStatus {
  if ('settled' in raw) return 'settled'
  if ('closed' in raw) return 'closed'
  return 'open'
}

function mapMarket(a: { publicKey: PublicKey; account: any }): MarketAccount {
  return {
    publicKey: a.publicKey,
    creator: a.account.creator,
    platform: parsePlatform(a.account.platform),
    contentId: a.account.contentId,
    engagementThreshold: a.account.engagementThreshold,
    deadline: a.account.deadline,
    totalOver: a.account.totalOver,
    totalUnder: a.account.totalUnder,
    status: parseStatus(a.account.status),
    outcome: parseBetSide(a.account.outcome),
    finalEngagement: a.account.finalEngagement,
  }
}

function mapBet(a: { publicKey: PublicKey; account: any }): BetAccount {
  return {
    publicKey: a.publicKey,
    market: a.account.market,
    user: a.account.user,
    side: parseBetSide(a.account.side) ?? 'over',
    amount: a.account.amount,
    claimed: a.account.claimed,
  }
}

export function getReadOnlyProgram(connection: Connection) {
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async () => {
        throw new Error('Wallet required')
      },
      signAllTransactions: async () => {
        throw new Error('Wallet required')
      },
    } as AnchorProvider['wallet'],
    { commitment: 'confirmed' },
  )
  return new Program(idl as any, PROGRAM_ID, provider)
}

export function getProgram(wallet: WalletLike) {
  const provider = new AnchorProvider(
    wallet.connection,
    wallet as unknown as AnchorProvider['wallet'],
    { commitment: 'confirmed' },
  )
  return new Program(idl as any, PROGRAM_ID, provider)
}

export function getConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0]
}

export function getMarketPda(contentId: string, platform: Platform) {
  const platformByte = platform === 'instagram' ? 0 : platform === 'tikTok' ? 1 : 2
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market'), Buffer.from(contentId), Buffer.from([platformByte])],
    PROGRAM_ID,
  )[0]
}

export function getVaultPda(market: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), market.toBuffer()],
    PROGRAM_ID,
  )[0]
}

export function getBetPda(market: PublicKey, user: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), market.toBuffer(), user.toBuffer()],
    PROGRAM_ID,
  )[0]
}

export async function fetchMarkets(connection: Connection): Promise<MarketAccount[]> {
  const program = getReadOnlyProgram(connection)
  const accounts = await program.account.market.all()
  return accounts.map(mapMarket)
}

export async function fetchMarket(
  connection: Connection,
  contentId: string,
  platform: Platform,
): Promise<MarketAccount | null> {
  const program = getReadOnlyProgram(connection)
  const address = getMarketPda(contentId, platform)
  try {
    const account = await program.account.market.fetch(address)
    return mapMarket({ publicKey: address, account })
  } catch {
    return null
  }
}

export async function fetchUserBets(
  connection: Connection,
  user: PublicKey,
): Promise<BetAccount[]> {
  const program = getReadOnlyProgram(connection)
  const accounts = await program.account.bet.all([
    { memcmp: { offset: 8 + 32, bytes: user.toBase58() } },
  ])
  return accounts.map(mapBet)
}

export async function fetchUserBet(
  connection: Connection,
  market: PublicKey,
  user: PublicKey,
): Promise<BetAccount | null> {
  const program = getReadOnlyProgram(connection)
  const address = getBetPda(market, user)
  try {
    const account = await program.account.bet.fetch(address)
    return mapBet({ publicKey: address, account })
  } catch {
    return null
  }
}

export async function configExists(connection: Connection): Promise<boolean> {
  const info = await connection.getAccountInfo(getConfigPda())
  return info !== null
}

export async function initializeConfig(wallet: WalletLike, feeBps = 200) {
  const program = getProgram(wallet)
  const config = getConfigPda()
  await program.methods
    .initializeConfig(feeBps)
    .accountsPartial({
      authority: wallet.publicKey!,
      config,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

export async function initializeMarket(
  wallet: WalletLike,
  input: { contentId: string; platform: Platform; threshold: number; deadlineUnix: number },
) {
  const program = getProgram(wallet)
  const config = getConfigPda()
  const market = getMarketPda(input.contentId, input.platform)
  const vault = getVaultPda(market)
  await program.methods
    .initializeMarket(
      input.contentId,
      toPlatformEnum(input.platform),
      new BN(input.threshold),
      new BN(input.deadlineUnix),
    )
    .accountsPartial({
      creator: wallet.publicKey!,
      config,
      market,
      vault,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

export async function placeBet(
  wallet: WalletLike,
  input: { market: PublicKey; side: BetSide; lamports: number },
) {
  const program = getProgram(wallet)
  const bet = getBetPda(input.market, wallet.publicKey!)
  const vault = getVaultPda(input.market)
  await program.methods
    .placeBet(toBetSideEnum(input.side), new BN(input.lamports))
    .accountsPartial({
      user: wallet.publicKey!,
      market: input.market,
      bet,
      vault,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

export async function claimReward(wallet: WalletLike, market: PublicKey) {
  const program = getProgram(wallet)
  const config = getConfigPda()
  const bet = getBetPda(market, wallet.publicKey!)
  const vault = getVaultPda(market)
  await program.methods
    .claimReward()
    .accountsPartial({
      user: wallet.publicKey!,
      config,
      market,
      bet,
      vault,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

export async function seedDemoMarkets(wallet: WalletLike) {
  const exists = await configExists(wallet.connection)
  if (!exists) {
    await initializeConfig(wallet)
  }

  for (const demo of DEMO_MARKETS) {
    const address = getMarketPda(demo.contentId, demo.platform)
    const info = await wallet.connection.getAccountInfo(address)
    if (info) continue

    const deadlineUnix = Math.floor(Date.now() / 1000) + demo.deadlineHours * 3600
    await initializeMarket(wallet, {
      contentId: demo.contentId,
      platform: demo.platform,
      threshold: demo.threshold,
      deadlineUnix,
    })
  }
}
