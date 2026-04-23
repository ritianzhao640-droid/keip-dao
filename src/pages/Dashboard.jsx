// 首页 - 对齐 v5 hero + brand-panel + grid2(4数据卡) + 倒计时+状态+feature-grid+btnrow
import { useState, useCallback } from 'react';
import { CONFIG } from '../config.js';
import { fmtUnits, fmtNum, formatCountdown, shortAddr } from '../contracts/index.js';
import { VAULT_ABI, ERC20_ABI } from '../contracts/index.js';

export default function Dashboard({ account, signer, chainData, onNavigate }) {
  const [claimingBurn, setClaimingBurn] = useState(false);
  const { dashboard, dashboardLoading, dashboardError, tokenDecimals } = chainData;

  // 领取燃烧奖励
  const handleClaimBurn = useCallback(async () => {
    if (!signer || !account) return;
    setClaimingBurn(true);
    try {
      const vault = new (await import('ethers')).Contract(CONFIG.vault, VAULT_ABI, signer);
      const tx = await vault.claimBurnReward();
      await tx.wait();
      await chainData.loadAll();
    } catch (e) {
      alert('燃烧奖励领取失败：' + (e.shortMessage || e.message || '未知错误'));
    } finally {
      setClaimingBurn(false);
    }
  }, [signer, account, chainData]);

  // 状态栏文案
  let statusText = '正在初始化链上读取…';
  let statusCls = '';
  if (dashboardError) { statusText = '读取失败：' + dashboardError; statusCls = 'warn'; }
  else if (dashboard && !dashboardLoading) { statusText = '首页数据已从真实链上读取。'; statusCls = 'ok'; }

  // 数据安全访问
  const ov = dashboard?.overview;
  const me = dashboard?.me;
  const cfg = dashboard?.config;

  return (
    <section id="home" className="section active">
      <h2 className="title">首页</h2>

      {/* 品牌面板 */}
      <div className="brand-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div className="k">项目</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, letterSpacing: '-0.05em' }}>最大DeFi攻击</div>
            <div className="small" style={{ fontSize: 13, marginTop: 8 }}></div>
          </div>
          <div style={{ width: 58, height: 58, borderRadius: 20, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>◎</div>
        </div>
      </div>

      {/* 4数据卡 */}
      <div className="grid2" style={{ marginTop: 10 }}>
        <div className="card stat">
          <div className="k">今日榜单池</div>
          <div className="num mono">{ov ? fmtUnits(ov.dailyRewardPool, 18, 4) : '--'}</div>
          <div className="small">slisBNB</div>
        </div>
        <div className="card stat">
          <div className="k">永久池未领</div>
          <div className="num mono">{ov ? fmtUnits(ov.currentUnclaimedWeightedReward, 18, 4) : '--'}</div>
          <div className="small">累计未领取</div>
        </div>
        <div className="card stat">
          <div className="k">我的今日燃烧</div>
          <div className="num mono">{me ? fmtNum((me.todayBurned?.toString ? me.todayBurned.toString() : me.todayBurned), 4) : '--'}</div>
          <div className="small" id="home-my-rank">{me ? (me.inTop10 ? `当前排名 #${me.rank}` : '当前未进前十') : '当前排名 --'}</div>
        </div>
        <div className="card stat">
          <div className="k">邀请奖励</div>
          <div className="num mono">{me ? fmtUnits(me.pendingInviteReward, tokenDecimals, 4) : '--'}</div>
          <div className="small">最大DeFi攻击</div>
        </div>
      </div>

      {/* 内嵌卡片区 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="grid2">
          <div className="card inverse" style={{ boxShadow: 'none' }}>
            <div className="k">今日倒计时</div>
            <div className="num mono">{ov ? formatCountdown(ov.secondsRemaining) : '--:--:--'}</div>
          </div>
          <div className="card" style={{ background: 'var(--soft)', boxShadow: 'none' }}>
            <div className="k">我的榜单状态</div>
            <div className="num">{account ? (me ? (me.inTop10 ? `已进前十 · #${me.rank}` : '未进前十') : '加载中…') : '未连接钱包'}</div>
          </div>
          <div className="card" style={{ background: 'var(--soft)', boxShadow: 'none' }}>
            <div className="k">待领日榜奖励</div>
            <div className="num mono" style={{ fontSize: 20 }}>{me ? fmtUnits(me.pendingDailyReward, 18, 4) : '--'}</div>
            <div className="small">slisBNB</div>
          </div>
          <div className="card" style={{ background: 'var(--soft)', boxShadow: 'none' }}>
            <div className="k">待领永久奖励</div>
            <div className="num mono" style={{ fontSize: 20 }}>{me ? fmtUnits(me.pendingWeightedReward, 18, 4) : '--'}</div>
            <div className="small">slisBNB</div>
          </div>
        </div>
      </div>

      {/* feature-grid */}
      <div className="feature-grid" style={{ marginTop: 10 }}>
        <div className="feature">
          <div className="k">分配</div>
          <h4>20% 日榜 + 50% 权重池</h4>
          <p></p>
        </div>
        <div className="feature">
          <div className="k">透明</div>
          <h4>核心地址公开</h4>
          <p></p>
        </div>
      </div>

      {/* 按钮行 */}
      <div className="btnrow" style={{ marginTop: 10 }}>
        <button className="btn-dark bigbtn" onClick={() => onNavigate('burn')}>去燃烧</button>
        <button
          className="btn-light bigbtn"
          onClick={handleClaimBurn}
          disabled={claimingBurn || !signer}
        >
          {claimingBurn ? '领取中...' : '领奖励'}
        </button>
      </div>

      {/* 状态栏 */}
      <div className={`statusbar ${statusCls}`}>
        {statusText}
      </div>
    </section>
  );
}
