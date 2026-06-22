import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import {
  setupProvider,
  pdas,
  ensureConfig,
  initializeMarket,
  Platform,
  THRESHOLD,
} from "./helpers";

describe("market", () => {
  const { program, payer } = setupProvider();

  it("initializes protocol config", async () => {
    const { config } = pdas(program, "reel-market-config-test");
    await ensureConfig(program, payer.publicKey, config);

    const configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.feeBps, 200);
    assert.isAtLeast(configAccount.totalMarkets.toNumber(), 0);
    assert.ok(configAccount.authority);
  });

  it("creates a prediction market for content", async () => {
    const contentId = `reel-market-test-${Date.now()}`;
    const { config, market, vault } = pdas(program, contentId);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

    await ensureConfig(program, payer.publicKey, config);

    const configBefore = await program.account.config.fetch(config);
    const marketsBefore = configBefore.totalMarkets.toNumber();

    await initializeMarket(
      program,
      payer.publicKey,
      config,
      market,
      vault,
      contentId,
      Platform.Instagram,
      THRESHOLD,
      deadline
    );

    const marketAccount = await program.account.market.fetch(market);
    assert.equal(marketAccount.contentId, contentId);
    assert.deepEqual(marketAccount.platform, { instagram: {} });
    assert.equal(marketAccount.engagementThreshold.toNumber(), 100_000);
    assert.equal(marketAccount.totalOver.toNumber(), 0);
    assert.equal(marketAccount.totalUnder.toNumber(), 0);
    assert.deepEqual(marketAccount.status, { open: {} });

    const configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.totalMarkets.toNumber(), marketsBefore + 1);
  });
});
