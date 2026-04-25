// 管理员钱包列表
const adminWallets = [
  '0x1234567890123456789012345678901234567890',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  '0x0907e1696f7d714d4360d085fe5be03b853d64b5'
];

// 默认代币配置（支持自定义ABI）
const defaultTokenConfigs = [
  {
    id: 'slisbnb',
    name: 'slisBNB',
    tokenAddress: '0x...',
    vaultAddress: '0x...',
    distributorAddress: '0x...',
    vaultLensAddress: '0x...',
    // 可选的自定义ABI字段（JSON字符串格式）
    erc20Abi: null,
    vaultAbi: null,
    burnDistAbi: null,
    vaultLensAbi: null
  }
];

export const CONFIG = {
  adminWallets,
  defaultTokenConfigs,
  // 其他原有配置
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  chainId: 56,
  // ... 其他配置
};