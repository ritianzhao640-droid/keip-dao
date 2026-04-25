import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Dashboard = ({ config }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        仪表盘
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          当前使用的代币配置: {config?.name || '无'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          代币地址: {config?.tokenAddress || '未设置'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vault地址: {config?.vaultAddress || '未设置'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;