/**
 * Seed demo markets on localnet for UI demonstrations.
 *
 * Usage:
 *   anchor test          # starts validator + deploys program
 *   npm run seed:demo    # in another terminal, with wallet funded
 */
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { AttentionMarketProtocol } from '../target/types/attention_market_protocol'
import { SystemProgram } from '@solana/web3.js'
import {
  ensureConfig,
  initializeMarket,
  pdas,
  FEE_BPS,
  Platform,
} from '../tests/helpers'

const DEMO_MARKETS = [
  { contentId: 'viral-dance-challenge', platform: Platform.TikTok, threshold: 500_000, hours: 72 },
  { contentId: 'summer-recipe-reel', platform: Platform.Instagram, threshold: 250_000, hours: 48 },
  { contentId: 'tech-review-short', platform: Platform.YouTube, threshold: 1_000_000, hours: 96 },
  { contentId: 'comedy-sketch-42', platform: Platform.TikTok, threshold: 100_000, hours: 24 },
  { contentId: 'fitness-transformation', platform: Platform.Instagram, threshold: 75_000, hours: 48 },
  { contentId: 'music-cover-2026', platform: Platform.YouTube, threshold: 200_000, hours: 48 },
]

async function main() {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const program = anchor.workspace.AttentionMarketProtocol as Program<AttentionMarketProtocol>
  const payer = (provider.wallet as anchor.Wallet).payer

  const { config } = pdas(program, 'seed-check')
  await ensureConfig(program, payer.publicKey, config)

  for (const demo of DEMO_MARKETS) {
    const { market, vault } = pdas(program, demo.contentId, demo.platform)
    const exists = await provider.connection.getAccountInfo(market)
    if (exists) {
      console.log(`skip  ${demo.contentId} (already exists)`)
      continue
    }

    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + demo.hours * 3600)
    await initializeMarket(
      program,
      payer.publicKey,
      config,
      market,
      vault,
      demo.contentId,
      demo.platform,
      new anchor.BN(demo.threshold),
      deadline,
    )
    console.log(`seed  ${demo.contentId} → ${market.toBase58()}`)
  }

  console.log('Done. Open http://localhost:5173 to browse markets.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
