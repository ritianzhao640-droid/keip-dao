// 链上数据验证脚本
const { ethers } = require('ethers');

const CONFIG = {
  vault: '0x2bA0577ef28F7D7e8093a5be77036c3DFDB4b65D',
  burnDistributor: '0xE64EDEC0EE06E41E9E934876ace095B576A0C6d2',
  vaultLens: '0x2a118B737A9DA1f40aDC1190b6723884064E8b58',
  token: '0x02Eb52f2C54805779aFB5a5aB3D9B2Eb99d47777',
};

const ZERO = '0x0000000000000000000000000000000000000000';

const VAULT_ABI = [
  'function initialized() view returns (bool)',
  'function overview() view returns (address, uint16, uint16, uint16, uint256, uint256, uint256, uint256, uint256, uint256)',
];

const DIST_ABI = [
  'function currentDayId() view returns (uint256)',
  'function dayCursorInitialized() view returns (bool)',
  'function lastProcessedDay() view returns (uint256)',
  'function daySummary(uint256) view returns (uint256, uint256, uint256, bool)',
  'function dayTop10(uint256) view returns (address[10], uint256[10])',
  'function L1_BPS() view returns (uint256)',
  'function totalActualBurned() view returns (uint256)',
];

const LENS_ABI = [
  'function burnUserDetail(address, address) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256)',
];

async function check() {
  const provider = new ethers.JsonRpcProvider('https://bsc-rpc.publicnode.com', 56);
  const blockNum = await provider.getBlockNumber();
  console.log('Connected, block:', blockNum);

  const vault = new ethers.Contract(CONFIG.vault, VAULT_ABI, provider);
  const dist = new ethers.Contract(CONFIG.burnDistributor, DIST_ABI, provider);
  const lens = new ethers.Contract(CONFIG.vaultLens, LENS_ABI, provider);

  // Vault
  console.log('\n--- Vault ---');
  try {
    const init = await vault.initialized();
    console.log('initialized:', init);
  } catch(e) { console.log('initialized FAIL:', e.shortMessage); }

  try {
    const ov = await vault.overview();
    console.log('overview OK');
    console.log('  marketing%', Number(ov[1]), 'dailyRank%', Number(ov[2]), 'weightPool%', Number(ov[3]));
    console.log('  bnbBal', ov[4].toString(), 'totalStaked', ov[5].toString());
    console.log('  slisBal', ov[6].toString(), 'pendingBurnDiv', ov[7].toString());
    console.log('  pendingInvite', ov[8].toString(), 'cumulBurned', ov[9].toString());
  } catch(e) { console.log('overview FAIL:', e.shortMessage || e.message); }

  // Distributor
  console.log('\n--- Distributor ---');
  const cid = await dist.currentDayId(); console.log('currentDayId:', cid.toString());
  const ci = await dist.dayCursorInitialized(); console.log('dayCursorInit:', ci);
  const lpd = await dist.lastProcessedDay(); console.log('lastProcessedDay:', lpd.toString());
  const l1 = await dist.L1_BPS(); console.log('L1_BPS:', l1.toString());
  const tab = await dist.totalActualBurned(); console.log('totalActualBurned:', tab.toString());

  // Day summary
  console.log('\n--- Day #' + cid + ' ---');
  try {
    const s = await dist.daySummary(cid);
    console.log('rewardPot:', s[0]?.toString(), 'totalBurned:', s[1]?.toString(), 'participants:', s[2]?.toString(), 'finalized:', s[3]);
  } catch(e) { console.log('daySummary FAIL:', e.shortMessage); }

  // Top10
  console.log('\n--- Top10 Day #' + cid + ' ---');
  try {
    const [users, amounts] = await dist.dayTop10(cid);
    let cnt = 0;
    for (let i = 0; i < 10; i++) {
      if (users[i] && users[i] !== ZERO) { cnt++; console.log('#' + (i+1), users[i], amounts[i]?.toString()); }
    }
    console.log('valid entries:', cnt);
  } catch(e) { console.log('dayTop10 FAIL:', e.shortMessage); }

  // Lens
  console.log('\n--- Lens (zero addr) ---');
  try {
    const d = await lens.burnUserDetail(CONFIG.vault, ZERO);
    console.log('pendingTotal:', d[0]?.toString(), 'daily:', d[1]?.toString(), 'weighted:', d[2]?.toString());
    console.log('invite:', d[3]?.toString(), 'selfBurned:', d[4]?.toString(), 'weight:', d[5]?.toString(), 'today:', d[6]?.toString());
  } catch(e) { console.log('burnUserDetail FAIL:', e.shortMessage || e.message); }
}

check().catch(e => console.error('FATAL:', e.message));
