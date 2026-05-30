import { useCameraAccess } from './useCameraAccess';
import { Camera, Upload, AlertCircle, CheckCircle, RotateCcw, ScanLine } from 'lucide-react';
import type { CaptureMode, ViewSelection, PoseView } from '../../types';
import aiCoachScanImage from '../../../assets/ai_coach_scan.png';

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
  { value: 'sitting', label: '坐姿' },
];

interface CaptureModeGuide {
  headline: string;
  recommendation: string;
  views: Record<PoseView, CaptureViewGuide>;
  detects: string;
}

interface CaptureViewGuide {
  title: string;
  keypoints: string;
  tips: string[];
}

export const CAPTURE_MODE_GUIDES: Record<CaptureMode, CaptureModeGuide> = {
  fullBody: {
    headline: '适合完整体态和下肢问题',
    recommendation: '推荐双视角：正面 + 侧面',
    views: {
      front: {
        title: '正面全身照',
        keypoints: '正面：头部、双肩、双髋、双膝、双踝',
        tips: ['全身入镜，脚踝和脚尖不要被裁掉', '面向镜头自然站直，双脚与肩同宽', '衣服尽量贴身，避免遮挡膝盖和脚踝'],
      },
      side: {
        title: '侧面全身照',
        keypoints: '侧面：同侧耳朵、肩、髋、膝、踝',
        tips: ['侧身站立，让同侧耳朵、肩、髋、膝、踝形成清晰轮廓', '膝超伸需要膝盖和脚踝清楚可见', '不要扭腰看镜头，保持自然站姿'],
      },
    },
    detects: '高低肩、骨盆侧倾、膝内扣、头前伸、圆肩倾向、驼背风险、膝超伸',
  },
  halfBody: {
    headline: '适合上半身体态和肩颈问题',
    recommendation: '推荐正面或侧面',
    views: {
      front: {
        title: '正面半身照',
        keypoints: '正面：头部、双肩、双髋',
        tips: ['画面至少包含头、肩、髋', '双臂自然下垂，不要挡住腰髋', '镜头保持水平，避免身体明显旋转'],
      },
      side: {
        title: '侧面半身照',
        keypoints: '侧面：同侧耳朵、肩、髋',
        tips: ['侧身站立或坐直，让耳朵、肩和髋在同一侧清晰可见', '不要含胸低头或刻意挺胸', '手臂自然放松，避免遮挡肩髋线'],
      },
    },
    detects: '高低肩、骨盆侧倾、头前伸、圆肩倾向、驼背风险；不用于膝内扣或膝超伸',
  },
  closeUp: {
    headline: '适合肩颈和上半身近距离观察',
    recommendation: '推荐正面或侧面',
    views: {
      front: {
        title: '正面肩颈近景',
        keypoints: '正面：头部、双肩、双髋',
        tips: ['画面包含头、双肩和双髋，避免只裁到肩颈', '双肩保持放松，不要耸肩', '避免转头或歪头看镜头'],
      },
      side: {
        title: '侧面肩颈特写',
        keypoints: '侧面：同侧耳朵、肩',
        tips: ['露出耳朵和肩峰位置', '侧面轮廓尽量完整，避免头发遮挡耳朵', '保持自然站姿或坐姿，不要刻意前伸头部'],
      },
    },
    detects: '高低肩、头部偏移、头前伸；不检测膝相关问题',
  },
  sitting: {
    headline: '适合久坐姿态和坐姿稳定性',
    recommendation: '推荐正面或侧面',
    views: {
      front: {
        title: '正面坐姿照',
        keypoints: '正面：头部、双肩、双髋、双膝',
        tips: ['坐直，双脚自然落地', '椅背和桌面不要遮挡髋部和膝盖', '镜头保持在身体正前方'],
      },
      side: {
        title: '侧面坐姿照',
        keypoints: '侧面：同侧耳朵、肩、髋、膝',
        tips: ['侧面照让耳朵、肩、髋、膝形成清晰轮廓', '保持日常自然坐姿，不要临时刻意挺直', '桌面和扶手不要遮住腰髋位置'],
      },
    },
    detects: '高低肩、骨盆侧倾、头前伸、圆肩倾向、驼背风险',
  },
};

const VIEW_SELECTIONS: { value: ViewSelection; label: string; desc: string }[] = [
  { value: 'front', label: '正面', desc: '只拍正面' },
  { value: 'side', label: '侧面', desc: '只拍侧面' },
  { value: 'dual', label: '双视角', desc: '正面+侧面' },
];

// 正面拍摄指引
const FRONT_MODE_GUIDES: Record<CaptureMode, string> = {
  fullBody: '请面向摄像头站立，双脚与肩同宽，保持放松',
  halfBody: '请面向摄像头，露出上半身，双臂自然下垂，保持放松',
  closeUp: '请面向摄像头，画面包含头、双肩和双髋，保持放松',
  sitting: '请端正坐姿，面向摄像头，双手放在膝盖上，保持放松',
};

// 侧面拍摄指引
const SIDE_MODE_GUIDES: Record<CaptureMode, string> = {
  fullBody: '请侧身站立，双脚与肩同宽，保持放松',
  halfBody: '请侧身站立，露出同侧耳朵、肩和髋，双臂自然下垂，保持放松',
  closeUp: '请侧身站立，肩颈部位对准画面，保持放松',
  sitting: '请侧身端正坐姿，双手放在膝盖上，保持放松',
};

