import React, { useState } from 'react';
import { useTokenConfig } from '../hooks/useTokenConfig';
import { 
  Box, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Typography,
  Paper,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

const Settings = ({ walletAddress }) => {
  const { 
    configs, 
    activeConfig, 
    addConfig, 
    updateConfig, 
    deleteConfig, 
    setActive,
    isAdmin 
  } = useTokenConfig(walletAddress);

  const [form, setForm] = useState({
    name: '',
    tokenAddress: '',
    vaultAddress: '',
    distributorAddress: '',
    vaultLensAddress: '',
    erc20Abi: '',
    vaultAbi: '',
    burnDistAbi: '',
    vaultLensAbi: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [useDefaultAbi, setUseDefaultAbi] = useState(true);

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          只有管理员钱包可以访问设置页面。
        </Alert>
      </Box>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setUseDefaultAbi(e.target.checked);
  };

  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 准备要保存的配置对象
    const configToSave = { ...form };
    
    // 处理ABI字段
    if (useDefaultAbi) {
      // 使用默认ABI，将ABI字段设为null
      configToSave.erc20Abi = null;
      configToSave.vaultAbi = null;
      configToSave.burnDistAbi = null;
      configToSave.vaultLensAbi = null;
    } else {
      // 尝试解析自定义ABI JSON
      try {
        if (configToSave.erc20Abi.trim()) {
          JSON.parse(configToSave.erc20Abi);
        } else {
          configToSave.erc20Abi = null;
        }
        if (configToSave.vaultAbi.trim()) {
          JSON.parse(configToSave.vaultAbi);
        } else {
          configToSave.vaultAbi = null;
        }
        if (configToSave.burnDistAbi.trim()) {
          JSON.parse(configToSave.burnDistAbi);
        } else {
          configToSave.burnDistAbi = null;
        }
        if (configToSave.vaultLensAbi.trim()) {
          JSON.parse(configToSave.vaultLensAbi);
        } else {
          configToSave.vaultLensAbi = null;
        }
      } catch (error) {
        alert(`ABI JSON格式错误: ${error.message}`);
        return;
      }
    }
    
    if (editingId) {
      updateConfig(editingId, configToSave);
      setEditingId(null);
    } else {
      addConfig(configToSave);
    }
    
    // 重置表单
    setForm({
      name: '',
      tokenAddress: '',
      vaultAddress: '',
      distributorAddress: '',
      vaultLensAddress: '',
      erc20Abi: '',
      vaultAbi: '',
      burnDistAbi: '',
      vaultLensAbi: ''
    });
    setUseDefaultAbi(true);
  };

  const startEdit = (config) => {
    // 将配置中的ABI字段转换为字符串（如果是数组）或空字符串
    const formData = {
      ...config,
      erc20Abi: config.erc20Abi ? (Array.isArray(config.erc20Abi) ? JSON.stringify(config.erc20Abi, null, 2) : config.erc20Abi) : '',
      vaultAbi: config.vaultAbi ? (Array.isArray(config.vaultAbi) ? JSON.stringify(config.vaultAbi, null, 2) : config.vaultAbi) : '',
      burnDistAbi: config.burnDistAbi ? (Array.isArray(config.burnDistAbi) ? JSON.stringify(config.burnDistAbi, null, 2) : config.burnDistAbi) : '',
      vaultLensAbi: config.vaultLensAbi ? (Array.isArray(config.vaultLensAbi) ? JSON.stringify(config.vaultLensAbi, null, 2) : config.vaultLensAbi) : ''
    };
    setForm(formData);
    setEditingId(config.id);
    // 根据是否有自定义ABI决定复选框状态
    setUseDefaultAbi(!(config.erc20Abi || config.vaultAbi || config.burnDistAbi || config.vaultLensAbi));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: '',
      tokenAddress: '',
      vaultAddress: '',
      distributorAddress: '',
      vaultLensAddress: '',
      erc20Abi: '',
      vaultAbi: '',
      burnDistAbi: '',
      vaultLensAbi: ''
    });
      setUseDefaultAbi(true);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        代币配置管理
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        添加或编辑代币配置，发布新代币时可重复使用此 DApp。
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? '编辑配置' : '添加新配置'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="代币名称"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="代币合约地址"
            name="tokenAddress"
            value={form.tokenAddress}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Vault 合约地址"
            name="vaultAddress"
            value={form.vaultAddress}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Distributor 合约地址"
            name="distributorAddress"
            value={form.distributorAddress}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Vault Lens 合约地址"
            name="vaultLensAddress"
            value={form.vaultLensAddress}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          {/* ABI配置 */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useDefaultAbi}
                    onChange={handleCheckboxChange}
                  />
                }
                label="使用默认ABI（推荐）"
              />
              
              {!useDefaultAbi && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <div>
                    <Typography variant="subtitle2" gutterBottom>
                      ERC20 ABI（JSON数组）
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={form.erc20Abi}
                      onChange={(e) => handleFormChange('erc20Abi', e.target.value)}
                      placeholder='例如：[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"},...]'
                      variant="outlined"
                    />
                  </div>
                  <div>
                    <Typography variant="subtitle2" gutterBottom>
                      Vault ABI（JSON数组）
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={form.vaultAbi}
                      onChange={(e) => handleFormChange('vaultAbi', e.target.value)}
                      placeholder='Vault合约ABI'
                      variant="outlined"
                    />
                  </div>
                  <div>
                    <Typography variant="subtitle2" gutterBottom>
                      Burn Distributor ABI（JSON数组）
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={form.burnDistAbi}
                      onChange={(e) => handleFormChange('burnDistAbi', e.target.value)}
                      placeholder='BurnDistributor合约ABI'
                      variant="outlined"
                    />
                  </div>
                  <div>
                    <Typography variant="subtitle2" gutterBottom>
                      Vault Lens ABI（JSON数组）
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={form.vaultLensAbi}
                      onChange={(e) => handleFormChange('vaultLensAbi', e.target.value)}
                      placeholder='VaultLens合约ABI'
                      variant="outlined"
                    />
                  </div>
                </Box>
              )}
            </Paper>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" color="primary">
              {editingId ? '更新' : '添加'}
            </Button>
            {editingId && (
              <Button variant="outlined" onClick={cancelEdit}>
                取消
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          已保存的配置 ({configs.length})
        </Typography>
        {configs.length === 0 ? (
          <Typography color="text.secondary">暂无配置</Typography>
        ) : (
          <List>
            {configs.map((config) => (
              <React.Fragment key={config.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => startEdit(config)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{config.name}</Typography>
                        {activeConfig?.id === config.id && (
                          <CheckIcon color="primary" fontSize="small" />
                        )}
                        {activeConfig?.id === config.id && (
                          <Typography variant="caption" color="primary">
                            (当前使用)
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        <div>代币: {config.tokenAddress?.slice(0, 10)}...</div>
                        <div>Vault: {config.vaultAddress?.slice(0, 10)}...</div>
                      </Box>
                    }
                  />
                  <Button
                    size="small"
                    variant={activeConfig?.id === config.id ? "contained" : "outlined"}
                    onClick={() => setActive(config.id)}
                    disabled={activeConfig?.id === config.id}
                  >
                    {activeConfig?.id === config.id ? '已激活' : '设为当前'}
                  </Button>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default Settings;