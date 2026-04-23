// 链上数据聚合读取 Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { ZERO } from '../contracts/index.js';
import { BURN_LENS_ABI, ERC20_ABI, createReadProvider, fmtUnits, fmtNum, formatCountdown, shortAddr } from '../contracts/index.js';

/** 创建只读合约实例 */
function getLens(provider) {
  return new ethers.Contract(CONFIG.burnLeaderboardLens, BURN_LENS_ABI, provider);
}

function getTokenContract(provider) {
  return new ethers.Contract(CONFIG.token, ERC20_ABI, provider);
}

export function useChainData(account) {
  const [provider, setProvider] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState('TOKEN');

  // 首页 Dashboard 数据
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // Top10 榜单
  const [top10, setTop10] = useState([]);
  const [top10Loading, setTop10Loading] = useState(false);

  // 历史战报
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 燃烧预览
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 初始化只读 Provider
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await createReadProvider();
        if (cancelled) return;
        setProvider(p);
        // 读取代币信息
        const token = getTokenContract(p);
        try { setTokenDecimals(Number(await token.decimals())); } catch {}
        try { setTokenSymbol(await token.symbol()); } catch {}
      } catch (e) {
        if (!cancelled) console.error('Provider 初始化失败:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 加载首页聚合数据（burnBoardDashboard）
  const loadDashboard = useCallback(async () => {
    if (!provider) return;
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const lens = getLens(provider);
      const data = await lens.burnBoardDashboard(CONFIG.vault, account || ZERO);
      setDashboard(data);
      setDashboardError(null);
    } catch (e) {
      console.error('loadDashboard 失败:', e);
      setDashboardError(e.shortMessage || e.message || '读取失败');
    } finally {
      setDashboardLoading(false);
    }
  }, [provider, account]);

  // 加载 Top10
  const loadTop10 = useCallback(async () => {
    if (!provider) return;
    setTop10Loading(true);
    try {
      const lens = getLens(provider);
      const rows = await lens.currentBurnBoardTop10(CONFIG.vault);
      setTop10(rows.filter(r => r.user && r.user !== ZERO));
    } catch (e) {
      console.error('loadTop10 失败:', e);
      setTop10([]);
    } finally {
      setTop10Loading(false);
    }
  }, [provider]);

  // 加载历史战报
  const loadHistory = useCallback(async (count = 6) => {
    if (!provider) return;
    setHistoryLoading(true);
    try {
      const lens = getLens(provider);
      const days = await lens.recentBurnBoardDays(CONFIG.vault, count);
      setHistory(days);
    } catch (e) {
      console.error('loadHistory 失败:', e);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [provider]);

  // 燃烧预览（防抖）
  const previewTimerRef = useRef(null);
  const loadPreview = useCallback(async (amountInput, inviterValue) => {
    if (!provider || !amountInput || Number(amountInput) <= 0) {
      setPreview(null);
      return;
    }
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    
    previewTimerRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const lens = getLens(provider);
        const amountWei = ethers.parseUnits(amountInput, tokenDecimals);
        const inviter = ethers.isAddress(inviterValue) ? inviterValue : ZERO;
        const result = await lens.previewBurn(
          CONFIG.vault,
          account || ZERO,
          amountWei,
          inviter
        );
        setPreview(result);
      } catch (e) {
        console.error('previewBurn 失败:', e);
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 450);
  }, [provider, account, tokenDecimals]);

  // 全量加载
  const loadAll = useCallback(async () => {
    await Promise.all([loadDashboard(), loadTop10(), loadHistory()]);
  }, [loadDashboard, loadTop10, loadHistory]);

  // 连接后自动加载
  useEffect(() => {
    if (provider) loadAll();
  }, [provider, account, loadAll]);

  return {
    provider,
    tokenDecimals,
    tokenSymbol,
    dashboard,
    dashboardLoading,
    dashboardError,
    top10,
    top10Loading,
    history,
    historyLoading,
    preview,
    previewLoading,
    loadDashboard,
    loadTop10,
    loadHistory,
    loadPreview,
    loadAll,
  };
}
