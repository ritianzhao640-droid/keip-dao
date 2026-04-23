// 合约地址与链上配置（BSC mainnet）
export const CONFIG = {
  chainId: 56,
  token: '0x02Eb52f2C54805779aFB5a5aB3D9B2Eb99d47777',
  vault: '0x2bA0577ef28F7D7e8093a5be77036c3DFDB4b65D',
  vaultImplementation: '0xC1C9B8d1cEDB967a0FB5C9fb34e2864EddcD6F3A',
  vaultDeployer: '0xdbfea3062A51d5A8B99872318EA4A87fbDF582fe',
  vaultFactory: '0x5a4cd78283095CA7B79Ba6EF49BE9df4D8379364',
  vaultLens: '0x2a118B737A9DA1f40aDC1190b6723884064E8b58',
  burnLeaderboardLens: '0xccb816433b58349d4eD9040B3DF9c55927a325A2',
  burnDistributor: '0xE64EDEC0EE06E41E9E934876ace095B576A0C6d2',
  multisigWallet: '0x5fffa71f9cac7d23bc8ad1147e01ba73c53d9e41',
  bscScanBase: 'https://bscscan.com/address/',
  rpcUrls: [
    'https://bsc-rpc.publicnode.com',
    'https://bsc-dataseed.binance.org',
    'https://rpc.ankr.com/bsc',
  ],
};

export const ZERO = '0x0000000000000000000000000000000000000000';

// 周期起始：链上 dayId 20566 = 第1期（2026-04-23），之后递增
export const DAY_START_ID = 20566;
