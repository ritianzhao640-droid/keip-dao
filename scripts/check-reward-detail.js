import { ethers } from 'ethers';
import { CONFIG } from '../src/config.js';
import { BURN_DIST_ABI, VAULT_LENS_ABI } from '../src/contracts/index.js';

const addresses = [
  { addr: '0x7329ae0bbb2801efb95670f2794904f872399988', label: '100万筹码' },
  { addr: '0x8e410e810fb3ddc6c65d302dc54d9021dd0e703d', label: '300万筹码' }
];

async function main() {
  console.log('🔍 详细检查奖励累积情况...\n');
  
  // 创建 Provider
  const provider = new ethers.JsonRpcProvider('https://bsc-rpc.publicnode.com', CONFIG.chainId, { staticNetwork: true });
  
  // 创建合约实例
  const burnDist = new ethers.Contract(CONFIG.burnDistributor, BURN_DIST_ABI, provider);
  const vaultLens = new ethers.Contract(CONFIG.vaultLens, VAULT_LENS_ABI, provider);
  
  // 查询关键全局变量
  console.log('📊 全局关键变量:');
  const totalBurnWeight = await burnDist.totalBurnWeight();
  const accRewardPerWeight = await burnDist.accRewardPerWeight();
  const totalWeightedNotified = await burnDist.totalWeightedRewardNotified();
  const totalWeightedClaimed = await burnDist.totalWeightedRewardClaimed();
  
  console.log(`总销毁权重: ${ethers.formatUnits(totalBurnWeight, 18)}`);
  console.log(`累积每权重奖励(accRewardPerWeight): ${ethers.formatUnits(accRewardPerWeight, 18)}`);
  console.log(`权重池总奖励(已通知): ${ethers.formatUnits(totalWeightedNotified, 18)} BNB`);
  console.log(`权重池总奖励(已领取): ${ethers.formatUnits(totalWeightedClaimed, 18)} BNB`);
  console.log(`权重池待分配: ${ethers.formatUnits(totalWeightedNotified - totalWeightedClaimed, 18)} BNB`);
  
  // 计算当前每权重应得奖励
  let pendingPerWeight = 0n;
  if (totalBurnWeight > 0n) {
    pendingPerWeight = (totalWeightedNotified - totalWeightedClaimed) * (10n ** 18n) / totalBurnWeight;
    console.log(`当前每权重待分配奖励: ${ethers.formatUnits(pendingPerWeight, 18)} BNB`);
  } else {
    console.log(`当前每权重待分配奖励: 0 (总权重为0)`);
  }
  
  // 查询每个地址的详细信息
  console.log('\n👥 用户当前累积详情:');
  
  for (const { addr, label } of addresses) {
    console.log(`\n--- ${label} (${addr.slice(0, 8)}...) ---`);
    
    try {
      // 使用 burnDist 直接查询
      const pendingWeighted = await burnDist.pendingWeightedBurnReward(addr);
      const pendingDaily = await burnDist.pendingDailyBurnReward(addr);
      const pendingInvite = await burnDist.pendingInviteReward(addr);
      const pendingTotal = await burnDist.pendingBurnReward(addr);
      
      // 获取权重信息
      const burnInfo = await burnDist.burnInfo(addr);
      const [rawBurned, weight, inviter, hasInviter] = burnInfo;
      
      console.log(`原始销毁量: ${ethers.formatUnits(rawBurned, 18)} slisBNB`);
      console.log(`权重: ${ethers.formatUnits(weight, 18)}`);
      console.log(`权重/销毁比: ${weight > 0n ? (Number(weight) / Number(rawBurned)).toFixed(6) : '0'}`);
      console.log(`\n待领奖励详情:`);
      console.log(`  权重池奖励: ${ethers.formatUnits(pendingWeighted, 18)} BNB`);
      console.log(`  日榜奖励: ${ethers.formatUnits(pendingDaily, 18)} BNB`);
      console.log(`  邀请奖励: ${ethers.formatUnits(pendingInvite, 18)} BNB`);
      console.log(`  总计: ${ethers.formatUnits(pendingTotal, 18)} BNB`);
      
      // 计算理论权重奖励
      const theoreticalFromAcc = weight * accRewardPerWeight / (10n ** 18n);
      console.log(`\n理论计算:`);
      console.log(`  weight * accRewardPerWeight: ${ethers.formatUnits(theoreticalFromAcc, 18)} BNB`);
      
      // 如果 pendingWeighted > 0，尝试反推 userRewardDebt
      if (pendingWeighted > 0n) {
        // 假设 pendingWeighted = weight * accRewardPerWeight - userRewardDebt
        // 则 userRewardDebt = weight * accRewardPerWeight - pendingWeighted
        const userRewardDebt = weight * accRewardPerWeight / (10n ** 18n) - pendingWeighted;
        console.log(`  推算 userRewardDebt: ${ethers.formatUnits(userRewardDebt, 18)} BNB`);
        
        // 推算领取时的 accRewardPerWeight
        // userRewardDebt = weight * accRewardPerWeight_at_claim_time
        if (weight > 0n) {
          const accAtClaim = userRewardDebt * (10n ** 18n) / weight;
          console.log(`  推算领取时 accRewardPerWeight: ${ethers.formatUnits(accAtClaim, 18)}`);
          console.log(`  accRewardPerWeight 增长: ${ethers.formatUnits(accRewardPerWeight - accAtClaim, 18)}`);
        }
      }
      
      // 检查权重是否随时间变化（查询历史？）
      console.log(`\n其他信息:`);
      console.log(`  邀请人: ${inviter !== ethers.ZeroAddress ? inviter : '无'}`);
      console.log(`  有邀请人: ${hasInviter}`);
      
    } catch (err) {
      console.error(`查询失败: ${err.message}`);
    }
  }
  
  // 分析可能的原因
  console.log('\n🔍 可能原因分析:');
  console.log('1. 如果 pendingWeighted 均为 0:');
  console.log('   - accRewardPerWeight 自领取后未增长');
  console.log('   - 没有新的权重池奖励注入');
  console.log('2. 如果 pendingWeighted 有值但比例不对:');
  console.log('   - userRewardDebt 设置不一致（领取时间不同？）');
  console.log('   - 权重计算有特殊规则（如时间衰减）');
  console.log('3. 如果 pendingWeighted 为负或异常:');
  console.log('   - 合约计算逻辑有误');
  console.log('   - 数据读取错误');
  
  console.log('\n💡 建议下一步:');
  console.log('1. 检查权重池奖励注入事件（Transfer to BurnDistributor）');
  console.log('2. 查询 accRewardPerWeight 历史变化');
  console.log('3. 验证领取交易是否同时更新了 userRewardDebt');
  console.log('4. 检查合约中 weight 的计算公式（是否包含时间因子）');
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});