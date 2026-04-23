// 社区页 - 品牌面板+4宫格feature+多签+社交链接card+分配说明+合约透明grid
import { CONFIG } from '../config.js';
import { shortAddr } from '../contracts/index.js';

const SOCIAL_LINKS = [
  { name: 'Telegram 群', sub: '最新活动、战报与社区讨论', href: '#' },
  { name: 'QQ 群', sub: '中文用户交流与答疑', href: '#' },
  { name: 'X / Twitter', sub: '官方公告与传播入口', href: '#' },
  { name: 'Debox', sub: '社区任务与互动阵地', href: '#' },
  { name: 'QQ频道', sub: '内容沉淀与通知入口', href: '#' },
];

export default function Community() {
  const copyText = (v) => {
    if (v) navigator.clipboard?.writeText(v).catch(() => {});
  };

  return (
    <section id="community" className="section">
      <h2 className="title">社区</h2>

      {/* 多签钱包 - 标题旁并行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -8 }}>
        <a
          href={`${CONFIG.bscScanBase}${CONFIG.multisigWallet}`}
          target="_blank"
          rel="noreferrer"
          className="pill"
          style={{
            fontSize: 12,
            color: '#6b7280',
            background: 'var(--soft)',
            padding: '5px 10px',
            borderRadius: 999,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          🏛 多签钱包 {shortAddr(CONFIG.multisigWallet)}
        </a>
      </div>

      {/* 品牌面板 */}
      <div className="brand-panel">
        <div style={{ marginTop: 8, fontSize: 30, lineHeight: 1.08, fontWeight: 700, letterSpacing: '-0.05em' }}>
          不是短线噱头，<br />而是把燃烧做成一种长期参与方式。
        </div>
        <div className="small" style={{ fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>
          日榜提供即时反馈，永久权重池提供长期价值沉淀，邀请奖励提供社区扩散动力。页面上的每个核心合约都可公开查询。
        </div>
      </div>

      {/* 4宫格 feature */}
      <div className="feature-grid" style={{ marginTop: 10 }}>
        <div className="feature">
          <div className="k">透明</div><h4>核心地址公开</h4>
          <p>Token、Vault、Factory、Vault Lens、BurnLeaderboardLens 全部已开源验证。</p>
        </div>
        <div className="feature">
          <div className="k">社区</div><h4>多入口承接</h4>
          <p>Telegram、QQ、X、Debox、QQ频道可以统一承接活动、公告和战报。</p>
        </div>
        <div className="feature">
          <div className="k">治理</div><h4>多签管理预留</h4>
          <p>关键管理地址建议由多签协同管理，提升安全感和长期信任。</p>
        </div>
        <div className="feature">
          <div className="k">分配</div><h4>短期榜单 + 长期权重</h4>
          <p>20% 日榜与 50% 永久权重池并行，避免只有短线激励。</p>
        </div>
      </div>

      {/* 社区入口 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="title" style={{ fontSize: 22 }}>社区入口</div>
        <div className="list">
          {SOCIAL_LINKS.map((s, i) => (
            <a key={i} href={s.href} className="linkcard">
              <div className="row white">
                <div>
                  <div className="row-title">{s.name}</div>
                  <div className="row-sub muted">{s.sub}</div>
                </div>
                <div>›</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 分配说明 */}
      <div className="card inverse" style={{ marginTop: 10 }}>
        <div className="title" style={{ color: '#fff', fontSize: 22 }}>分配说明</div>
        <div className="list" style={{ color: 'rgba(255,255,255,.82)' }}>
          <div>30% 用于营销扩展，20% 进入日榜池，50% 进入永久权重池。</div>
          <div>邀请奖励为代币，不与 slisBNB 奖励混淆。</div>
          <div>项目不再做持币分红，而是把激励聚焦在燃烧成长、排行榜和长期权重体系。</div>
        </div>
      </div>
    </section>
  );
}
