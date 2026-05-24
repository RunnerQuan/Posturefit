import { useCameraAccess } from './useCameraAccess';
import { Camera, Upload, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import type { CaptureMode, ViewSelection, PoseView } from '../../types';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string, view: PoseView) => void;
  selectedMode: CaptureMode;
  onModeChange: (mode: CaptureMode) => void;
  onUploadImage: (imageDataUrl: string, view: PoseView) => void;
  viewSelection: ViewSelection;
  onViewSelectionChange: (view: ViewSelection) => void;
  currentCaptureView?: PoseView | null;
  onResetCapture?: () => void;
  showViewSelection?: boolean;
}

const CAPTURE_MODES: { value: CaptureMode; label: string }[] = [
  { value: 'fullBody', label: '全身' },
  { value: 'halfBody', label: '半身' },
  { value: 'closeUp', label: '特写' },
  { value: 'sitting', label: '坐姿' },
];

const VIEW_SELECTIONS: { value: ViewSelection; label: string; desc: string }[] = [
  { value: 'front', label: '正面', desc: '只拍正面' },
  { value: 'side', label: '侧面', desc: '只拍侧面' },
  { value: 'dual', label: '双视角', desc: '正面+侧面' },
];

// 正面拍摄指引
const FRONT_MODE_GUIDES: Record<CaptureMode, string> = {
  fullBody: '请面向摄像头站立，双脚与肩同宽，保持放松',
  halfBody: '请面向摄像头，露出上半身，双臂自然下垂，保持放松',
  closeUp: '请面向摄像头，肩颈部位对准画面，保持放松',
  sitting: '请端正坐姿，面向摄像头，双手放在膝盖上，保持放松',
};

// 侧面拍摄指引
const SIDE_MODE_GUIDES: Record<CaptureMode, string> = {
  fullBody: '请侧身站立，双脚与肩同宽，保持放松',
  halfBody: '请侧身站立，露出上半身，双臂自然下垂，保持放松',
  closeUp: '请侧身站立，肩颈部位对准画面，保持放松',
  sitting: '请侧身端正坐姿，双手放在膝盖上，保持放松',
};

export function resolveCaptureView(
  viewSelection: ViewSelection,
  currentCaptureView?: PoseView | null
): PoseView {
  if (viewSelection !== 'dual') {
    return viewSelection;
  }
  return currentCaptureView === 'front' ? 'side' : 'front';
}

