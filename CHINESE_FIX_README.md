# 中文乱码修复说明

## 问题描述
在 Windows 中文系统上使用 systeminformation 库时，输出的中文字符会显示为乱码。这是因为 Windows 命令行默认使用 GBK (代码页 936) 编码，而 Node.js 期望 UTF-8 编码。

## 修复方案
对以下文件进行了修改：

### 1. lib/util.js
#### a) 更新 `getCodepage()` 函数
修改了获取代码页的逻辑，确保能正确识别 Windows 系统的当前代码页。

#### b) 更新 `execWin()` 函数
修改了 Windows 命令执行函数，在执行命令前临时切换到 UTF-8 代码页 (65001)，执行完毕后切回原代码页：
```javascript
chcp 65001 >nul & [命令] & chcp [原代码页] >nul
```

#### c) 新增 `execSyncWin()` 函数
添加了同步版本的 Windows 命令执行函数，用于处理需要同步执行的场景：
```javascript
function execSyncWin(cmd, opts) {
  if (!opts) {
    opts = execOptsWin;
  }
  const currentCodepage = getCodepage();
  let newCmd = 'chcp 65001 >nul & ' + cmd + ' & chcp ' + currentCodepage + ' >nul';
  return execSync(newCmd, opts);
}
```

#### d) 修复 PowerShell 编码
在 `powerShell()` 函数的非持久化模式中，添加了 UTF-8 编码设置：
```javascript
const child = spawn(_powerShell, [..., '-Command', _psToUTF8 + cmd], {...});
```
这确保 PowerShell 输出使用 UTF-8 编码。

#### e) 更新相关函数
- `getWmic()`: 使用 `execSyncWin()` 代替直接调用 `execSync()`
- `smartMonToolsInstalled()`: 使用 `execSyncWin()` 代替直接调用 `execSync()`

### 2. lib/network.js
替换所有 Windows 平台下的命令执行调用：
- `execSync(..., util.execOptsWin)` → `util.execSyncWin(...)`
- `exec(..., util.execOptsWin, callback)` → `util.execWin(..., callback)`

修改的函数包括：
- `getDefaultNetworkInterface()`
- `getWindowsWiredProfilesInformation()`
- `getWindowsWirelessIfaceSSID()`
- `getWindowsDNSsuffixes()`
- `getWindowsIEEE8021x()`
- `networkConnections()`
- `networkGatewayDefault()`

### 3. lib/osinfo.js
替换所有 Windows 平台下的命令执行调用：
- `execSync(..., util.execOptsWin)` → `util.execSyncWin(...)`
- `exec(..., util.execOptsWin, callback)` → `util.execWin(..., callback)`

修改的函数包括：
- `getFQDN()`
- `isUefiWindows()`
- `uuid()`

### 4. lib/cpu.js
替换 Windows 平台下的命令执行调用：
- `exec(..., util.execOptsWin, callback)` → `util.execWin(..., callback)`

修改的函数：
- `cpuFlags()`

## 测试方法
运行测试脚本验证修复效果：
```bash
node test-chinese-fix.js
```

如果能正确显示中文字符（而不是乱码），说明修复成功。

## 测试结果
修复后的输出示例：
```
distro: 'Microsoft Windows 11 专业版'  // 之前显示为乱码
iface: '以太网'                        // 之前显示为乱码
iface: '本地连接'                      // 之前显示为乱码
```

## 技术原理
- **问题根源**: Windows 中文系统默认使用 GBK (cp936) 编码，但 Node.js 的 child_process 模块默认期望 UTF-8 编码
- **解决方案**:
  1. 对于 cmd 命令：使用 `chcp 65001` 临时切换到 UTF-8 代码页执行命令
  2. 对于 PowerShell 命令：使用 `$OutputEncoding = [System.Text.Encoding]::UTF8` 设置输出编码
- **兼容性**: 修复后会自动切回原代码页，不影响系统其他程序的编码设置

## 影响范围
此修复主要影响 Windows 平台上的以下功能：
- 系统信息获取（操作系统名称、版本等）
- CPU 信息获取（标志位信息）
- 内存信息获取
- 磁盘信息获取
- 网络接口信息获取（接口名称、DNS后缀等）
- 其他所有通过 Windows 命令行获取的系统信息

Linux 和 macOS 平台不受影响，因为它们默认使用 UTF-8 编码。

## 注意事项
1. 此修复仅针对 Windows 平台
2. 需要 Windows Vista 或更高版本（支持 UTF-8 代码页 65001）
3. 不需要安装额外的依赖包
4. 对性能的影响微乎其微（仅增加了代码页切换的开销）
5. PowerShell 终端显示可能仍有乱码，但这是终端编码问题，实际返回的数据是正确的 UTF-8 编码

## 修改文件列表
- `lib/util.js` - 核心修复，添加编码处理函数
- `lib/network.js` - 网络相关命令执行修复
- `lib/osinfo.js` - 操作系统信息命令执行修复
- `lib/cpu.js` - CPU 信息命令执行修复
- `test-chinese-fix.js` - 测试脚本（新增）
- `CHINESE_FIX_README.md` - 修复说明文档（本文件）
