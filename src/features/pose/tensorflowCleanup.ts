/**
 * TensorFlow.js 内存清理工具
 * 用于诊断和解决第二次及以后体态分析卡顿问题
 */

import * as tf from '@tensorflow/tfjs';
import { disposeDetector } from './poseDetector';

type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize: number;
  };
};

type PostureFitDiagnostics = {
  memoryInfo: typeof getTensorFlowMemoryInfo;
  logMemory: typeof logTensorFlowMemory;
  emergencyCleanup: typeof emergencyCleanup;
  startMonitoring: typeof startMemoryMonitoring;
};

type WindowWithDiagnostics = Window & {
  __postureFitDiagnostics?: PostureFitDiagnostics;
};

/**
 * 获取 TensorFlow 内存使用情况
 */
export function getTensorFlowMemoryInfo() {
  try {
    const memory = tf.memory();
    return {
      numTensors: memory.numTensors,
      numDataBuffers: memory.numDataBuffers,
      numBytes: memory.numBytes,
      unreliable: memory.unreliable,
    };
  } catch (error) {
    console.error('[MemoryInfo] Error getting memory info:', error);
    return null;
  }
}

/**
 * 记录 TensorFlow 内存状态到 console
 */
export function logTensorFlowMemory(label: string = 'Memory Status') {
  const memory = getTensorFlowMemoryInfo();
  if (memory) {
    console.log(`[${label}]`, {
      tensors: memory.numTensors,
      buffers: memory.numDataBuffers,
      bytes: (memory.numBytes / 1024 / 1024).toFixed(2) + ' MB',
      unreliable: memory.unreliable ? '⚠️ unreliable' : '✓ reliable',
    });
  }
}

/**
 * 监控内存增长（用于诊断泄漏）
 * @returns 清理函数，调用停止监控
 */
export function startMemoryMonitoring(intervalMs: number = 5000) {
  console.log('[MemoryMonitor] Starting memory monitoring every', intervalMs, 'ms');
  let lastMemory = getTensorFlowMemoryInfo();
  
  const intervalId = window.setInterval(() => {
    const currentMemory = getTensorFlowMemoryInfo();
    if (currentMemory && lastMemory) {
      const tensorDiff = currentMemory.numTensors - lastMemory.numTensors;
      const byteDiff = currentMemory.numBytes - lastMemory.numBytes;
      
      const tensorStr = tensorDiff > 0 ? ` (+${tensorDiff})` : tensorDiff < 0 ? ` (${tensorDiff})` : '';
      const byteStr = byteDiff > 0 ? ` (+${(byteDiff / 1024).toFixed(2)} KB)` : '';
      
      console.log('[MemoryMonitor]', {
        tensors: currentMemory.numTensors + tensorStr,
        buffers: currentMemory.numDataBuffers,
        memory: (currentMemory.numBytes / 1024 / 1024).toFixed(2) + ' MB' + byteStr,
      });
    }
    lastMemory = currentMemory;
  }, intervalMs);
  
  return () => {
    console.log('[MemoryMonitor] Stopping memory monitoring');
    window.clearInterval(intervalId);
  };
}

/**
 * 紧急内存清理
 * 当检测到内存泄漏或卡顿时使用
 */
export function emergencyCleanup() {
  console.warn('[EmergencyCleanup] Triggering emergency cleanup!');
  logTensorFlowMemory('Before Cleanup');
  
  try {
    // 1. 重置 detector
    disposeDetector();
    
    // 2. 清理 TensorFlow 张量
    try {
      console.log('[EmergencyCleanup] Disposing TensorFlow variables...');
      tf.disposeVariables();
      console.log('[EmergencyCleanup] ✓ Variables disposed');
    } catch (error) {
      console.warn('[EmergencyCleanup] Could not dispose variables:', error);
    }
    
    // 3. 强制垃圾回收（如果可用）
    const performanceWithMemory = performance as PerformanceWithMemory;
    if (performanceWithMemory.memory) {
      const before = performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024;
      // 触发内存释放（仅在支持的环境）
      setTimeout(() => {
        const after = (performanceWithMemory.memory?.usedJSHeapSize ?? 0) / 1024 / 1024;
        console.log('[EmergencyCleanup] Heap: ' + before.toFixed(2) + ' MB -> ' + after.toFixed(2) + ' MB');
      }, 100);
    }
    
    logTensorFlowMemory('After Cleanup');
    console.log('[EmergencyCleanup] ✓ Emergency cleanup complete');
  } catch (error) {
    console.error('[EmergencyCleanup] Error during cleanup:', error);
  }
}

/**
 * 创建一个内存监视器组件
 * 返回在 console 中输出诊断命令的说明
 */
export function setupDiagnosticConsole() {
  // 在 window 上挂载诊断工具，方便在 console 中调用
  (window as WindowWithDiagnostics).__postureFitDiagnostics = {
    memoryInfo: getTensorFlowMemoryInfo,
    logMemory: logTensorFlowMemory,
    emergencyCleanup: emergencyCleanup,
    startMonitoring: startMemoryMonitoring,
  };
  
  console.log('%c🔧 PostureFit 诊断工具已加载', 'color: blue; font-weight: bold; font-size: 14px');
  console.log('%c在 console 中输入以下命令进行诊断:', 'color: blue');
  console.log('%c__postureFitDiagnostics.logMemory() - 显示内存状态', 'color: green');
  console.log('%c__postureFitDiagnostics.startMonitoring() - 开始监控内存增长', 'color: green');
  console.log('%c__postureFitDiagnostics.emergencyCleanup() - 紧急清理', 'color: red');
}
