// 邀请页 - 真实链上数据
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { fmtUnits, shortAddr, ZERO } from '../contracts/index.js';
import { VAULT_ABI } from '../contracts/index.js';
import { showToast } from '../components/Toast.jsx';

export default function Invite({ account, signer, chainData }) {
  const [claiming, setClaiming] = useState(false);
  const { dashboard, tokenDecimals } = chainData;
  const me = dashboard?.me;

  // 复制（带反馈）
  const copyText = (v) => {
    if (!v) {
      showToast('无内容可复制', 'warning');
      return;
    }
    navigator.clipboard?.writeText(v)
      .then(() => showToast('已复制到剪贴板', 'success'))
      .catch(() => showToast('复制失败', 'error'));
  };

  // 领取邀请奖励
  const handleClaimInvite = useCallback(async () => {
    if (!signer || !account) return;
    setClaiming(true);
    try {
      const vault = new ethers.Contract(CONFIG.vault, VAULT_ABI, signer);
      const tx = await vault.claimInviteReward();
      await tx.wait();
      await chainData.loadAll();
    } catch (e) {
      showToast('邀请奖励领取失败：' + (e.shortMessage || e.message || '未知错误'), 'error');
    } finally {
      setClaiming(false);
    }
  }, [signer, account, chainData]);

  // 精简邀请链接展示（8位短码，纯展示用；复制时用完整?ref=链接）
  const shortCode = account ? account.slice(2, 10) : '';
  const displayLink = account
    ? `${window.location.origin}/r/${shortCode}`
    : '';
  const copyLink = account
    ? `${window.location.origin}${window.location.pathname}?ref=${account}`
    : '';

  return (
    <section id="invite" className="section">
      <h2 className="title">邀请</h2>

      <div className="card list">
        <div className="row">
          <div>
            <div className="k">我的上级地址</div>
            <div className="row-title" style={{ marginTop: 6 }}>
              {me?.hasInviter && me?.inviter !== ZERO ? shortAddr(me.inviter) : '未绑定'}
            </div>
          </div>
          <button className="btn-dark pill" onClick={() => copyText(me?.hasInviter && me?.inviter !== ZERO ? me.inviter : '')}>复制</button>
        </div>

        <div className="row">
          <div>
            <div className="k">邀请链接</div>
            <div className="row-title" style={{ marginTop: 6 }}>
              {account ? displayLink : '连接钱包后生成'}
            </div>
          </div>
          <button className="btn-dark pill" onClick={() => copyText(copyLink || displayLink)}>复制</button>
        </div>

        <div className="grid2">
          <div className="card stat" style={{ boxShadow: 'none', background: 'var(--soft)' }}>
            <div className="k">待领邀请奖励</div>
            <div className="num mono">{me ? fmtUnits(me.pendingInvite, tokenDecimals, 4) : '--'}</div>
            <div className="small">代币奖励</div>
          </div>
          <div className="card stat" style={{ boxShadow: 'none', background: 'var(--soft)' }}>
            <div className="k">累计燃烧量</div>
            <div className="num mono">{me ? fmtUnits(me.selfBurned || 0n, tokenDecimals, 4) : '--'}</div>
            <div className="small">个人总燃烧</div>
          </div>
        </div>
      </div>

      {/* 邀请规则 */}
      <div className="card inverse" style={{ marginTop: 10 }}>
        <div className="title" style={{ color: '#fff', fontSize: 22 }}>邀请规则</div>
        <div className="list" style={{ color: 'rgba(255,255,255,.8)' }}>
          <div>• 双级邀请：L1 10%，L2 5%</div>
          <div>• 邀请奖励发放的是代币（非 slisBNB）</div>
          <div>• 与燃烧的 slisBNB 奖励分开显示和领取</div>
        </div>
      </div>

      <button className="btn-dark bigbtn" onClick={handleClaimInvite} disabled={claiming || !signer}>
        {claiming ? '领取中…' : '领取邀请奖励'}
      </button>
    </section>
  );
}
