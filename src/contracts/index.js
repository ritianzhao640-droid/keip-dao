// 真实合约 ABI（从链上提取，仅包含实际调用的方法）
import { ethers } from 'ethers';
import { CONFIG, ZERO, DAY_START_ID } from '../config.js';

export { ZERO };

/** Token ERC20（最小化） */
export const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

/** Vault 合约完整读写接口 */
export const VAULT_ABI = [
  'function burn(uint256 amount, address inviter)',
  'function claimBurnReward() returns (uint256)',
  'function claimInviteReward() returns (uint256)',
  'function overview() view returns (address _listaStakeManager, uint16 _marketingSharePercent, uint16 _dailyRankSharePercent, uint16 _weightPoolSharePercent, uint256 _vaultBnbBalance, uint256 _totalStakedBnb, uint256 _vaultSlisBalance, uint256 _myPendingBurnDividend, uint256 _myPendingInviteReward, uint256 _myCumulativeBurned)',
  'function burnInfo(address user) view returns (uint256 rawBurned, uint256 weight, address inviter, bool hasInviter)',
  'function pendingBurnReward(address user) view returns (uint256)',
  'function pendingInviteReward(address user) view returns (uint256)',
  'function slisBNB() view returns (address)',
  'function taxToken() view returns (address)',
  'function description() view returns (string)',
];

/** BurnDistributor 读接口 */
export const BURN_DIST_ABI = [
  'function currentDayId() view returns (uint256)',
  'function DAY_DURATION() view returns (uint256)',
  'function dayCursorInitialized() view returns (bool)',
  'function lastProcessedDay() view returns (uint256)',
  'function dayIsFinalized(uint256 dayId) view returns (bool)',
  'function daySummary(uint256 dayId) view returns (uint256 rewardPot, uint256 totalBurned, uint256 participantCount, bool finalized)',
  'function dayTop10(uint256 dayId) view returns (address[10] users, uint256[10] amounts)',
  'function dayTotalBurned(uint256 dayId) view returns (uint256)',
  'function dayParticipantCount(uint256 dayId) view returns (uint256)',
  'function dayRewardPot(uint256 dayId) view returns (uint256)',
  'function burnInfo(address user) view returns (uint256 rawBurned, uint256 weight, address inviter, bool hasInviter)',
  'function pendingBurnReward(address user) view returns (uint256)',
  'function pendingDailyBurnReward(address user) view returns (uint256)',
  'function pendingInviteReward(address user) view returns (uint256)',
  'function pendingWeightedBurnReward(address user) view returns (uint256)',
  'function totalActualBurned() view returns (uint256)',
  'function totalBurnWeight() view returns (uint256)',
  'function totalWeightedRewardNotified() view returns (uint256)',
  'function totalWeightedRewardClaimed() view returns (uint256)',
  'function totalDailyRewardNotified() view returns (uint256)',
  'function totalDailyRewardClaimed() view returns (uint256)',
  'function accRewardPerWeight() view returns (uint256)',
  'function L1_BPS() view returns (uint256)',
  'function L2_BPS() view returns (uint256)',
  'function BPS() view returns (uint256)',
  'function MARKETING_BPS() view returns (uint256)',
  'function DAILY_RANK_BPS() view returns (uint256)',
  'function WEIGHT_POOL_BPS() view returns (uint256)',
];

/** MEYieldVaultLens 聚合读接口 */
export const VAULT_LENS_ABI = [
  'function burnUserDetail(address vault, address user) view returns (uint256 pendingTotal, uint256 pendingDaily, uint256 pendingWeighted, uint256 pendingInvite, uint256 selfBurned, uint256 weight, uint256 todayBurned)',
  'function burnInviter(address vault, address user) view returns (address inviter, bool hasInviter, uint256 inviterBurnedAmount)',
  'function burnUser(address vault, address user) view returns (uint256 pendingBurn, uint256 pendingInvite, uint256 selfBurned)',
  'function vaultPools(address vault) view returns (uint256 pendingMarketing, uint256 totalDailyNotified, uint256 totalWeightedNotified, uint256 totalDailyClaimed, uint256 totalWeightedClaimed)',
  'function vaultCore(address vault) view returns (address taxToken, address slisBNB, uint256 pendingTaxBnb)',
  'function vaultStake(address vault) view returns (uint256 totalStakedBnb, uint256 totalSlisReceived, uint256 vaultSlisBalance)',
  'function marketing(address vault) view returns (address wallet, uint256 pendingAmount, uint256 threshold)',
  'function inviteCheck(address vault, address user, address inviterCandidate) view returns (bool canBind, uint8 reasonCode)',
];

/** 创建只读合约实例 */
export function getVault(provider) { return new ethers.Contract(CONFIG.vault, VAULT_ABI, provider); }
export function getBurnDist(provider) { return new ethers.Contract(CONFIG.burnDistributor, BURN_DIST_ABI, provider); }
export function getVaultLens(provider) { return new ethers.Contract(CONFIG.vaultLens, VAULT_LENS_ABI, provider); }
export function getTokenContract(provider) { return new ethers.Contract(CONFIG.token, ERC20_ABI, provider); }

/** 创建只读 Provider（自动尝试多个 RPC） */
export async function createReadProvider() {
  for (const url of CONFIG.rpcUrls) {
    try {
      const provider = new ethers.JsonRpcProvider(url, CONFIG.chainId, { staticNetwork: true });
      await provider.getBlockNumber();
      return provider;
    } catch {}
  }
  throw new Error('无法连接公共 BSC RPC');
}

/** 格式化工具函数 */
export function shortAddr(addr) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return '\u2014';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function fmtNum(v, d = 2) {
  try {
    return Number(v).toLocaleString('zh-CN', { maximumFractionDigits: d });
  } catch {
    return String(v ?? '--');
  }
}

export function fmtUnits(v, decimals = 18, d = 4) {
  try {
    return Number(ethers.formatUnits(v ?? 0n, decimals)).toLocaleString('zh-CN', { maximumFractionDigits: d });
  } catch {
    return '--';
  }
}

export function formatCountdown(seconds) {
  const s = Number(seconds || 0);
  if (s <= 0 || !isFinite(s)) return '--:--:--';
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

/**
 * 将 dayId 转换为 UTC 日期字符串（YYYY-MM-DD）
 * 起始锚点：DAY_START_ID = 20566 对应 2026-04-23（UTC）
 */
export function dayIdToDate(dayId) {
  if (!dayId || dayId < DAY_START_ID) return '--';
  const startDate = Date.UTC(2026, 3, 23); // 2026-04-23 00:00:00 UTC
  const offsetDays = Number(dayId) - DAY_START_ID;
  const date = new Date(startDate + offsetDays * 24 * 3600 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
