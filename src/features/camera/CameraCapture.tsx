import { useCameraAccess } from './useCameraAccess';
import { Camera, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import type { CaptureMode } from '../../types';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  selectedMode: CaptureMode;
  onModeChange: (mode: CaptureMode) => void;
  onUploadImage: (imageDataUrl: string) => void;
}

const CAPTURE_MODES: { value: CaptureMode; label: string }[] = [
  { value: 'fullBody', label: '全身' },
  { value: 'halfBody', label: '半身' },
  { value: 'closeUp', label: '特写' },
  { value: 'sitting', label: '坐姿' },
];

const MODE_GUIDES: Record<CaptureMode, string> = {
  fullBody: '请站直，双脚与肩同宽，面向摄像头',
  halfBody: '请露出上半身，双臂自然下垂',
  closeUp: '请重点拍摄肩颈部位',
  sitting: '请端正坐姿，双手放在膝盖上',
};

export function CameraCapture({
  onCapture,
  selectedMode,
  onModeChange,
  onUploadImage,
}: CameraCaptureProps) {
  const {
    videoRef,
    permissionState,
    error,
    isActive,
    requestCameraAccess,
    captureFrame,
  } = useCameraAccess();

  const handleCapture = () => {
    const frame = captureFrame();
    if (frame) {
      onCapture(frame);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            onUploadImage(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          拍摄模式
        </label>
        <div className="flex flex-wrap gap-2">
          {CAPTURE_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMode === mode.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative">
        {permissionState === 'prompt' && !isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <button
              onClick={requestCameraAccess}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              开启摄像头
            </button>
            <button
              onClick={handleUploadClick}
              className="mt-4 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              上传图片
            </button>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 p-4">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-gray-300 text-center mb-2">摄像头权限被拒绝</p>
            <p className="text-gray-400 text-sm text-center mb-4">
              请在浏览器设置中允许访问摄像头，或使用上传图片功能
            </p>
            <button
              onClick={handleUploadClick}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              上传图片
            </button>
          </div>
        )}

        {permissionState === 'unavailable' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 p-4">
            <AlertCircle className="w-16 h-16 text-yellow-400 mb-4" />
            <p className="text-gray-300 text-center mb-4">未检测到可用摄像头</p>
            <button
              onClick={handleUploadClick}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              上传图片
            </button>
          </div>
        )}

        {error && permissionState !== 'denied' && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${!isActive ? 'hidden' : ''}`}
        />

        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-white text-sm text-center">
              {MODE_GUIDES[selectedMode]}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 justify-center">
        {isActive ? (
          <button
            onClick={handleCapture}
            className="px-8 py-4 bg-blue-500 text-white rounded-xl font-medium text-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Camera className="w-6 h-6" />
            拍照
          </button>
        ) : permissionState !== 'denied' && permissionState !== 'unavailable' ? (
          <button
            onClick={requestCameraAccess}
            className="px-8 py-4 bg-blue-500 text-white rounded-xl font-medium text-lg hover:bg-blue-600 transition-colors"
          >
            开启摄像头
          </button>
        ) : null}
        <button
          onClick={handleUploadClick}
          className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium text-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Upload className="w-6 h-6" />
          上传图片
        </button>
      </div>

      {isActive && (
        <div className="mt-2 flex items-center justify-center gap-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          摄像头已开启
        </div>
      )}
    </div>
  );
}
