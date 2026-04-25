import React from 'react';
import { Typography, Paper, Box, Button, TextField } from '@mui/material';

const Burn = ({ config }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        燃烧
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" gutterBottom>
          当前代币: {config?.name || '无'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          代币地址: {config?.tokenAddress || '未设置'}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="燃烧数量"
            type="number"
            margin="normal"
          />
          <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            燃烧代币
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Burn;