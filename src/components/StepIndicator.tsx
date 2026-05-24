import type { PostureSessionStep } from '../types';

const STEPS: { key: PostureSessionStep; label: string; icon: string }[] = [
  { key: 'capture', label: '拍照', icon: 'M3 9a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM14.5 2l5 5M9 12l2 2 4-4' },
  { key: 'analysis', label: '分析', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { key: 'profile', label: '教练', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'chat', label: '陪练', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

const STEP_ORDER: PostureSessionStep[] = ['capture', 'analysis', 'profile', 'chat'];

interface StepIndicatorProps {
  currentStep: PostureSessionStep;
  canEnterStep?: (step: PostureSessionStep) => boolean;
  onStepSelect?: (step: PostureSessionStep) => void;
}

export function StepIndicator({ currentStep, canEnterStep, onStepSelect }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isEnabled = canEnterStep ? canEnterStep(step.key) : true;

        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              disabled={!isEnabled}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => onStepSelect?.(step.key)}
              className={`
                group relative flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-300
                ${isEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                ${isActive
                  ? 'text-blush-600'
                  : isCompleted
                    ? 'text-mist-500 hover:text-mist-600'
                    : 'text-gray-400 hover:text-gray-500'
                }
              `}
            >
              {/* 步骤图标容器 */}
              <div className={`
                relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-br from-blush-400 to-mist-400 shadow-bubble scale-110'
                  : isCompleted
                    ? 'bg-gradient-to-br from-blush-100 to-mist-100'
                    : 'bg-gray-100 group-hover:bg-blush-50'
                }
              `}>
                {/* 渐变背景层 */}
                {(isActive || isCompleted) && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blush-400/10 to-mist-400/10 animate-pulse" />
                )}

                {/* 图标 */}
                <svg
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : isCompleted
                        ? 'text-blush-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={isActive ? 2.5 : 2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                </svg>

                {/* 完成勾选标记 */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 标签 */}
              <span className={`text-xs font-medium transition-all duration-300 ${
                isActive ? 'font-semibold scale-105' : ''
              }`}>
                {step.label}
              </span>

              {/* 活跃指示线 */}
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-blush-400 to-mist-400 animate-pulse" />
              )}

              {/* 悬停光效 */}
              {isEnabled && !isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blush-400/0 to-mist-400/0 group-hover:from-blush-400/5 group-hover:to-mist-400/5 transition-all duration-300 -z-10" />
              )}
            </button>

            {/* 连接线 */}
            {index < STEPS.length - 1 && (
              <div className="flex items-center px-1">
                <div className={`
                  w-8 h-0.5 rounded-full transition-all duration-500
                  ${index < currentIndex
                    ? 'bg-gradient-to-r from-blush-300 to-mist-300'
                    : 'bg-gray-200'
                  }
                `}>
                  {index < currentIndex && (
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-blush-400 to-mist-400 animate-pulse opacity-50" />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
