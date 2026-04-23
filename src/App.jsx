// 主框架 - tabs切换 + footerbar + 页面路由
import { useState, useCallback, useEffect } from 'react';
import { CONFIG } from './config.js';
import { useWallet } from './hooks/useWallet.js';
import { useChainData } from './hooks/useChainData.js';
import { shortAddr } from './contracts/index.js';
import BottomNav from './components/BottomNav.jsx';
import { ToastProvider } from './components/Toast.jsx';

// 懒加载页面
import Dashboard from './pages/Dashboard.jsx';
import Burn from './pages/Burn.jsx';
import Board from './pages/Board.jsx';
import Invite from './pages/Invite.jsx';
import Community from './pages/Community.jsx';

const PAGES = {
  home: Dashboard,
  burn: Burn,
  board: Board,
  invite: Invite,
  community: Community,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const wallet = useWallet();
  const chainData = useChainData(wallet.account);

  // 导航（支持自定义事件跨组件调用）
  const handleNavigate = useCallback((tab) => {
    setActiveTab(tab);
    // 同步显示对应 section（CSS 兼容层）
    document.querySelectorAll('.section').forEach(el => {
      el.classList.toggle('active', el.id === tab);
    });
  }, []);

  // 监听自定义导航事件
  useEffect(() => {
    window.addEventListener('navigate', (e) => handleNavigate(e.detail));
  }, [handleNavigate]);

  // 初始加载时激活首页
  useEffect(() => {
    handleNavigate('home');
  }, []);

  const ActivePage = PAGES[activeTab] || Dashboard;

  return (
    <ToastProvider>
    <div className="app">
      {/* Hero */}
      <div className="hero">
        <span className="brand-badge">BSC · 正式地址</span>
        <h1 className="brand-title">最大DeFi攻击</h1>
        <div className="brand-sub"></div>
        <div className="alloc">
          <div className="box dark"><div className="k">营销</div><div className="v">30%</div></div>
          <div className="box light"><div className="k">日榜</div><div className="v">20%</div></div>
          <div className="box light"><div className="k">永久权重</div><div className="v">50%</div></div>
        </div>
        <div className="address">
          <div className="tip">
            {wallet.account
              ? `已连接 · ${shortAddr(wallet.account)}`
              : '未连接钱包'
            }
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn-dark pill ${(chainData.dashboardLoading || chainData.top10Loading || chainData.historyLoading) ? 'disabled btn-refresh-spin' : ''}`}
              onClick={chainData.loadAll}
              disabled={chainData.dashboardLoading || chainData.top10Loading || chainData.historyLoading}
              title="刷新链上数据"
              style={{ minWidth: 40, padding: '9px 12px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                <polyline points="21 3 21 9 15 9"/>
              </svg>
            </button>
            <button
              className={`btn-dark pill ${wallet.connecting ? 'disabled' : ''}`}
              onClick={wallet.account ? wallet.disconnect : wallet.connect}
              disabled={wallet.connecting}
            >
              {wallet.account ? '断开' : (wallet.connecting ? '连接中…' : '连接钱包')}
            </button>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />

      {/* 当前页面 */}
      <ActivePage
        account={wallet.account}
        signer={wallet.signer}
        chainData={chainData}
        onNavigate={handleNavigate}
      />

    </div>
    </ToastProvider>
  );
}
