// 首页 - 真实链上数据展示
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { fmtUnits, formatCountdown } from '../contracts/index.js';
import { VAULT_ABI } from '../contracts/index.js';
import { showToast } from '../components/Toast.jsx';

export default function Dashboard({ account, signer, chainData, onNavigate }) {
  const [claimingBurn, setClaimingBurn] = useState(false);
  const { dashboard, dashboardLoading, dashboardError, providerError, dayId, displayDayId, config } = chainData;
  const vaultAddress = config?.vaultAddress || CONFIG.vault;

  // 领取燃烧奖励
  const handleClaimBurn = useCallback(async () => {
    if (!signer || !account) return;
    setClaimingBurn(true);
    try {
      const vaultAbi = config?.vaultAbi || VAULT_ABI;
      const vault = new ethers.Contract(vaultAddress, vaultAbi, signer);
      const tx = await vault.claimBurnReward();
      await tx.wait();
      await chainData.loadAll();
    } catch (e) {
      showToast('燃烧奖励领取失败：' + (e.shortMessage || e.message || '未知错误'), 'error');
    } finally {
      setClaimingBurn(false);
    }
  }, [signer, account, chainData, config]);

  // 状态栏
  let statusText = '正在读取链上数据…';
  let statusCls = '';
  if (providerError) { statusText = '网络连接失败：' + providerError; statusCls = 'error'; }
  else if (dashboardError) { statusText = '读取失败：' + dashboardError; statusCls = 'warn'; }
  else if (dashboard && !dashboardLoading) { statusText = '首页数据已从真实链上读取。'; statusCls = 'ok'; }

  // 数据安全访问
  const ov = dashboard?.dayInfo;
  const me = dashboard?.me;
  const totalBurned = dashboard?.totalBurned;
  const userBalance = dashboard?.userBalance;

  // 倒计时：用 dayDuration - (当前时间戳 % dayDuration)
  // 这里先用 dayId 展示，精确倒计时需要知道 dayStart
  const countdownDisplay = '--:--:--';

  return (
    <section id="home" className="section">
      <h2 className="title">首页</h2>

      {/* 品牌面板 - 持币量 */}
      <div className="brand-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div className="k">持币量</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, letterSpacing: '-0.05em' }}>
              {account ? (userBalance !== undefined ? fmtUnits(userBalance, 18, 4) : '--') : '连接钱包查看'}
            </div>
            <div className="small" style={{ fontSize: 13, marginTop: 8 }}>最大DeFi攻击</div>
          </div>
          <div style={{ width: 58, height: 58, borderRadius: 20, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>◎</div>
        </div>
      </div>

      {/* 4数据卡 */}
      <div className="grid2" style={{ marginTop: 10 }}>
        <div className="card stat">
          <div className="k">今日榜单池</div>
          <div className="num mono">{ov ? fmtUnits(ov.dailyRewardPool, 18, 4) : '--'}</div>
          <div className="small">最大DeFi攻击</div>
        </div>
        <div className="card stat">
          <div className="k">总燃烧量</div>
          <div className="num mono">{totalBurned ? fmtUnits(totalBurned, 18, 2) : '--'}</div>
          <div className="small">最大DeFi攻击</div>
        </div>
        <div className="card stat">
          <div className="k">我的今日燃烧</div>
          <div className="num mono">{me ? fmtUnits(me.todayBurned, 18, 4) : '--'}</div>
          <div className="small">{displayDayId ? `第 ${displayDayId} 期` : ''}</div>
        </div>
        <div className="card stat">
          <div className="k">邀请奖励</div>
          <div className="num mono">{me ? fmtUnits(me.pendingInvite, 18, 4) : '--'}</div>
          <div className="small">待领取</div>
        </div>
      </div>

      {/* 内嵌卡片区 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="grid2">
          <div className="card inverse" style={{ boxShadow: 'none' }}>
            <div className="k">当前周期</div>
            <div className="num mono">{displayDayId ? `第 ${displayDayId} 期` : '--'}</div>
          </div>
          <div className="card" style={{ background: 'var(--soft)', boxShadow: 'none' }}>
            <div className="k">我的状态</div>
            <div className="num">{account ? (me ? `${fmtUnits(me.selfBurned || 0n, 18, 4)} 已燃烧` : '加载中…') : '未连接钱包'}</div>
          </div>
          <div className="card" style={{ background: 'var(--soft)', boxShadow: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1 }}>
              <div className="k">待领日榜奖励</div>
              <div className="num mono" style={{ fontSize: 20 }}>{me ? fmtUnits(me.pendingDaily, 18, 4) : '--'}</div>
              <div className="small">最大DeFi攻击</div>
            </div>
            <div style={{ height: '44px', marginTop: '12px', opacity: 0.5, fontSize: '13px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              通过"总待领奖励"按钮领取
            </div>
          </div>
          <div className="card" style={{ background: 'var(--soft)', boxShadow: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1 }}>
              <div className="k">总待领奖励</div>
              <div className="num mono" style={{ fontSize: 20 }}>{me ? fmtUnits(me.pendingTotal, 18, 4) : '--'}</div>
              <div className="small">最大DeFi攻击</div>
            </div>
            <button 
              className="btn-dark" 
              onClick={handleClaimBurn} 
              disabled={claimingBurn || !signer || (me && me.pendingTotal <= 0n)}
              style={{ marginTop: '12px', width: '100%', fontSize: '14px', padding: '8px 12px' }}
            >
              {claimingBurn ? '领取中…' : '领取最大DeFi攻击奖励'}
            </button>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className={`statusbar ${statusCls}`}>
        {statusText}
      </div>
    </section>
  );
}