function getGuideView(viewSelection: ViewSelection, currentCaptureView?: PoseView | null): PoseView {
  if (viewSelection === 'front' || viewSelection === 'side') {
    return viewSelection;
  }
  return currentCaptureView === 'front' ? 'side' : 'front';
}

function getGuideStageLabel(viewSelection: ViewSelection, currentCaptureView?: PoseView | null): string {
  if (viewSelection === 'front') {
    return '当前：正面照';
  }
  if (viewSelection === 'side') {
    return '当前：侧面照';
  }
  return currentCaptureView === 'front' ? '下一张：侧面照' : '当前：正面照';
}

function getViewGuideLabel(view: PoseView): string {
  return view === 'front' ? '正面照' : '侧面照';
}

function CaptureModeGuidePanel({
  mode,
  viewSelection,
  currentCaptureView,
}: {
  mode: CaptureMode;
  viewSelection: ViewSelection;
  currentCaptureView?: PoseView | null;
}) {
  const guide = CAPTURE_MODE_GUIDES[mode];
  const guideView = getGuideView(viewSelection, currentCaptureView);
  const viewGuide = guide.views[guideView];
  const stageLabel = getGuideStageLabel(viewSelection, currentCaptureView);
  const displayedViews: PoseView[] = viewSelection === 'dual' ? ['front', 'side'] : [guideView];

  return (
    <section
      data-testid="capture-mode-guide"
      className="mt-4 rounded-2xl border border-white/60 bg-white/78 p-4 shadow-soft backdrop-blur-md"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blush-600">
            <ScanLine className="h-4 w-4" />
            拍摄模式指引
          </div>
          <h3 className="text-base font-semibold text-gray-800">
            {viewSelection === 'dual' ? '双视角拍摄要求' : viewGuide.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-mist-600">
            {stageLabel} · {guide.headline} · {guide.recommendation}
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600">可识别：{guide.detects}</p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:w-[56%]">
          {displayedViews.map(view => {
            const item = guide.views[view];
            const isActiveGuide = view === guideView;
            return (
              <div
                key={view}
                className={`rounded-2xl border p-3 ${
                  isActiveGuide
                    ? 'border-blush-200 bg-blush-50/85'
                    : 'border-white/70 bg-white/70'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    {getViewGuideLabel(view)}
                  </p>
                  {viewSelection === 'dual' && isActiveGuide && (
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-blush-600">
                      当前
                    </span>
                  )}
                </div>
                <p className="rounded-xl bg-white/75 px-3 py-2 text-sm leading-5 text-gray-700">
                  {item.keypoints}
                </p>
                <ul className="mt-2 space-y-2">
                  {item.tips.map(tip => (
                    <li key={tip} className="rounded-xl bg-sky-50/80 px-3 py-2 text-sm leading-5 text-gray-700">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CaptureViewProgress({
  viewSelection,
  isFirstCaptureDone,
  isAllCapturesDone,
}: {
  viewSelection: ViewSelection;
  isFirstCaptureDone: boolean;
  isAllCapturesDone: boolean;
}) {
  if (viewSelection !== 'dual') {
    return (
      <div data-testid="capture-view-progress" className="mb-4 flex min-h-8 items-center justify-center">
        <div className="flex items-center gap-2 text-blush-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-medium text-primary-500">
            1
          </div>
          <span className="text-sm font-medium">{viewSelection === 'front' ? '正面照' : '侧面照'}</span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="capture-view-progress" className="mb-4 flex min-h-8 items-center justify-center gap-4">
      <div className={`flex items-center gap-2 ${isFirstCaptureDone ? 'text-blush-600' : 'text-blush-500'}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          isFirstCaptureDone ? 'bg-primary-100 text-primary-600' : 'bg-primary-50 text-primary-500'
        }`}>
          {isFirstCaptureDone ? (
            <CheckCircle className="h-4 w-4" />
          ) : '1'}
        </div>
        <span className="text-sm font-medium">正面照</span>
      </div>
      <div className="h-0.5 w-8 rounded-full bg-gray-200" />
      <div className={`flex items-center gap-2 ${isAllCapturesDone ? 'text-blush-600' : 'text-gray-400'}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          isAllCapturesDone ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
        }`}>
          {isAllCapturesDone ? (
            <CheckCircle className="h-4 w-4" />
          ) : '2'}
        </div>
        <span className="text-sm font-medium">侧面照</span>
      </div>
    </div>
  );
}

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
    <div className="relative -mt-2 flex h-full flex-col">
      <img
        src={aiCoachScanImage}
        alt="AI 扫描教练"
        className="pointer-events-none absolute right-14 -top-14 hidden max-h-56 w-auto object-contain md:block lg:right-20 lg:-top-16 lg:max-h-72"
      />

      {showViewSelection && (
        <div className="mb-3 md:pr-72 lg:pr-96">
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

      <div className="mb-3 md:pr-72 lg:pr-96">
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

      <CaptureViewProgress
        viewSelection={viewSelection}
        isFirstCaptureDone={isFirstCaptureDone}
        isAllCapturesDone={isAllCapturesDone}
      />

      <CaptureModeGuidePanel
        mode={selectedMode}
        viewSelection={viewSelection}
        currentCaptureView={currentCaptureView}
      />

      <div data-testid="capture-preview" className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative">
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
