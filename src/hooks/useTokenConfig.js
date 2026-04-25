import { useState, useEffect } from 'react';
import { CONFIG } from '../config';

const STORAGE_KEY = 'keip-dao-token-configs';

export const useTokenConfig = (walletAddress) => {
  const [configs, setConfigs] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);

  // 从 localStorage 加载配置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfigs(parsed.configs || []);
        setActiveConfig(parsed.activeConfig || null);
      } catch (e) {
        console.error('Failed to parse saved configs', e);
      }
    } else {
      // 使用默认配置
      setConfigs(CONFIG.defaultTokenConfigs);
      if (CONFIG.defaultTokenConfigs.length > 0) {
        setActiveConfig(CONFIG.defaultTokenConfigs[0]);
      }
    }
  }, []);

  // 保存到 localStorage
  const saveConfigs = (newConfigs, newActiveConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      configs: newConfigs,
      activeConfig: newActiveConfig
    }));
  };

  const addConfig = (config) => {
    const newConfigs = [...configs, { ...config, id: Date.now().toString() }];
    setConfigs(newConfigs);
    if (!activeConfig) {
      setActiveConfig(newConfigs[0]);
    }
    saveConfigs(newConfigs, activeConfig);
  };

  const updateConfig = (id, updated) => {
    const newConfigs = configs.map(c => c.id === id ? { ...c, ...updated } : c);
    setConfigs(newConfigs);
    if (activeConfig?.id === id) {
      setActiveConfig({ ...activeConfig, ...updated });
    }
    saveConfigs(newConfigs, activeConfig);
  };

  const deleteConfig = (id) => {
    const newConfigs = configs.filter(c => c.id !== id);
    setConfigs(newConfigs);
    if (activeConfig?.id === id) {
      setActiveConfig(newConfigs.length > 0 ? newConfigs[0] : null);
    }
    saveConfigs(newConfigs, activeConfig);
  };

  const setActive = (id) => {
    const config = configs.find(c => c.id === id);
    if (config) {
      setActiveConfig(config);
      saveConfigs(configs, config);
    }
  };

  const isAdmin = walletAddress && CONFIG.adminWallets.includes(walletAddress.toLowerCase());

  return {
    configs,
    activeConfig,
    addConfig,
    updateConfig,
    deleteConfig,
    setActive,
    isAdmin
  };
};