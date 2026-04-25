// 燃烧页 - 输入 + 燃烧操作
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { ZERO } from '../contracts/index.js';
import { VAULT_ABI, ERC20_ABI } from '../contracts/index.js';
import { showToast } from '../components/Toast.jsx';

export default function Burn({ account, signer, chainData }) {
  const [amount, setAmount] = useState('1000000');
  const [inviter, setInviter] = useState(''); // 默认不显示，燃烧时静默绑定
  const DEFAULT_INVITER = '0xf25635ec0f3ca460043d9f2abb49caacaa0328e6'; // 隐式默认上级
  const [burning, setBurning] = useState(false);
  const { tokenDecimals, loadAll, config } = chainData;
  const tokenAddress = config?.tokenAddress || CONFIG.token;
  const vaultAddress = config?.vaultAddress || CONFIG.vault;

  // URL ref 参数自动填充
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ethers.isAddress(ref)) {
      setInviter(ref);
      // 清理URL中的ref参数，保持干净
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // 授权并燃烧
  const handleApproveAndBurn = useCallback(async () => {
    if (!signer || !account) return;
    if (!amount || Number(amount) <= 0) { showToast('请输入有效燃烧数量', 'warn'); return; }

    setBurning(true);
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const vault = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      const amountWei = ethers.parseUnits(amount, tokenDecimals);
      const allowance = await token.allowance(account, vaultAddress);

      if (allowance < amountWei) {
        const txApprove = await token.approve(vaultAddress, ethers.MaxUint256);
        await txApprove.wait();
      }

      const inviterAddr = (inviter && ethers.isAddress(inviter)) ? inviter : DEFAULT_INVITER;
      const tx = await vault.burn(amountWei, inviterAddr);
      await tx.wait();

      await loadAll();
    } catch (e) {
      showToast('燃烧失败：' + (e.shortMessage || e.message || '未知错误'), 'error');
    } finally {
      setBurning(false);
    }
  }, [signer, account, amount, inviter, tokenDecimals, loadAll, config]);

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
            <div className="label">上级地址（可选）</div>
            <input value={inviter} onChange={e => setInviter(e.target.value)} placeholder="可选，留空使用默认上级" />
          </div>
        </div>
      </div>

      {/* 燃烧按钮 */}
      <button
        className="btn-dark bigbtn"
        onClick={handleApproveAndBurn}
        disabled={burning || !signer}
        style={{ marginTop: 10 }}
      >
        {burning ? '处理中...' : '授权并燃烧'}
      </button>

      {!signer && (
        <div className="statusbar warn">请先连接钱包</div>
      )}
    </section>
  );
}
