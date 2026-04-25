import { ethers } from 'ethers';
import { CONFIG } from '../src/config.js';

const addresses = [
  { addr: '0x7329ae0bbb2801efb95670f2794904f872399988', label: '100万筹码' },
  { addr: '0x8e410e810fb3ddc6c65d302dc54d9021dd0e703d', label: '300万筹码' }
];

// Burn 事件可能签名
const BURN_EVENT_TOPIC = ethers.id('Burn(address,uint256,address)');

async function main() {
  console.log('🔍 查询销毁交易时间...\n');
  
  // 创建 Provider
  const provider = new ethers.JsonRpcProvider('https://bsc-rpc.publicnode.com', CONFIG.chainId, { staticNetwork: true });
  
  // 获取当前区块
  const currentBlock = await provider.getBlockNumber();
  console.log(`当前区块: ${currentBlock}`);
  
  // 从最近 100,000 个区块开始查询（约3天）
  const fromBlock = currentBlock - 100000;
  console.log(`查询范围: ${fromBlock} 到 ${currentBlock} (约3天)\n`);
  
  for (const { addr, label } of addresses) {
    console.log(`--- ${label} (${addr.slice(0, 8)}...) ---`);
    
    try {
      // 查询该地址发出的交易（与vault交互）
      const logs = await provider.getLogs({
        fromBlock,
        toBlock: currentBlock,
        address: CONFIG.vault,  // 只查询vault合约的日志
        topics: [
          BURN_EVENT_TOPIC,
          ethers.zeroPadValue(addr, 32)  // 第一个主题可能是用户地址
        ]
      });
      
      if (logs.length === 0) {
        console.log('未找到Burn事件，尝试其他查询方式...');
        
        // 尝试查询该地址与vault的普通交易
        const filter = {
          fromBlock,
          toBlock: currentBlock,
          address: CONFIG.vault
        };
        
        const allLogs = await provider.getLogs(filter);
        const userLogs = allLogs.filter(log => 
          log.topics.some(topic => 
            topic.toLowerCase().includes(addr.slice(2).toLowerCase())
          )
        );
        
        if (userLogs.length === 0) {
          console.log('⚠️  未找到任何相关交易日志');
          continue;
        }
        
        console.log(`找到 ${userLogs.length} 条相关日志`);
        
        // 获取最新一条日志的区块时间
        const latestLog = userLogs[userLogs.length - 1];
        const block = await provider.getBlock(latestLog.blockNumber);
        const timestamp = new Date(block.timestamp * 1000);
        console.log(`最新交互区块: ${latestLog.blockNumber}`);
        console.log(`时间: ${timestamp.toUTCString()}`);
        console.log(`本地时间: ${timestamp.toLocaleString('zh-CN')}`);
        console.log(`交易哈希: ${latestLog.transactionHash}`);
        
        // 尝试解析日志数据（如果有数据）
        if (latestLog.data !== '0x') {
          console.log(`日志数据: ${latestLog.data}`);
        }
        
      } else {
        console.log(`找到 ${logs.length} 条Burn事件`);
        
        // 获取最新一条Burn事件
        const latestBurn = logs[logs.length - 1];
        const block = await provider.getBlock(latestBurn.blockNumber);
        const timestamp = new Date(block.timestamp * 1000);
        
        console.log(`最新Burn区块: ${latestBurn.blockNumber}`);
        console.log(`时间: ${timestamp.toUTCString()}`);
        console.log(`本地时间: ${timestamp.toLocaleString('zh-CN')}`);
        console.log(`交易哈希: ${latestBurn.transactionHash}`);
        
        // 解析日志数据
        try {
          const iface = new ethers.Interface(['event Burn(address indexed user, uint256 amount, address indexed inviter)']);
          const parsed = iface.parseLog(latestBurn);
          console.log(`销毁数量: ${ethers.formatUnits(parsed.args.amount, 18)} slisBNB`);
          console.log(`邀请人: ${parsed.args.inviter}`);
        } catch (e) {
          console.log('无法解析事件数据，原始数据:', latestBurn.data);
        }
      }
      
    } catch (err) {
      console.error(`查询失败: ${err.message}`);
    }
    
    console.log();
  }
  
  // 额外建议
  console.log('\n💡 手动检查建议:');
  console.log('1. 访问 BscScan: https://bscscan.com/');
  console.log(`2. 搜索地址: ${addresses[0].addr}`);
  console.log(`3. 查看 "Internal Txns" 或 "ERC20 Token Txns"`);
  console.log('4. 查找与合约 ' + CONFIG.vault + ' 的交互');
  console.log('5. 点击交易查看时间戳');
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});