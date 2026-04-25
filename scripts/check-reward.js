import { ethers } from 'ethers';
import { CONFIG } from '../src/config.js';
import { VAULT_LENS_ABI, BURN_DIST_ABI, getBurnDist } from '../src/contracts/index.js';

const addresses = [
  { addr: '0x7329ae0bbb2801efb95670f2794904f872399988', label: '100万筹码' },
  { addr: '0x8e410e810fb3ddc6c65d302dc54d9021dd0e703d', label: '300万筹码' }
];

async function main() {
  console.log('🔍 开始检查销毁权重分红问题...\n');
  
  // 创建 Provider
  const provider = new ethers.JsonRpcProvider('https://bsc-rpc.publicnode.com', CONFIG.chainId, { staticNetwork: true });
  
  // 创建合约实例
  const vaultLens = new ethers.Contract(CONFIG.vaultLens, VAULT_LENS_ABI, provider);
  const burnDist = new ethers.Contract(CONFIG.burnDistributor, BURN_DIST_ABI, provider);
  
  // 查询全局状态
  console.log('📊 全局状态:');
  const totalBurnWeight = await burnDist.totalBurnWeight();
  const accRewardPerWeight = await burnDist.accRewardPerWeight();
  const totalWeightedNotified = await burnDist.totalWeightedRewardNotified();
  const totalWeightedClaimed = await burnDist.totalWeightedRewardClaimed();
  const totalDailyNotified = await burnDist.totalDailyRewardNotified();
  const totalDailyClaimed = await burnDist.totalDailyRewardClaimed();
  
  console.log(`总销毁权重: ${ethers.formatUnits(totalBurnWeight, 18)}`);
  console.log(`累积每权重奖励: ${ethers.formatUnits(accRewardPerWeight, 18)}`);
  console.log(`权重池总奖励(已通知): ${ethers.formatUnits(totalWeightedNotified, 18)} BNB`);
  console.log(`权重池总奖励(已领取): ${ethers.formatUnits(totalWeightedClaimed, 18)} BNB`);
  console.log(`日榜池总奖励(已通知): ${ethers.formatUnits(totalDailyNotified, 18)} BNB`);
  console.log(`日榜池总奖励(已领取): ${ethers.formatUnits(totalDailyClaimed, 18)} BNB`);
  
  // 查询每个地址的详细信息
  console.log('\n👥 用户详情对比:');
  
  for (const { addr, label } of addresses) {
    console.log(`\n--- ${label} (${addr.slice(0, 8)}...) ---`);
    
    try {
      // 使用 vaultLens.burnUserDetail
      const detail = await vaultLens.burnUserDetail(CONFIG.vault, addr);
      const [
        pendingTotal,
        pendingDaily,
        pendingWeighted,
        pendingInvite,
        selfBurned,
        weight,
        todayBurned
      ] = detail;
      
      console.log(`原始销毁量: ${ethers.formatUnits(selfBurned, 18)} slisBNB`);
      console.log(`权重: ${ethers.formatUnits(weight, 18)}`);
      console.log(`权重/销毁比: ${weight > 0n ? (Number(weight) / Number(selfBurned)).toFixed(6) : '0'}`);
      console.log(`待领总额: ${ethers.formatUnits(pendingTotal, 18)} BNB`);
      console.log(`  其中日榜奖励: ${ethers.formatUnits(pendingDaily, 18)} BNB`);
      console.log(`  其中权重奖励: ${ethers.formatUnits(pendingWeighted, 18)} BNB`);
      console.log(`  其中邀请奖励: ${ethers.formatUnits(pendingInvite, 18)} BNB`);
      console.log(`今日销毁: ${ethers.formatUnits(todayBurned, 18)} slisBNB`);
      
      // 计算理论权重奖励
      const theoreticalWeighted = weight * accRewardPerWeight / (10n ** 18n);
      console.log(`理论权重奖励(weight * accRewardPerWeight): ${ethers.formatUnits(theoreticalWeighted, 18)} BNB`);
      
    } catch (err) {
      console.error(`查询失败: ${err.message}`);
    }
  }
  
  // 额外检查：权重计算逻辑
  console.log('\n⚖️ 权重计算分析:');
  console.log('权重 = rawBurned * 时间加权系数？');
  console.log('需要检查合约的 weight 计算逻辑（可能随时间衰减或非线性）');
  
  // 建议
  console.log('\n💡 可能的原因:');
  console.log('1. 权重非线性计算（早期销毁权重更高）');
  console.log('2. 已领取部分权重奖励（pendingWeighted 是剩余未领取的）');
  console.log('3. 奖励类型混淆（领取的可能是日榜奖励，而非权重池奖励）');
  console.log('4. 权重衰减机制（后销毁的权重累积时间短）');
  console.log('5. 全局 accRewardPerWeight 更新时机影响');
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});