export function CameraCapture({
  onCapture,
  selectedMode,
  onModeChange,
  onUploadImage,
  viewSelection,
  onViewSelectionChange,
  currentCaptureView,
  onResetCapture,
  showViewSelection = true,
}: CameraCaptureProps) {
  const {
    videoRef,
    permissionState,
    error,
    isActive,
    requestCameraAccess,
    captureFrame,
  } = useCameraAccess();

  // 根据当前拍摄状态决定显示哪个视角指引
  const getCurrentViewGuide = (): string => {
    if (viewSelection === 'side') {
      return SIDE_MODE_GUIDES[selectedMode];
    }
    if (viewSelection === 'front') {
      return FRONT_MODE_GUIDES[selectedMode];
    }
    if (currentCaptureView === 'front') {
      return SIDE_MODE_GUIDES[selectedMode].replace('请', '现在请');
    }
    if (currentCaptureView === 'side') {
      return '已拍摄侧面照，请稍候...';
    }
    return FRONT_MODE_GUIDES[selectedMode];
  };

  // 是否显示重拍按钮
  const showResetButton = currentCaptureView === 'front' && viewSelection === 'dual';

  // 是否已完成第一张拍摄（正面）
  const isFirstCaptureDone = currentCaptureView === 'front';

  // 是否已完成所有拍摄
  const isAllCapturesDone = currentCaptureView === 'side';

  const handleCapture = () => {
    const frame = captureFrame();
    if (frame) {
      const nextView = resolveCaptureView(viewSelection, currentCaptureView);
      onCapture(frame, nextView);
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
            const nextView = resolveCaptureView(viewSelection, currentCaptureView);
            onUploadImage(dataUrl, nextView);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full">
      {showViewSelection && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            拍摄视角
          </label>
          <div className="flex flex-wrap gap-2">
            {VIEW_SELECTIONS.map((view) => (
              <button
                key={view.value}
                onClick={() => onViewSelectionChange(view.value)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                  viewSelection === view.value
                    ? 'bg-gradient-to-r from-blush-400 to-mist-400 text-white'
                    : 'bg-white text-gray-600 shadow-card hover:shadow-card-hover hover:bg-gray-50'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          拍摄模式
        </label>
        <div className="flex flex-wrap gap-2">
          {CAPTURE_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                selectedMode === mode.value
                  ? 'bg-gradient-to-r from-blush-400 to-mist-400 text-white'
                  : 'bg-white text-gray-600 shadow-card hover:shadow-card-hover hover:bg-gray-50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 拍摄进度指示器 */}
      {viewSelection === 'dual' && (
        <div className="mb-4 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${isFirstCaptureDone ? 'text-blush-600' : 'text-blush-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isFirstCaptureDone ? 'bg-primary-100 text-primary-600' : 'bg-primary-50 text-primary-500'
            }`}>
              {isFirstCaptureDone ? (
                <CheckCircle className="w-4 h-4" />
              ) : '1'}
            </div>
            <span className="text-sm font-medium">正面照</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
          <div className={`flex items-center gap-2 ${isAllCapturesDone ? 'text-blush-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isAllCapturesDone ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {isAllCapturesDone ? (
                <CheckCircle className="w-4 h-4" />
              ) : '2'}
            </div>
            <span className="text-sm font-medium">侧面照</span>
          </div>
        </div>
      )}

      <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative">
        {permissionState === 'prompt' && !isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <button
              onClick={requestCameraAccess}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium transition-colors cursor-pointer flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              开启摄像头
            </button>
            <button
              onClick={handleUploadClick}
              className="mt-4 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-medium transition-colors cursor-pointer flex items-center gap-2 shadow-card"
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
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium transition-colors cursor-pointer flex items-center gap-2"
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
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium transition-colors cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              上传图片
            </button>
          </div>
        )}

        {error && permissionState !== 'denied' && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-xl text-sm">
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
              {getCurrentViewGuide()}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3 justify-center items-center flex-wrap">
        {isActive ? (
          <button
            onClick={handleCapture}
            className="px-10 py-4 bg-gradient-to-r from-blush-500 to-mist-500 hover:from-blush-600 hover:to-mist-600 text-white rounded-2xl font-semibold text-lg transition-colors cursor-pointer flex items-center gap-2 shadow-bubble"
          >
            <Camera className="w-5 h-5" />
            {viewSelection === 'side' || isFirstCaptureDone ? '拍摄侧面' : '拍照'}
          </button>
        ) : permissionState !== 'denied' && permissionState !== 'unavailable' ? (
          <button
            onClick={requestCameraAccess}
            className="px-10 py-4 bg-gradient-to-r from-blush-500 to-mist-500 hover:from-blush-600 hover:to-mist-600 text-white rounded-2xl font-semibold text-lg transition-colors cursor-pointer flex items-center gap-2 shadow-bubble"
          >
            <Camera className="w-5 h-5" />
            开启摄像头
          </button>
        ) : null}
        <button
          onClick={handleUploadClick}
          className="px-10 py-4 bg-white/70 hover:bg-white backdrop-blur-sm text-blush-600 rounded-2xl font-semibold text-lg transition-colors cursor-pointer flex items-center gap-2 shadow-soft border border-white/40 hover:shadow-bubble"
        >
          <Upload className="w-5 h-5" />
          上传图片
        </button>
        {showResetButton && onResetCapture && (
          <button
            onClick={onResetCapture}
            className="px-8 py-4 bg-orange-50/70 hover:bg-orange-50 backdrop-blur-sm text-orange-600 rounded-2xl font-semibold text-base transition-colors cursor-pointer flex items-center gap-2 border border-orange-100/50"
          >
            <RotateCcw className="w-5 h-5" />
            重拍正面
          </button>
        )}
      </div>

      {isActive && (
        <div className="mt-2 flex items-center justify-center gap-2 text-blush-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          摄像头已开启
        </div>
      )}
    </div>
  );
}
