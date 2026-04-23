// 燃烧页 - 对齐 v5 burn-accent hero + 输入卡片 + 预览区grid2 + 双按钮
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { ZERO } from '../contracts/index.js';
import { fmtUnits } from '../contracts/index.js';
import { VAULT_ABI, ERC20_ABI } from '../contracts/index.js';

export default function Burn({ account, signer, chainData }) {
  const [amount, setAmount] = useState('1000000');
  const [inviter, setInviter] = useState('');
  const [burning, setBurning] = useState(false);
  const { tokenDecimals, preview, previewLoading, loadPreview, loadAll } = chainData;

  // URL ref 参数自动填充
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ethers.isAddress(ref)) setInviter(ref);
  }, []);

  // 数量变化时触发预览
  useEffect(() => {
    loadPreview(amount, inviter);
  }, [amount, inviter, loadPreview]);

  // 授权并燃烧
  const handleApproveAndBurn = useCallback(async () => {
    if (!signer || !account) return;
    if (!amount || Number(amount) <= 0) { alert('请输入有效燃烧数量。'); return; }

    setBurning(true);
    try {
      // 检查授权
      const token = new ethers.Contract(CONFIG.token, ERC20_ABI, signer);
      const vault = new ethers.Contract(CONFIG.vault, VAULT_ABI, signer);
      const amountWei = ethers.parseUnits(amount, tokenDecimals);
      const allowance = await token.allowance(account, CONFIG.vault);

      if (allowance < amountWei) {
        const txApprove = await token.approve(CONFIG.vault, ethers.MaxUint256);
        await txApprove.wait();
      }

      // 燃烧
      const inviterAddr = ethers.isAddress(inviter) ? inviter : ZERO;
      const tx = await vault.burn(amountWei, inviterAddr);
      await tx.wait();

      // 刷新数据
      await loadAll();
    } catch (e) {
      alert('燃烧失败：' + (e.shortMessage || e.message || '未知错误'));
    } finally {
      setBurning(false);
    }
  }, [signer, account, amount, inviter, tokenDecimals, loadAll]);

  // 状态栏文案
  let burnStatusText = '输入数量后将尝试读取链上预览。';
  let burnStatusCls = '';
  if (previewLoading) { burnStatusText = '正在预览…'; }
  else if (preview) { burnStatusText = '预览已从真实链上读取。'; burnStatusCls = 'ok'; }

  return (
    <section id="burn" className="section">
      <h2 className="title">燃烧</h2>

      {/* Burn Mode Hero */}
      <div className="card inverse burn-accent" style={{ marginBottom: 10, padding: 18 }}>
        <div className="burn-lines"></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="k"><span className="ember-dot"></span>Burn Mode</div>
              <div style={{ marginTop: 8, fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Burn</div>
              <div className="desc" style={{ marginTop: 6, marginBottom: 0 }}></div>
            </div>
            <div style={{ width: 54, height: 54, borderRadius: 18, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔥</div>
          </div>
        </div>
      </div>

      {/* 输入卡片 */}
      <div className="card">
        <div className="stack">
          <div>
            <div className="label">燃烧数量</div>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="输入燃烧数量" />
          </div>
          <div>
            <div className="label">上级地址</div>
            <input value={inviter} onChange={e => setInviter(e.target.value)} placeholder="可选，输入上级地址" />
          </div>
        </div>
      </div>

      {/* 预览区 */}
      <div className="card inverse burn-accent" style={{ marginTop: 10 }}>
        <div className="burn-lines"></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="title" style={{ color: '#fff', fontSize: 22 }}>燃烧前预览</div>
          <div className="desc">当前奖池快照预估</div>
          <div className="grid2">
            <div className="card stat"><div className="k">输入数量</div><div id="pv-input" className="num mono">{preview ? fmtUnits(preview.inputAmount, tokenDecimals, 4) : '--'}</div></div>
            <div className="card stat"><div className="k">L1 奖励</div><div id="pv-l1" className="num mono">{preview ? fmtUnits(preview.l1ReferralReward, tokenDecimals, 4) : '--'}</div></div>
            <div className="card stat"><div className="k">L2 奖励</div><div id="pv-l2" className="num mono">{preview ? fmtUnits(preview.l2ReferralReward, tokenDecimals, 4) : '--'}</div></div>
            <div className="card stat"><div className="k">实际燃烧</div><div id="pv-actual" className="num mono">{preview ? fmtUnits(preview.actualBurn, tokenDecimals, 4) : '--'}</div></div>
            <div className="card stat"><div className="k">新增永久权重</div><div id="pv-weight" className="num mono">{preview ? fmtUnits(preview.addedWeight, tokenDecimals, 4) : '--'}</div></div>
            <div className="card stat"><div className="k">预计排名</div><div id="pv-rank" className="num mono">{preview ? (Number(preview.estimatedRank) > 0 ? `#${preview.estimatedRank}` : '未进前十') : '--'}</div></div>
            <div className="card" style={{ gridColumn: '1 / -1', background: '#fff', color: '#111', boxShadow: 'none' }}>
              <div className="k">currentPotEstimatedDailyReward</div>
              <div id="pv-reward" className="num mono">{preview ? `${fmtUnits(preview.currentPotEstimatedDailyReward, 18, 4)} slisBNB` : '--'}</div>
              <div className="small">按当前奖池快照估算</div>
            </div>
          </div>
        </div>
      </div>

      {/* 按钮行 */}
      <div className="btnrow">
        <button className="btn-dark bigbtn" onClick={handleApproveAndBurn} disabled={burning || !signer}>
          {burning ? '处理中...' : '授权并燃烧'}
        </button>
        <button className="btn-light bigbtn" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'invite' }))}>去邀请页</button>
      </div>

      {/* 状态栏 */}
      <div className={`statusbar ${burnStatusCls}`}>{burnStatusText}</div>
    </section>
  );
}
