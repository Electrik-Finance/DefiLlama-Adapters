const Caver = require("caver-js");
const axios = require("axios");
const retry = require("async-retry");
const stakingABI = require("./abi/abi.json");

const { toUSDTBalances } = require("../helper/balances");

async function klaytn() {
  let klaytnTVL = 0;
  const endpoint = "https://api.electrik.finance/api/status/pools";
  const pools = await retry(
    async () => await axios.get(endpoint).then((res) => res.data.result.pools)
  );
  if (pools) {
    Object.values(pools).forEach((pool) => {
      klaytnTVL += Number(pool.tvl || 0);
    });
  }

  return toUSDTBalances(klaytnTVL);
}
async function fetchStaking() {
  const provider = new Caver.providers.HttpProvider(
    "https://public-node-api.klaytnapi.com/v1/cypress"
  );
  const caver = new Caver(provider);
  const pool = "0xC2873149235756BF36eCA22AEf051889c95461ED";
  const tvlContract = new caver.klay.Contract(
    stakingABI,
    "0x2fd427E041513580e9E47bd2E99608b365339c3E"
  );
  let stakingTvl = 0;
  try {
    stakingTvl = await tvlContract.methods
      .tvl(pool)
      .call()
      .then((res) => res / 1e18);
  } catch (err) {}

  return toUSDTBalances(stakingTvl);
}
module.exports = {
  klaytn: {
    tvl: klaytn,
    staking: fetchStaking,
  },
};
