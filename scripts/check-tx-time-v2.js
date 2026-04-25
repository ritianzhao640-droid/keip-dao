import { ethers } from 'ethers';
import { CONFIG } from '../src/config.js';

const addresses = [
  { addr: '0x7329ae0bbb2801efb95670f2794904f872399988', label: '100万筹码' },
  { addr: '0x8e410e810fb3ddc6c65d302dc54d9021dd0e703d', label: '300万筹码' }
];

async function main() {
  console.log('🔍 查询销毁交易时间（优化版）...\n');
  
  // 创建 Provider
  const provider = new ethers.JsonRpcProvider('https://bsc-rpc.publicnode.com', CONFIG.chainId, { staticNetwork: true });
  
  // 获取当前区块
  const currentBlock = await provider.getBlockNumber();
  console.log(`当前区块: ${currentBlock}`);
  
  // 查询最近 30000 个区块（约25小时）
  const fromBlock = currentBlock - 30000;
  console.log(`查询范围: ${fromBlock} 到 ${currentBlock} (约25小时)\n`);
  
  for (const { addr, label } of addresses) {
    console.log(`--- ${label} (${addr.slice(0, 8)}...) ---`);
    
    try {
      // 方法1：查询vault合约的所有日志，然后过滤
      const logs = await provider.getLogs({
        fromBlock,
        toBlock: currentBlock,
        address: CONFIG.vault
      });
      
      console.log(`vault合约共有 ${logs.length} 条日志`);
      
      // 过滤出与该地址相关的日志
      const userLogs = logs.filter(log => {
        // 检查topics中是否包含地址
        return log.topics.some(topic => 
          topic.toLowerCase().includes(addr.slice(2).toLowerCase())
        );
      });
      
      if (userLogs.length === 0) {
        console.log('⚠️  未找到该地址与vault的交互日志');
        
        // 方法2：查询该地址发出的交易（可能需要不同的方法）
        // 通过eth_getTransactionByHash? 不直接支持
        console.log('尝试查询地址的交易记录（通过交易哈希）...');
        
        // 获取地址的交易数量，推测最近活动
        const txCount = await provider.getTransactionCount(addr, currentBlock);
        console.log(`地址交易总数: ${txCount}`);
        
        // 尝试获取最近的交易（通过区块查询较复杂）
        console.log('提示：可通过BscScan手动查看交易历史');
        
      } else {
        console.log(`找到 ${userLogs.length} 条相关日志`);
        
        // 按区块排序，获取最早和最晚
        userLogs.sort((a, b) => a.blockNumber - b.blockNumber);
        
        const earliest = userLogs[0];
        const latest = userLogs[userLogs.length - 1];
        
        // 获取区块时间
        const earliestBlock = await provider.getBlock(earliest.blockNumber);
        const latestBlock = await provider.getBlock(latest.blockNumber);
        
        const earliestTime = new Date(earliestBlock.timestamp * 1000);
        const latestTime = new Date(latestBlock.timestamp * 1000);
        
        console.log(`\n最早交互:`);
        console.log(`  区块: ${earliest.blockNumber}`);
        console.log(`  时间(UTC): ${earliestTime.toUTCString()}`);
        console.log(`  本地时间: ${earliestTime.toLocaleString('zh-CN')}`);
        console.log(`  交易哈希: ${earliest.transactionHash}`);
        
        console.log(`\n最新交互:`);
        console.log(`  区块: ${latest.blockNumber}`);
        console.log(`  时间(UTC): ${latestTime.toUTCString()}`);
        console.log(`  本地时间: ${latestTime.toLocaleString('zh-CN')}`);
        console.log(`  交易哈希: ${latest.transactionHash}`);
        
        // 尝试解析日志数据
        console.log(`\n日志详情:`);
        console.log(`  Topics: ${earliest.topics.length}`);
        earliest.topics.forEach((t, i) => console.log(`    [${i}] ${t}`));
        if (earliest.data !== '0x') {
          console.log(`  数据长度: ${earliest.data.length} 字符`);
          // 尝试解码为uint256
          try {
            const value = ethers.getBigInt(earliest.data);
            console.log(`  数值: ${ethers.formatUnits(value, 18)} (假设18位小数)`);
          } catch {
            console.log(`  原始数据: ${earliest.data.slice(0, 100)}...`);
          }
        }
      }
      
    } catch (err) {
      console.error(`查询失败: ${err.message}`);
      console.log('建议：区块范围仍可能太大，尝试更小范围或使用BscScan API');
    }
    
    console.log();
  }
  
  // 提供BscScan链接
  console.log('\n🌐 BscScan 直接查询链接:');
  addresses.forEach(({ addr, label }) => {
    console.log(`${label}: https://bscscan.com/address/${addr}#internaltx`);
    console.log(`  (查看内部交易，过滤合约 ${CONFIG.vault})`);
  });
  
  console.log('\n💡 根据你提供的时间点（20:20 和 22:50）分析:');
  console.log('1. 如果这是今天的UTC时间:');
  console.log('   - 100万销毁在 20:20 UTC');
  console.log('   - 300万销毁在 22:50 UTC');
  console.log('   - 相差 2.5 小时');
  console.log('2. 权重池奖励可能在此期间有新的注入');
  console.log('3. 100万地址多累积了2.5小时的奖励份额');
  console.log('4. 但实际差异（0.009 vs 0.007）可能与时间不成比例');
  console.log('5. 需要确认奖励注入是否发生在20:20-22:50之间');
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});