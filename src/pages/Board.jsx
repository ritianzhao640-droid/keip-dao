// 日榜页 - grid3总览 + Top10列表 + 嵌入历史战报
import { CONFIG } from '../config.js';
import { fmtUnits, fmtNum, formatCountdown, shortAddr } from '../contracts/index.js';

export default function Board({ chainData }) {
  const { dashboard, top10, top10Loading, history, historyLoading } = chainData;
  const ov = dashboard?.overview;

  return (
    <section id="board" className="section">
      <h2 className="title">日榜</h2>
      <div className="desc">榜单与历史已经开始读取真实数据；如果读取失败，会显示占位状态。</div>

      {/* grid3 总览 */}
      <div className="grid3">
        <div className="card stat">
          <div className="k">今日奖池</div>
          <div className="num mono">{ov ? fmtUnits(ov.dailyRewardPool, 18, 4) : '--'}</div>
        </div>
        <div className="card stat">
          <div className="k">总燃烧</div>
          <div className="num mono">{ov ? fmtNum(ov.todayTotalBurned, 4) : '--'}</div>
        </div>
        <div className="card stat">
          <div className="k">倒计时</div>
          <div className="num mono">{ov ? formatCountdown(ov.secondsRemaining) : '--:--:--'}</div>
        </div>
      </div>

      {/* Top10 列表 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="title" style={{ fontSize: 22 }}>今日前十</div>
        <div className="desc">来自 BurnLeaderboardLens.currentBurnBoardTop10(vault)</div>
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
                  <div className="row-title">{fmtUnits(r.estimatedReward, 18, 4)}</div>
                  <div className="row-sub muted">slisBNB</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 历史战报 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="title" style={{ fontSize: 22 }}>历史战报</div>
        <div className="desc">来自 BurnLeaderboardLens.recentBurnBoardDays(vault, 6)</div>
        <div className="list">
          {historyLoading ? (
            <div className="row"><div>加载中…</div><div className="muted">—</div></div>
          ) : history.length === 0 ? (
            <div className="row"><div>暂无历史数据</div><div className="muted">—</div></div>
          ) : (
            history.map((d, idx) => (
              <div key={idx} className="row">
                <div>
                  <div className="row-title">Day {d.dayId}</div>
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
