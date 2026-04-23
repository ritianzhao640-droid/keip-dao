// 最小化 ABI 定义（仅包含实际调用的方法）
import { ethers } from 'ethers';
import { CONFIG, ZERO } from '../config.js';

export { ZERO };

/** BurnLeaderboardLens 聚合读接口 */
export const BURN_LENS_ABI = [
  'function burnBoardDashboard(address vault, address user) view returns ((uint256 dayId,uint256 dayStart,uint256 dayEnd,uint256 secondsRemaining,uint256 dailyRewardPool,uint256 totalWeightedRewardNotified,uint256 totalWeightedRewardClaimed,uint256 currentUnclaimedWeightedReward,uint256 todayTotalBurned,uint256 todayParticipantCount,bool finalized) overview,(uint8 rank,address user,uint256 burned,uint256 rewardBps,uint256 estimatedReward)[10] top10,(uint256 todayBurned,bool inTop10,uint8 rank,uint256 gapToPrevRank,uint256 gapToTop10,uint256 pendingDailyReward,uint256 pendingWeightedReward,uint256 pendingInviteReward,uint256 cumulativeBurned) me,(uint256 marketingBps,uint256 dailyBoardBps,uint256 weightedPoolBps,uint256 l1ReferralBps,uint256 l2ReferralBps,uint256 dayDuration,uint256[10] rankBps,bool inviteEnabled,bool dailyBoardEnabled) config)',
  'function currentBurnBoardTop10(address vault) view returns ((uint8 rank,address user,uint256 burned,uint256 rewardBps,uint256 estimatedReward)[10] rows)',
  'function recentBurnBoardDays(address vault, uint256 count) view returns ((uint256 dayId,uint256 totalReward,uint256 totalBurned,address champion,uint256 championBurned,bool finalized)[] summaries)',
  'function burnBoardByDay(address vault, uint256 dayId) view returns (tuple data)',
  'function previewBurn(address vault, address user, uint256 amount, address inviter) view returns ((uint256 inputAmount,uint256 l1ReferralReward,uint256 l2ReferralReward,uint256 actualBurn,uint256 addedWeight,bool wouldEnterTop10,uint8 estimatedRank,uint256 currentPotEstimatedDailyReward) preview)',
];

/** Vault 写操作 + 查询 */
export const VAULT_ABI = [
  'function burn(uint256 amount, address inviter)',
  'function claimBurnReward() returns (uint256)',
  'function claimInviteReward() returns (uint256)',
  'function pendingBurnReward(address user) view returns (uint256)',
  'function pendingInviteReward(address user) view returns (uint256)',
];

/** ERC20 标准接口 */
export const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

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
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}
