// 日榜页 - 真实链上数据（BurnDistributor dayTop10 + 历史战报）
import { useState, useEffect } from 'react';
import { CONFIG } from '../config.js';
import { fmtUnits, fmtNum, shortAddr, formatCountdown } from '../contracts/index.js';

export default function Board({ chainData }) {
  const { boardOverview, top10, top10Loading, history, historyLoading, dayId, displayDayId } = chainData;
  
  // 结算倒计时（距离 UTC 0 点）
  const [countdown, setCountdown] = useState('--:--:--');
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const utcNow = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
      );
      // 下一个 UTC 0 点
      const nextUTC0 = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      );
      const remainingSeconds = Math.floor((nextUTC0 - utcNow) / 1000);
      setCountdown(formatCountdown(remainingSeconds));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="board" className="section">
      <h2 className="title">日榜</h2>
      <div className="desc">来自 BurnDistributor.dayTop10 / daySummary 的真实链上数据</div>

      {/* 结算状态与倒计时 */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="grid2">
          <div className="stat">
            <div className="k">今日状态</div>
            <div className="num mono" style={{ color: boardOverview?.finalized ? 'var(--muted)' : 'var(--primary)' }}>
              {boardOverview ? (boardOverview.finalized ? '已结算' : '进行中') : '--'}
            </div>
          </div>
          <div className="stat">
            <div className="k">结算倒计时</div>
            <div className="num mono" style={{ fontFamily: 'monospace', fontSize: 24 }}>
              {countdown}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
          每日 UTC 0 点（北京时间 8:00）结算 · 结算后可领取奖励
        </div>
      </div>

      {/* grid3 总览 */}
      <div className="grid3">
        <div className="card stat">
          <div className="k">今日奖池</div>
          <div className="num mono">{boardOverview ? fmtUnits(boardOverview.rewardPot, 18, 4) : '--'}</div>
        </div>
        <div className="card stat">
          <div className="k">总燃烧</div>
          <div className="num mono">{boardOverview ? fmtUnits(boardOverview.totalBurned, 18, 2) : '--'}</div>
        </div>
        <div className="card stat">
          <div className="k">参与人数</div>
          <div className="num mono">{boardOverview ? fmtNum(boardOverview.participantCount, 0) : '--'}</div>
        </div>
      </div>

      {/* Top10 列表 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="title" style={{ fontSize: 22 }}>
          今日前十
          {dayId ? <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 8 }}>第{dayId - 20565}期</span> : null}
        </div>
        <div className="list">
          {top10Loading ? (
            <div className="row"><div>加载中…</div><div className="muted">—</div></div>
          ) : top10.length === 0 ? (
            <div className="row"><div>暂无榜单数据</div><div className="muted">—</div></div>
          ) : (
            top10.map((r, idx) => (
              <div key={idx} className={`row ${idx === 0 ? 'top1' : ''}`}>
                <div className="row-left">
                  <div className="rank">{r.rank}</div>
                  <div>
                    <div className="row-title">{shortAddr(r.user)}</div>
                    <div className="row-sub muted">燃烧 {fmtUnits(r.burned, 18, 4)}</div>
                  </div>
                </div>
                <div className="right">
                  <div className="row-title">#{r.rank}</div>
                  <div className="row-sub muted">最大DeFi攻击</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 历史战报 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="title" style={{ fontSize: 22 }}>历史战报</div>
        <div className="desc">来自 BurnDistributor.daySummary + dayTop10</div>
        <div className="list">
          {historyLoading ? (
            <div className="row"><div>加载中…</div><div className="muted">—</div></div>
          ) : history.length === 0 ? (
            <div className="row"><div>暂无历史数据</div><div className="muted">—</div></div>
          ) : (
            history.map((d, idx) => (
              <div key={idx} className="row">
                <div>
                  <div className="row-title">第{d.dayId - 20565}期</div>
                  <div className="row-sub muted">冠军 {shortAddr(d.champion)}</div>
                </div>
                <div className="right">
                  <div className="row-title">{fmtUnits(d.totalReward, 18, 4)}</div>
                  <div className="row-sub muted">{d.finalized ? '已结算' : '进行中'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
