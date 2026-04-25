import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTokenConfig } from './hooks/useTokenConfig';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Burn from './pages/Burn';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { Box } from '@mui/material';

// 模拟钱包连接
const useWallet = () => {
  const [account, setAccount] = useState(null);
  
  const connect = () => {
    // 模拟连接钱包
    const mockAccount = '0x1234567890123456789012345678901234567890'; // 管理员钱包
    // const mockAccount = '0x1111111111111111111111111111111111111111'; // 非管理员钱包
    setAccount(mockAccount);
  };

  const disconnect = () => {
    setAccount(null);
  };

  return { account, connect, disconnect };
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  const wallet = useWallet();
  const { activeConfig, isAdmin } = useTokenConfig(wallet.account);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ pb: 7 }}> {/* 为底部导航留出空间 */}
          <Routes>
            <Route path="/" element={<Dashboard config={activeConfig} />} />
            <Route path="/board" element={<Board config={activeConfig} />} />
            <Route path="/burn" element={<Burn config={activeConfig} />} />
            <Route path="/settings" element={<Settings walletAddress={wallet.account} />} />
          </Routes>
        </Box>
        <BottomNav isAdmin={isAdmin} />
      </Router>
    </ThemeProvider>
  );
}

export default App;