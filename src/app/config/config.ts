export const SATS_MULTIPLE = 10 ** 8;
export const DEFAULT_POOL = 10 ** 6;
export const NEXT_POOL_AMOUNT = 2 * 10 ** 5;

export const testVersion =
  process.env.NEXT_PUBLIC_TEST_VERSION === "true" ? true : false;

export const MEMPOOL_URL = testVersion
  ? "https://mempool.space/testnet/api"
  : "https://mempool.space/api";

export const BETA_LINK = "https://beta.runed.com";

export const TEST_LINK = "https://test.runed.com";
