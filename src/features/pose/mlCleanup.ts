/**
 * TensorFlow 清理工具 - 导出给 tensorflowCleanup.ts 使用
 */

import * as tf from '@tensorflow/tfjs';
import { disposeDetector as disposeDetectorPrimary } from './poseDetector';

// 导出这些函数以供内存清理工具使用
export function cleanupTensorFlow(): void {
  try {
    console.log('[Cleanup] Cleaning up TensorFlow memory...');
    console.log('[Cleanup] Memory before:', {
      numTensors: tf.memory().numTensors,
      numDataBuffers: tf.memory().numDataBuffers,
    });
    
    // 清理所有悬挂的张量
    tf.disposeVariables();
    
    console.log('[Cleanup] Memory after:', {
      numTensors: tf.memory().numTensors,
      numDataBuffers: tf.memory().numDataBuffers,
    });
    console.log('[Cleanup] ✓ TensorFlow memory cleaned');
  } catch (error) {
    console.error('[Cleanup] Error cleaning TensorFlow:', error);
  }
}

/**
 * 完全重置所有 ML 模型和内存
 * 用于严重卡顿或内存溢出情况
 */
export function resetMLPipeline(): void {
  console.log('[Reset] Performing full ML pipeline reset...');
  try {
    disposeDetectorPrimary();
    cleanupTensorFlow();
    console.log('[Reset] ✓ ML pipeline reset complete');
  } catch (error) {
    console.error('[Reset] Error during reset:', error);
  }
}
