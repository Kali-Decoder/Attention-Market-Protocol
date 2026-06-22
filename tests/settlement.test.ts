import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  setupProvider,
  pdas,
  ensureConfig,
  ensureMarket,
  initializeMarket,
  fundedKeypair,
  getProtocolAuthority,
  BetSide,
  BET_AMOUNT,
  Platform,
  THRESHOLD,
} from "./helpers";

describe("settlement", () => {
  const { program, payer, connection } = setupProvider();
  const contentId = `settle-${Date.now().toString(36)}`;
  const { config, market, vault, bet } = pdas(program, contentId);

  let overBettor: anchor.web3.Keypair;
  let underBettor: anchor.web3.Keypair;

  before(async function () {
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);
    await ensureConfig(program, payer.publicKey, config);
    const authority = await getProtocolAuthority(program, config);
    if (!authority.equals(payer.publicKey)) {
      this.skip();
    }
    await ensureMarket(
      program,
      payer.publicKey,
      config,
      market,
      vault,
      contentId,
      Platform.Instagram,
      THRESHOLD,
      deadline,
    );

    overBettor = await fundedKeypair(connection, payer);
    underBettor = await fundedKeypair(connection, payer);

    await program.methods
      .placeBet(BetSide.Over, BET_AMOUNT)
      .accountsPartial({
        user: overBettor.publicKey,
        market,
        bet: bet(overBettor.publicKey),
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([overBettor])
      .rpc();

    await program.methods
      .placeBet(BetSide.Under, BET_AMOUNT)
      .accountsPartial({
        user: underBettor.publicKey,
        market,
        bet: bet(underBettor.publicKey),
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([underBettor])
      .rpc();
  });

  it("settles market when engagement exceeds threshold", async () => {
    const finalEngagement = new anchor.BN(150_000);

    await program.methods
      .settleMarket(finalEngagement)
      .accountsPartial({
        authority: payer.publicKey,
        config,
        market,
      })
      .rpc();

    const marketAccount = await program.account.market.fetch(market);
    assert.deepEqual(marketAccount.status, { settled: {} });
    assert.deepEqual(marketAccount.outcome, { over: {} });
    assert.equal(marketAccount.finalEngagement.toNumber(), 150_000);
  });

  it("allows Over bettor to claim winnings", async () => {
    const balanceBefore = await connection.getBalance(overBettor.publicKey);

    await program.methods
      .claimReward()
      .accountsPartial({
        user: overBettor.publicKey,
        config,
        market,
        bet: bet(overBettor.publicKey),
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([overBettor])
      .rpc();

    const balanceAfter = await connection.getBalance(overBettor.publicKey);
    assert.isAbove(balanceAfter, balanceBefore);

    const betAccount = await program.account.bet.fetch(bet(overBettor.publicKey));
    assert.isTrue(betAccount.claimed);
  });

  it("closes a settled market", async () => {
    await program.methods
      .closeMarket()
      .accountsPartial({
        authority: payer.publicKey,
        config,
        market,
        creator: payer.publicKey,
      })
      .rpc();

    const info = await connection.getAccountInfo(market);
    assert.isNull(info);
  });
});
