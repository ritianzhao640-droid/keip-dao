// 主框架 - tabs切换 + footerbar + 页面路由
import { useState, useCallback, useEffect } from 'react';
import { CONFIG } from './config.js';
import { useWallet } from './hooks/useWallet.js';
import { useChainData } from './hooks/useChainData.js';
import { shortAddr } from './contracts/index.js';
import BottomNav from './components/BottomNav.jsx';

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
    // 同步显示对应 section
    document.querySelectorAll('.section').forEach(el => {
      el.classList.toggle('active', el.id === tab);
    });
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
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
    <div className="app">
      {/* Hero */}
      <div className="hero">
        <span className="brand-badge">BSC · 正式地址</span>
        <h1 className="brand-title">最大DeFi攻击</h1>
        <div className="brand-sub">黑白极简 · 链上真实数据</div>
        <div className="alloc">
          <div className="box dark"><div className="k">营销</div><div className="v">30%</div></div>
          <div className="box light"><div className="k">日榜</div><div className="v">20%</div></div>
          <div className="box light"><div className="k">永久权重</div><div className="v">50%</div></div>
        </div>
        <div className="address">
          <div>
            <div className="k">正式 Vault</div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>{shortAddr(CONFIG.vault)}</div>
          </div>
          <button className="btn-light pill" onClick={() => navigator.clipboard?.writeText(CONFIG.vault)}>复制地址</button>
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

      {/* 底部钱包栏 */}
      <div className="footerbar">
        <div className="tip">
          {wallet.account
            ? `已连接钱包 · ${shortAddr(wallet.account)}`
            : '未连接钱包'
          }
        </div>
        <button
          className={`btn-dark pill ${wallet.connecting ? 'disabled' : ''}`}
          onClick={wallet.account ? wallet.disconnect : wallet.connect}
          disabled={wallet.connecting}
        >
          {wallet.account ? '断开' : (wallet.connecting ? '连接中…' : '连接钱包')}
        </button>
      </div>
    </div>
  );
}
