import type { PostureSessionStep } from '../types';

const STEPS: { key: PostureSessionStep; label: string }[] = [
  { key: 'capture', label: '拍照' },
  { key: 'analysis', label: '分析' },
  { key: 'profile', label: '教练' },
  { key: 'chat', label: '陪练' },
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
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 cursor-default
                ${isEnabled ? 'cursor-pointer hover:bg-primary-50' : 'cursor-not-allowed opacity-50'}
                ${isActive ? 'text-primary-600' : isCompleted ? 'text-primary-500' : 'text-gray-400'}
              `}
            >
              <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {step.label}
              </span>
              {isActive && (
                <span className="h-0.5 w-full bg-primary-500 rounded-full" />
              )}
            </button>

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
