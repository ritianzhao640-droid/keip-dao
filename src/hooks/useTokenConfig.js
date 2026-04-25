// 代币配置管理 Hook
import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config.js';

const STORAGE_KEY = 'keip_token_configs';
const ACTIVE_TOKEN_KEY = 'keip_active_token_id';

export function useTokenConfig() {
  const [configs, setConfigs] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // 加载配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedActive = localStorage.getItem(ACTIVE_TOKEN_KEY);
      const loadedConfigs = saved ? JSON.parse(saved) : CONFIG.defaultTokenConfigs;
      setConfigs(loadedConfigs);
      const activeId = savedActive || (loadedConfigs.length > 0 ? loadedConfigs[0].id : '');
      const active = loadedConfigs.find(c => c.id === activeId) || loadedConfigs[0] || null;
      setActiveConfig(active);
    } catch (e) {
      console.error('加载代币配置失败:', e);
      setConfigs(CONFIG.defaultTokenConfigs);
      setActiveConfig(CONFIG.defaultTokenConfigs[0] || null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 监听配置变化事件（来自设置页面）
  useEffect(() => {
    const handleConfigChange = (event) => {
      const newConfig = event.detail;
      if (newConfig && newConfig.id) {
        setActiveConfig(newConfig);
        // 更新configs列表
        setConfigs(prev => {
          const index = prev.findIndex(c => c.id === newConfig.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newConfig;
            return updated;
          }
          return [...prev, newConfig];
        });
      }
    };
    window.addEventListener('tokenConfigChanged', handleConfigChange);
    return () => window.removeEventListener('tokenConfigChanged', handleConfigChange);
  }, []);

  // 更新配置列表
  const updateConfigs = useCallback((newConfigs, activeId) => {
    setConfigs(newConfigs);
    const active = newConfigs.find(c => c.id === activeId) || newConfigs[0] || null;
    setActiveConfig(active);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
    if (activeId) localStorage.setItem(ACTIVE_TOKEN_KEY, activeId);
  }, []);

  // 设置活动配置
  const setActive = useCallback((id) => {
    const config = configs.find(c => c.id === id);
    if (config) {
      setActiveConfig(config);
      localStorage.setItem(ACTIVE_TOKEN_KEY, id);
      window.dispatchEvent(new CustomEvent('tokenConfigChanged', { detail: config }));
    }
  }, [configs]);

  return {
    configs,
    activeConfig,
    loading,
    updateConfigs,
    setActive,
  };
}

// 获取当前活动配置的合约地址（兼容旧版）
export function getCurrentConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActive = localStorage.getItem(ACTIVE_TOKEN_KEY);
    const configs = saved ? JSON.parse(saved) : CONFIG.defaultTokenConfigs;
    const activeId = savedActive || (configs.length > 0 ? configs[0].id : '');
    return configs.find(c => c.id === activeId) || configs[0] || CONFIG.defaultTokenConfigs[0];
  } catch {
    return CONFIG.defaultTokenConfigs[0];
  }
}

// 获取当前代币地址（快捷方式）
export function getCurrentTokenAddress() {
  return getCurrentConfig().tokenAddress;
}

// 获取当前Vault地址（快捷方式）
export function getCurrentVaultAddress() {
  return getCurrentConfig().vaultAddress;
}