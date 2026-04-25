// 链上数据聚合读取 - 使用真实合约接口（Vault + BurnDistributor + MEYieldVaultLens）
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONFIG, DAY_START_ID } from '../config.js';
import { ZERO, getVault, getBurnDist, getVaultLens, getTokenContract, createReadProvider, fmtUnits, fmtNum, formatCountdown, shortAddr, ERC20_ABI, VAULT_ABI, BURN_DIST_ABI, VAULT_LENS_ABI } from '../contracts/index.js';

export function useChainData(account, config = null) {
  // 合并配置：优先使用传入的 config，否则使用 CONFIG 默认值
  const effectiveConfig = config || {
    tokenAddress: CONFIG.token,
    vaultAddress: CONFIG.vault,
    burnDistributorAddress: CONFIG.burnDistributor,
    vaultLensAddress: CONFIG.vaultLens,
    multisigWallet: CONFIG.multisigWallet,
  };
  const [provider, setProvider] = useState(null);
  const [providerError, setProviderError] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState('TOKEN');

  // 首页 Dashboard 聚合数据（从多个合约组装）
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // Top10 榜单
  const [top10, setTop10] = useState([]);
  const [top10Loading, setTop10Loading] = useState(false);

  // 历史战报（多日汇总）
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 多签钱包 slisBNB 余额
  const [multisigBalance, setMultisigBalance] = useState(0n);
  const [multisigLoading, setMultisigLoading] = useState(false);

  // 日榜总览（当前日）
  const [boardOverview, setBoardOverview] = useState(null);
  const [dayId, setDayId] = useState(null);
  // 显示用周期号：第1期、第2期...（硬编码锚点，所有人一致）
  const getDisplayDayId = () => {
    if (!dayId) return null;
    return Math.max(1, dayId - DAY_START_ID + 1);
  };

  // 初始化 Provider
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await createReadProvider();
        if (cancelled) return;
        setProvider(p);
        setProviderError(null);
        console.log('[ChainData] Provider 已连接');

        // 读取代币信息（支持动态ABI）
        const tokenAbi = effectiveConfig.erc20Abi || ERC20_ABI;
        const token = new ethers.Contract(effectiveConfig.tokenAddress, tokenAbi, p);
        try { setTokenDecimals(Number(await token.decimals())); } catch {}
        try { setTokenSymbol(await token.symbol()); } catch {}
      } catch (e) {
        if (!cancelled) {
          console.error('[ChainData] Provider 失败:', e);
          setProviderError(e.message || '无法连接 BSC');
          setProvider(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** 加载首页全量数据 */
  const loadDashboard = useCallback(async () => {
    if (!provider) return;
    setDashboardLoading(true);
    setMultisigLoading(true);
    setDashboardError(null);
    try {
      const vaultAbi = effectiveConfig.vaultAbi || VAULT_ABI;
      const lensAbi = effectiveConfig.vaultLensAbi || VAULT_LENS_ABI;
      const distAbi = effectiveConfig.burnDistAbi || BURN_DIST_ABI;
      const tokenAbi = effectiveConfig.erc20Abi || ERC20_ABI;
      const vault = new ethers.Contract(effectiveConfig.vaultAddress, vaultAbi, provider);
      const lens = new ethers.Contract(effectiveConfig.vaultLensAddress || CONFIG.vaultLens, lensAbi, provider);
      const dist = new ethers.Contract(effectiveConfig.burnDistributorAddress || CONFIG.burnDistributor, distAbi, provider);
      const token = new ethers.Contract(effectiveConfig.tokenAddress, tokenAbi, provider);
      const userAddr = account || ZERO;

      // 并行读取所有数据源
      const [
        overview,
        userDetail,
        currentDay,
        daySummary_,
        top10Raw,
        l1Bps,
        l2Bps,
        totalActualBurned,
        inviterInfo,
        userBalance,
        multisigBalance,
      ] = await Promise.all([
        vault.overview().catch(e => { console.error('overview:', e); return null; }),
        lens.burnUserDetail(effectiveConfig.vaultAddress, userAddr).catch(e => { console.error('burnUserDetail:', e); return null; }),
        dist.currentDayId().catch(e => { console.error('currentDayId:', e); return 0n }),
        dist.daySummary(await dist.currentDayId()).catch(e => { console.error('daySummary:', e); return null; }),
        dist.dayTop10(await dist.currentDayId()).catch(e => { console.error('dayTop10:', e); return [[], []]; }),
        dist.L1_BPS(),
        dist.L2_BPS(),
        dist.totalActualBurned().catch(e => { console.error('totalActualBurned:', e); return 0n }),
        lens.burnInviter(effectiveConfig.vaultAddress, userAddr).catch(e => { console.error('burnInviter:', e); return [ZERO, false, 0n]; }),
        // 用户 slisBNB 持币量
        account ? token.balanceOf(account).catch(() => 0n) : Promise.resolve(0n),
        // 多签钱包 slisBNB 余额
        token.balanceOf(effectiveConfig.multisigWallet || CONFIG.multisigWallet).catch(() => 0n),
      ]);

      setDayId(Number(currentDay));

      // 解构上级信息
      const [inviter, hasInviter, inviterBurnedAmount] = inviterInfo || [ZERO, false, 0n];

      // 组装 dashboard 数据
      const data = {
        // Vault overview 全局
        overview: overview ? {
          marketingSharePercent: Number(overview[1]),  // _marketingSharePercent
          dailyRankSharePercent: Number(overview[2]),   // _dailyRankSharePercent
          weightPoolSharePercent: Number(overview[3]),  // _weightPoolSharePercent
          vaultBnbBalance: overview[4],                  // _vaultBnbBalance（待质押BNB）
          totalStakedBnb: overview[5],                   // _totalStakedBnb（总质押BNB）
          vaultSlisBalance: overview[6],                 // _vaultSlisBalance（slisBNB金库）
        } : null,

        // 用户个人数据（来自 Lens）
        me: userDetail ? {
          pendingTotal: userDetail.pendingTotal,
          pendingDaily: userDetail.pendingDaily,
          pendingWeighted: userDetail.pendingWeighted,
          pendingInvite: userDetail.pendingInvite,
          selfBurned: userDetail.selfBurned,
          weight: userDetail.weight,
          todayBurned: userDetail.todayBurned,
          inviter,
          hasInviter,
          inviterBurnedAmount,
        } : null,

        // 今日榜单概览（来自 BurnDistributor）
        dayInfo: daySummary_ ? {
          dailyRewardPool: daySummary_.rewardPot,
          todayTotalBurned: daySummary_.totalBurned,
          participantCount: daySummary_.participantCount,
          finalized: daySummary_.finalized,
        } : null,

        // 全局总燃烧量
        totalBurned: totalActualBurned,

        // 用户持币量（slisBNB）
        userBalance: userBalance,

        // 分配比例
        config: {
          l1ReferralBps: Number(l1Bps),
          l2ReferralBps: Number(l2Bps),
          marketingBps: 3000,   // 30%
          dailyBoardBps: 2000,  // 20%
          weightedPoolBps: 5000, // 50%
        },
      };

      console.log('[ChainData] Dashboard 数据已组装');
      setDashboard(data);
      setDashboardError(null);

      // 同时更新 boardOverview 和 top10
      setBoardOverview(daySummary_);
      if (Array.isArray(top10Raw) && top10Raw.length === 2) {
        const users = top10Raw[0];
        const amounts = top10Raw[1];
        const list = users.map((u, i) => ({
          rank: i + 1,
          user: u,
          burned: amounts[i] || 0n,
          estimatedReward: 0n, // 需要 rankBps 计算，先显示 0
        })).filter(r => r.user && r.user !== ZERO);
        setTop10(list);
      }

      // 设置多签钱包余额
      setMultisigBalance(multisigBalance);

    } catch (e) {
      console.error('[ChainData] loadDashboard 失败:', e);
      setDashboardError(e.shortMessage || e.message || '读取失败');
    } finally {
      setDashboardLoading(false);
      setMultisigLoading(false);
    }
  }, [provider, account, effectiveConfig]);

  /** 加载 Top10（单独刷新） */
  const loadTop10 = useCallback(async () => {
    if (!provider) return;
    setTop10Loading(true);
    try {
      const distAbi = effectiveConfig.burnDistAbi || BURN_DIST_ABI;
      const dist = new ethers.Contract(effectiveConfig.burnDistributorAddress || CONFIG.burnDistributor, distAbi, provider);
      const cid = await dist.currentDayId();
      const [users, amounts] = await dist.dayTop10(cid);
      const list = users.map((u, i) => ({
        rank: i + 1,
        user: u,
        burned: amounts[i] || 0n,
        estimatedReward: 0n,
      })).filter(r => r.user && r.user !== ZERO);
      setTop10(list);
      console.log('[ChainData] Top10 已加载:', list.length, '条');
    } catch (e) {
      console.error('[ChainData] loadTop10 失败:', e);
      setTop10([]);
    } finally {
      setTop10Loading(false);
    }
  }, [provider, effectiveConfig]);

  /** 加载历史战报（最近 N 天） */
  const loadHistory = useCallback(async (count = 6) => {
    if (!provider) return;
    setHistoryLoading(true);
    try {
      const distAbi = effectiveConfig.burnDistAbi || BURN_DIST_ABI;
      const dist = new ethers.Contract(effectiveConfig.burnDistributorAddress || CONFIG.burnDistributor, distAbi, provider);
      const lastDay = await dist.lastProcessedDay();
      const startDay = Number(lastDay) > count ? Number(lastDay) - count + 1 : 1;
      const days = [];
      for (let d = startDay; d <= Number(lastDay); d++) {
        try {
          const summary = await dist.daySummary(d);
          const top10_ = await dist.dayTop10(d);
          days.push({
            dayId: d,
            totalReward: summary.rewardPot,
            totalBurned: summary.totalBurned,
            champion: summary.finalized ? (top10_[0]?.[0] || ZERO) : ZERO,
            finalized: summary.finalized,
          });
        } catch {}
      }
      setHistory(days);
      console.log('[ChainData] History 已加载:', days.length, '天');
    } catch (e) {
      console.error('[ChainData] loadHistory 失败:', e);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [provider, effectiveConfig]);

  /** 燃烧预览（保留接口但不再UI使用） */
  const loadPreview = useCallback(async (_amountInput, _inviterValue) => {}, []);

  /** 全量加载 */
  const loadAll = useCallback(async () => {
    await Promise.all([loadDashboard(), loadTop10(), loadHistory()]);
  }, [loadDashboard, loadTop10, loadHistory]);

  // Provider 就绪即自动加载
  useEffect(() => {
    if (provider) loadAll();
  }, [provider, account, loadAll]);

  return {
    provider,
    providerError,
    tokenDecimals,
    tokenSymbol,
    dashboard,
    dashboardLoading,
    dashboardError,
    top10,
    top10Loading,
    history,
    historyLoading,
    multisigBalance,
    multisigLoading,
    boardOverview,
    dayId,
    displayDayId: getDisplayDayId(),
    config: effectiveConfig,
    preview: null,
    previewLoading: false,
    loadDashboard,
    loadTop10,
    loadHistory,
    loadPreview,
    loadAll,
  };
}
