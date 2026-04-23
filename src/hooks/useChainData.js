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
  const [providerError, setProviderError] = useState(null);
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

  // 燃烧预览（保留接口但不再在UI使用）
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
        setProviderError(null);
        console.log('[ChainData] Provider 已连接, block:', await p.getBlockNumber());

        // 读取代币信息
        const token = getTokenContract(p);
        try { setTokenDecimals(Number(await token.decimals())); } catch {}
        try { setTokenSymbol(await token.symbol()); } catch {}
      } catch (e) {
        if (!cancelled) {
          console.error('[ChainData] Provider 初始化失败:', e);
          setProviderError(e.message || '无法连接 BSC 网络');
          setProvider(null);
        }
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
      const userAddr = account || ZERO;
      console.log('[ChainData] 调用 burnBoardDashboard vault=', CONFIG.vault, 'user=', userAddr);
      const data = await lens.burnBoardDashboard(CONFIG.vault, userAddr);
      console.log('[ChainData] burnBoardDashboard 返回:', JSON.stringify(data));
      setDashboard(data);
      setDashboardError(null);
    } catch (e) {
      console.error('[ChainData] loadDashboard 失败:', e);
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
      console.log('[ChainData] 调用 currentBurnBoardTop10 vault=', CONFIG.vault);
      const rows = await lens.currentBurnBoardTop10(CONFIG.vault);
      console.log('[ChainData] top10 返回:', JSON.stringify(rows));
      setTop10(rows.filter(r => r.user && r.user !== ZERO));
    } catch (e) {
      console.error('[ChainData] loadTop10 失败:', e);
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
      console.log('[ChainData] 调用 recentBurnBoardDays count=', count);
      const days = await lens.recentBurnBoardDays(CONFIG.vault, count);
      console.log('[ChainData] history 返回:', JSON.stringify(days));
      setHistory(days);
    } catch (e) {
      console.error('[ChainData] loadHistory 失败:', e);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [provider]);

  // 燃烧预览（防抖，保留接口）
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
        console.error('[ChainData] previewBurn 失败:', e);
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

  // 连接后自动加载 + 首次 provider 就绪时也加载
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
    preview,
    previewLoading,
    loadDashboard,
    loadTop10,
    loadHistory,
    loadPreview,
    loadAll,
  };
}
