import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Board = ({ config }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        排行榜
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          当前代币: {config?.name || '无'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          排行榜数据将根据当前代币配置显示
        </Typography>
      </Paper>
    </Box>
  );
};

export default Board;