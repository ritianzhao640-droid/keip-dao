// 日榜页 - 真实链上数据（BurnDistributor dayTop10 + 历史战报）
import { CONFIG } from '../config.js';
import { fmtUnits, fmtNum, shortAddr } from '../contracts/index.js';

export default function Board({ chainData }) {
  const { boardOverview, top10, top10Loading, history, historyLoading, dayId } = chainData;

  return (
    <section id="board" className="section">
      <h2 className="title">日榜</h2>
      <div className="desc">来自 BurnDistributor.dayTop10 / daySummary 的真实链上数据</div>

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
          {dayId ? <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 8 }}>Day #{dayId}</span> : null}
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
