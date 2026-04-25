// 设置页面 - 仅管理员可访问
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { ERC20_ABI } from '../contracts/index.js';
import { showToast } from '../components/Toast.jsx';

// localStorage 键名
const STORAGE_KEY = 'keip_token_configs';
const ACTIVE_TOKEN_KEY = 'keip_active_token_id';

export default function Settings({ account, signer, chainData, onNavigate }) {
  const [tokenConfigs, setTokenConfigs] = useState([]);
  const [activeTokenId, setActiveTokenId] = useState('');
  const [editingId, setEditingId] = useState(null); // 正在编辑的配置ID，null表示新增
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    tokenAddress: '',
    vaultAddress: '',
    burnDistributorAddress: '',
    vaultLensAddress: '',
    symbol: '',
    decimals: 18,
  });
  const [loading, setLoading] = useState(false);

  // 检查当前钱包是否为管理员
  const isAdmin = account && CONFIG.adminWallets.includes(account.toLowerCase());

  // 从 localStorage 加载配置
  useEffect(() => {
    if (!isAdmin) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedActive = localStorage.getItem(ACTIVE_TOKEN_KEY);
      const configs = saved ? JSON.parse(saved) : CONFIG.defaultTokenConfigs;
      setTokenConfigs(configs);
      const active = savedActive || (configs.length > 0 ? configs[0].id : '');
      setActiveTokenId(active);
    } catch (e) {
      console.error('加载配置失败:', e);
      setTokenConfigs(CONFIG.defaultTokenConfigs);
    }
  }, [isAdmin]);

  // 保存配置到 localStorage
  const saveConfigs = useCallback((configs, activeId) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    if (activeId) localStorage.setItem(ACTIVE_TOKEN_KEY, activeId);
  }, []);

  // 表单字段更新
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 从链上获取代币符号和小数位
  const fetchTokenInfo = useCallback(async (tokenAddress) => {
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) return;
    try {
      const provider = chainData.provider || new ethers.JsonRpcProvider(CONFIG.rpcUrls[0]);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([
        token.symbol(),
        token.decimals(),
      ]);
      setFormData(prev => ({ ...prev, symbol, decimals }));
      showToast(`已读取代币信息: ${symbol} (${decimals} 位小数)`, 'success');
    } catch (e) {
      console.warn('无法读取代币信息:', e);
      showToast('无法读取代币信息，请手动填写', 'warning');
    }
  }, [chainData.provider]);

  // 自动填充代币信息
  useEffect(() => {
    if (formData.tokenAddress && ethers.isAddress(formData.tokenAddress)) {
      const debounce = setTimeout(() => fetchTokenInfo(formData.tokenAddress), 500);
      return () => clearTimeout(debounce);
    }
  }, [formData.tokenAddress, fetchTokenInfo]);

  // 保存配置（新增或编辑）
  const handleSaveConfig = useCallback(() => {
    const { id, name, tokenAddress, vaultAddress, burnDistributorAddress, vaultLensAddress, symbol, decimals } = formData;
    if (!id.trim() || !name.trim() || !ethers.isAddress(tokenAddress) || !ethers.isAddress(vaultAddress)) {
      showToast('请填写必要字段且地址格式正确', 'error');
      return;
    }

    const newConfigs = [...tokenConfigs];
    const existingIndex = newConfigs.findIndex(c => c.id === id);
    const config = {
      id,
      name,
      tokenAddress,
      vaultAddress,
      burnDistributorAddress: burnDistributorAddress || CONFIG.burnDistributor,
      vaultLensAddress: vaultLensAddress || CONFIG.vaultLens,
      symbol,
      decimals,
    };

    if (existingIndex >= 0) {
      newConfigs[existingIndex] = config;
      showToast(`配置 "${name}" 已更新`, 'success');
    } else {
      newConfigs.push(config);
      showToast(`配置 "${name}" 已添加`, 'success');
    }

    setTokenConfigs(newConfigs);
    saveConfigs(newConfigs, activeTokenId);
    setFormData({
      id: '',
      name: '',
      tokenAddress: '',
      vaultAddress: '',
      burnDistributorAddress: '',
      vaultLensAddress: '',
      symbol: '',
      decimals: 18,
    });
    setEditingId(null);
  }, [formData, tokenConfigs, activeTokenId, saveConfigs]);

  // 编辑配置
  const handleEdit = (config) => {
    setFormData(config);
    setEditingId(config.id);
  };

  // 删除配置
  const handleDelete = (id) => {
    if (tokenConfigs.length <= 1) {
      showToast('至少保留一个代币配置', 'error');
      return;
    }
    const newConfigs = tokenConfigs.filter(c => c.id !== id);
    setTokenConfigs(newConfigs);
    saveConfigs(newConfigs, activeTokenId === id ? (newConfigs.length > 0 ? newConfigs[0].id : '') : activeTokenId);
    if (activeTokenId === id) setActiveTokenId(newConfigs.length > 0 ? newConfigs[0].id : '');
    showToast('配置已删除', 'success');
  };

  // 设置激活代币
  const handleSetActive = (id) => {
    setActiveTokenId(id);
    saveConfigs(tokenConfigs, id);
    showToast(`已切换至 "${tokenConfigs.find(c => c.id === id)?.name}"`, 'success');
  };

  // 应用当前激活配置到全局 CONFIG（临时，仅本次会话）
  const handleApplyToSession = useCallback(() => {
    const active = tokenConfigs.find(c => c.id === activeTokenId);
    if (!active) return;
    // 这里可以更新全局状态或通过事件通知其他组件
    // 目前先展示提示
    showToast(`已应用 "${active.name}" 配置（仅本次会话生效）`, 'success');
    // 可以触发自定义事件，让其他组件重新加载数据
    window.dispatchEvent(new CustomEvent('tokenConfigChanged', { detail: active }));
  }, [tokenConfigs, activeTokenId]);

  if (!isAdmin) {
    return (
      <section id="settings" className="section">
        <h2 className="title">设置</h2>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>仅管理员可访问</div>
          <div style={{ marginTop: 8, color: '#888' }}>当前钱包地址：{account ? account.slice(0, 8) + '...' : '未连接'}</div>
          <div style={{ marginTop: 16, fontSize: 14 }}>如需访问，请将你的地址添加到 config.js 的 adminWallets 列表中。</div>
        </div>
      </section>
    );
  }

  return (
    <section id="settings" className="section">
      <h2 className="title">代币配置管理</h2>
      <div className="card">
        <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          此页面允许管理员添加、编辑和切换不同的代币配置。配置将保存在浏览器本地存储中。
        </div>

        {/* 当前激活配置 */}
        {activeTokenId && (
          <div style={{ marginBottom: 24, padding: 16, background: 'var(--soft)', borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>当前激活配置</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {tokenConfigs.find(c => c.id === activeTokenId)?.name || '未知'}
                </div>
                <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
                  代币: {tokenConfigs.find(c => c.id === activeTokenId)?.tokenAddress?.slice(0, 10)}...
                </div>
              </div>
              <button
                className="btn-dark"
                onClick={handleApplyToSession}
                style={{ fontSize: 14, padding: '8px 16px' }}
              >
                应用配置
              </button>
            </div>
          </div>
        )}

        {/* 配置表单 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>{editingId ? '编辑配置' : '新增配置'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>配置ID（英文唯一标识）</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleFormChange('id', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
                disabled={!!editingId}
                placeholder="如：default、token2"
              />
            </div>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>显示名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
                placeholder="如：默认代币"
              />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>代币合约地址</label>
            <input
              type="text"
              value={formData.tokenAddress}
              onChange={(e) => handleFormChange('tokenAddress', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
              placeholder="0x..."
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Vault 合约地址</label>
            <input
              type="text"
              value={formData.vaultAddress}
              onChange={(e) => handleFormChange('vaultAddress', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
              placeholder="0x..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>BurnDistributor 地址（可选）</label>
              <input
                type="text"
                value={formData.burnDistributorAddress}
                onChange={(e) => handleFormChange('burnDistributorAddress', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
                placeholder="留空使用默认"
              />
            </div>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>VaultLens 地址（可选）</label>
              <input
                type="text"
                value={formData.vaultLensAddress}
                onChange={(e) => handleFormChange('vaultLensAddress', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
                placeholder="留空使用默认"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>代币符号</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => handleFormChange('symbol', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
                placeholder="如：ABC"
              />
            </div>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>小数位数</label>
              <input
                type="number"
                value={formData.decimals}
                onChange={(e) => handleFormChange('decimals', parseInt(e.target.value) || 18)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333' }}
                min="0"
                max="36"
              />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              className="btn-dark"
              onClick={handleSaveConfig}
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              {editingId ? '更新配置' : '添加配置'}
            </button>
            {editingId && (
              <button
                className="btn-dark"
                onClick={() => {
                  setFormData({
                    id: '',
                    name: '',
                    tokenAddress: '',
                    vaultAddress: '',
                    burnDistributorAddress: '',
                    vaultLensAddress: '',
                    symbol: '',
                    decimals: 18,
                  });
                  setEditingId(null);
                }}
                style={{ padding: '10px 20px', fontSize: 14, background: '#444' }}
              >
                取消编辑
              </button>
            )}
          </div>
        </div>

        {/* 配置列表 */}
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>现有配置</h3>
          {tokenConfigs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>暂无配置，请添加第一个。</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tokenConfigs.map(config => (
                <div
                  key={config.id}
                  style={{
                    padding: 16,
                    border: '1px solid #333',
                    borderRadius: 12,
                    background: activeTokenId === config.id ? 'rgba(0, 100, 255, 0.1)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {config.name} <span style={{ fontSize: 13, color: '#aaa' }}>({config.id})</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                        代币: {config.tokenAddress.slice(0, 10)}... | 符号: {config.symbol || '未知'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {activeTokenId !== config.id && (
                        <button
                          className="btn-dark"
                          onClick={() => handleSetActive(config.id)}
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          激活
                        </button>
                      )}
                      <button
                        className="btn-dark"
                        onClick={() => handleEdit(config)}
                        style={{ fontSize: 12, padding: '6px 12px', background: '#444' }}
                      >
                        编辑
                      </button>
                      {tokenConfigs.length > 1 && (
                        <button
                          className="btn-dark"
                          onClick={() => handleDelete(config.id)}
                          style={{ fontSize: 12, padding: '6px 12px', background: '#a00' }}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}