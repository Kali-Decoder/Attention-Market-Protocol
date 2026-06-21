import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { SystemProgram } from "@solana/web3.js";
import {
  setupProvider,
  pdas,
  ensureConfig,
  ensureMarket,
  initializeMarket,
  fundedKeypair,
  BetSide,
  BET_AMOUNT,
  Platform,
  THRESHOLD,
} from "./helpers";

describe("betting", () => {
  const { program, payer, connection } = setupProvider();
  const contentId = "reel-betting-test";
  const { config, market, vault, bet } = pdas(program, contentId);

  before(async () => {
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);
    await ensureConfig(program, payer.publicKey, config);
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
  });

  it("places an Over bet", async () => {
    const bettor = await fundedKeypair(connection, payer);
    const betPda = bet(bettor.publicKey);

    await program.methods
      .placeBet(BetSide.Over, BET_AMOUNT)
      .accountsPartial({
        user: bettor.publicKey,
        market,
        bet: betPda,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor])
      .rpc();

    const betAccount = await program.account.bet.fetch(betPda);
    assert.deepEqual(betAccount.side, { over: {} });
    assert.equal(betAccount.amount.toNumber(), BET_AMOUNT.toNumber());
    assert.isFalse(betAccount.claimed);

    const marketAccount = await program.account.market.fetch(market);
    assert.equal(marketAccount.totalOver.toNumber(), BET_AMOUNT.toNumber());
  });

  it("places an Under bet from another user", async () => {
    const bettor = await fundedKeypair(connection, payer);
    const betPda = bet(bettor.publicKey);

    await program.methods
      .placeBet(BetSide.Under, BET_AMOUNT)
      .accountsPartial({
        user: bettor.publicKey,
        market,
        bet: betPda,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor])
      .rpc();

    const marketAccount = await program.account.market.fetch(market);
    assert.equal(marketAccount.totalUnder.toNumber(), BET_AMOUNT.toNumber());
  });
});
