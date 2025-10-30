// 简单的使用示例 - 展示中文修复效果
const si = require('./lib/index');

console.log('=== Systeminformation 中文支持示例 ===\n');

async function showSystemInfo() {
  try {
    // 1. 操作系统信息
    const osInfo = await si.osInfo();
    console.log('操作系统:', osInfo.distro);
    console.log('版本:', osInfo.release);
    console.log('代码页:', osInfo.codepage);
    console.log('');

    // 2. CPU 信息
    const cpu = await si.cpu();
    console.log('CPU 品牌:', cpu.brand);
    console.log('CPU 制造商:', cpu.manufacturer);
    console.log('物理核心数:', cpu.physicalCores);
    console.log('逻辑核心数:', cpu.cores);
    console.log('');

    // 3. 网络接口（只显示活动的）
    const networkInterfaces = await si.networkInterfaces();
    console.log('网络接口:');
    networkInterfaces.filter(iface => iface.operstate === 'up').forEach(iface => {
      console.log(`  - ${iface.iface} (${iface.ifaceName})`);
      console.log(`    IP4: ${iface.ip4}`);
      console.log(`    MAC: ${iface.mac}`);
      console.log(`    速度: ${iface.speed} Mbps`);
      console.log('');
    });

    console.log('✓ 所有中文字符都应该正确显示！');

  } catch (error) {
    console.error('错误:', error.message);
  }
}

showSystemInfo();
