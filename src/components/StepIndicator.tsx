import type { PostureSessionStep } from '../types';

const STEPS: { key: PostureSessionStep; label: string }[] = [
  { key: 'capture', label: '拍照' },
  { key: 'analysis', label: '分析' },
  { key: 'profile', label: '教练' },
  { key: 'plan', label: '计划' },
  { key: 'chat', label: '打卡' },
];

const STEP_ORDER: PostureSessionStep[] = ['capture', 'analysis', 'profile', 'plan', 'chat'];

interface StepIndicatorProps {
  currentStep: PostureSessionStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step label */}
            <button
              disabled
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 cursor-default
                ${isActive ? 'text-primary-600' : isCompleted ? 'text-primary-500' : 'text-gray-400'}
              `}
            >
              <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {step.label}
              </span>
              {/* Active underline indicator */}
              {isActive && (
                <span className="h-0.5 w-full bg-primary-500 rounded-full" />
              )}
            </button>

            {/* Connector arrow */}
            {index < STEPS.length - 1 && (
              <div className="flex items-center px-1">
                <svg
                  className={`w-4 h-4 ${index < currentIndex ? 'text-primary-400' : 'text-gray-300'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
