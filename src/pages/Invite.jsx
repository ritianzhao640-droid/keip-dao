// 邀请页 - 真实链上数据
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { fmtUnits, shortAddr } from '../contracts/index.js';
import { VAULT_ABI } from '../contracts/index.js';

export default function Invite({ account, signer, chainData }) {
  const [claiming, setClaiming] = useState(false);
  const { dashboard, tokenDecimals } = chainData;
  const me = dashboard?.me;

  // 复制
  const copyText = (v) => {
    if (v) navigator.clipboard?.writeText(v).catch(() => {});
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
      alert('邀请奖励领取失败：' + (e.shortMessage || e.message || '未知错误'));
    } finally {
      setClaiming(false);
    }
  }, [signer, account, chainData]);

  const inviteLink = account
    ? `${window.location.origin}${window.location.pathname}?ref=${account}`
    : '';

  return (
    <section id="invite" className="section">
      <h2 className="title">邀请</h2>

      <div className="card list">
        <div className="row">
          <div>
            <div className="k">我的邀请地址</div>
            <div className="row-title" style={{ marginTop: 6 }}>{account ? shortAddr(account) : '未连接钱包'}</div>
          </div>
          <button className="btn-dark pill" onClick={() => copyText(account)}>复制</button>
        </div>

        <div className="row">
          <div>
            <div className="k">邀请链接</div>
            <div className="row-title" style={{ marginTop: 6 }}>
              {account ? `${window.location.origin}${window.location.pathname}?ref=${shortAddr(account)}` : '连接钱包后生成'}
            </div>
          </div>
          <button className="btn-dark pill" onClick={() => copyText(inviteLink)}>复制</button>
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
