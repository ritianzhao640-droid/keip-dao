// 燃烧页 - 输入 + 燃烧操作
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { ZERO } from '../contracts/index.js';
import { VAULT_ABI, ERC20_ABI } from '../contracts/index.js';
import { showToast } from '../components/Toast.jsx';

export default function Burn({ account, signer, chainData }) {
  const [amount, setAmount] = useState('1000000');
  const [inviter, setInviter] = useState('0xf25635ec0f3ca460043d9f2abb49caacaa0328e6'); // 默认绑定地址
  const [burning, setBurning] = useState(false);
  const { tokenDecimals, loadAll } = chainData;

  // URL ref 参数或短链自动填充
  useEffect(() => {
    // 优先从 URL ?ref= 参数取
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ethers.isAddress(ref)) { setInviter(ref); return; }
    // 其次从短链 /r/xxx 解析的 sessionStorage 取
    const storedRef = sessionStorage.getItem('ref_addr');
    if (storedRef) {
      // 短链存的是部分地址，需要补全为 42 位（前缀0x + 6位已知）
      if (ethers.isAddress(storedRef)) {
        setInviter(storedRef);
        sessionStorage.removeItem('ref_addr'); // 用完即删
      }
    }
  }, []);

  // 授权并燃烧
  const handleApproveAndBurn = useCallback(async () => {
    if (!signer || !account) return;
    if (!amount || Number(amount) <= 0) { showToast('请输入有效燃烧数量', 'warn'); return; }

    setBurning(true);
    try {
      const token = new ethers.Contract(CONFIG.token, ERC20_ABI, signer);
      const vault = new ethers.Contract(CONFIG.vault, VAULT_ABI, signer);
      const amountWei = ethers.parseUnits(amount, tokenDecimals);
      const allowance = await token.allowance(account, CONFIG.vault);

      if (allowance < amountWei) {
        const txApprove = await token.approve(CONFIG.vault, ethers.MaxUint256);
        await txApprove.wait();
      }

      const inviterAddr = ethers.isAddress(inviter) ? inviter : ZERO;
      const tx = await vault.burn(amountWei, inviterAddr);
      await tx.wait();

      await loadAll();
    } catch (e) {
      showToast('燃烧失败：' + (e.shortMessage || e.message || '未知错误'), 'error');
    } finally {
      setBurning(false);
    }
  }, [signer, account, amount, inviter, tokenDecimals, loadAll]);

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
            <div className="label">上级地址</div>
            <input value={inviter} onChange={e => setInviter(e.target.value)} placeholder="默认已绑定上级" />
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
