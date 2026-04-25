// 钱包连接管理 Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { ZERO } from '../contracts/index.js';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainOk, setChainOk] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const providerRef = useRef(null);

  // 检查并切换到 BSC 主网
  const switchToBSC = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // 56
      });
      return true;
    } catch (switchError) {
      // 链未添加时尝试添加
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BSC Mainnet',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org'],
              blockExplorerUrls: ['https://bscscan.com'],
            }],
          });
          return true;
        } catch { return false; }
      }
      return false;
    }
  }, []);

  // 连接钱包
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('未检测到钱包，请先安装 MetaMask / OKX Wallet / TokenPocket 等。');
      return false;
    }
    setConnecting(true);
    try {
      const bp = new ethers.BrowserProvider(window.ethereum);
      await bp.send('eth_requestAccounts', []);
      let network = await bp.getNetwork();
      if (Number(network.chainId) !== CONFIG.chainId) {
        const switched = await switchToBSC();
        if (!switched) {
          alert('请切换到 BSC 主网（chainId=56）。');
          setConnecting(false);
          return false;
        }
        network = await bp.getNetwork();
      }
      const s = await bp.getSigner();
      const addr = await s.getAddress();
      providerRef.current = bp;
      setSigner(s);
      setAccount(addr);
      setChainOk(true);
      return true;
    } catch (e) {
      console.error('连接钱包失败:', e);
      alert('连接钱包失败：' + (e.shortMessage || e.message || '未知错误'));
      return false;
    } finally {
      setConnecting(false);
    }
  }, [switchToBSC]);

  // 断开（仅清除本地状态）
  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setChainOk(false);
    providerRef.current = null;
  }, []);

  // 监听账户/链变化
  useEffect(() => {
    if (!window.ethereum?.on) return;

    const onAccountsChanged = async (accounts) => {
      const addr = accounts?.[0] || null;
      if (addr && addr !== account) {
        try {
          const bp = new ethers.BrowserProvider(window.ethereum);
          const s = await bp.getSigner();
          const net = await bp.getNetwork();
          providerRef.current = bp;
          setSigner(s);
          setAccount(addr);
          setChainOk(Number(net.chainId) === CONFIG.chainId);
        } catch {
          disconnect();
        }
      } else if (!addr) {
        disconnect();
      }
    };

    const onChainChanged = async () => {
      if (account) {
        try {
          const bp = new ethers.BrowserProvider(window.ethereum);
          const net = await bp.getNetwork();
          setChainOk(Number(net.chainId) === CONFIG.chainId);
        } catch {
          setChainOk(false);
        }
      }
    };

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', onChainChanged);
    };
  }, [account, disconnect]);

  return {
    account,
    signer,
    chainOk,
    connecting,
    connect,
    disconnect,
    provider: providerRef.current,
  };
}
