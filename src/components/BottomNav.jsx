import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = ({ isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: '仪表盘', icon: <DashboardIcon />, path: '/' },
    { id: 'board', label: '排行榜', icon: <LeaderboardIcon />, path: '/board' },
    { id: 'burn', label: '燃烧', icon: <WhatshotIcon />, path: '/burn' },
  ];

  // 如果是管理员，添加设置项
  if (isAdmin) {
    navItems.push({ id: 'settings', label: '设置', icon: <SettingsIcon />, path: '/settings' });
  }

  const currentValue = navItems.find(item => item.path === location.pathname)?.id || 'dashboard';

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
      <BottomNavigation
        value={currentValue}
        onChange={(event, newValue) => {
          const item = navItems.find(item => item.id === newValue);
          if (item) {
            navigate(item.path);
          }
        }}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.id}
            label={item.label}
            icon={item.icon}
            value={item.id}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;