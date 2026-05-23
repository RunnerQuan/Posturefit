import { useEffect, useState } from 'react';
import { Scan, Activity, FileText } from 'lucide-react';

const STAGES = [
  { id: 1, label: '检测骨骼结构', icon: Scan },
  { id: 2, label: '分析关节角度', icon: Activity },
  { id: 3, label: '生成体态报告', icon: FileText },
];

interface AnalysisLoaderProps {
  message?: string;
}

export function AnalysisLoader({ message }: AnalysisLoaderProps) {
  const [activeStage, setActiveStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stageDuration = 1800;
    let stage = 0;
    let progressTimer: ReturnType<typeof setInterval>;

    const runStage = () => {
      setActiveStage(stage);
      setProgress(0);

      progressTimer = setInterval(() => {
        setProgress(prev => {
          const increment = 100 / (stageDuration / 40);
          if (prev + increment >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + increment;
        });
      }, 40);

      const nextStageTimeout = setTimeout(() => {
        clearInterval(progressTimer);
        stage++;
        if (stage < STAGES.length) {
          runStage();
        }
      }, stageDuration);

      return () => clearTimeout(nextStageTimeout);
    };

    runStage();

    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Stage indicators */}
        <div className="flex justify-between items-center relative">
          {/* Background track */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100" />
          {/* Progress track */}
          <div
            className="absolute top-4 left-0 h-0.5 bg-primary-400 transition-all duration-300"
            style={{ width: `${(activeStage / (STAGES.length - 1)) * 100}%` }}
          />

          {STAGES.map((stage, index) => {
            const isDone = index < activeStage;
            const isActive = index === activeStage;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                    ${isDone || isActive ? 'bg-primary-500 text-white shadow-card' : 'bg-gray-100 text-gray-400'}
                    ${isActive ? 'ring-4 ring-primary-100' : ''}
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage labels */}
        <div className="flex justify-between">
          {STAGES.map((stage, index) => {
            const isDone = index < activeStage;
            const isActive = index === activeStage;

            return (
              <span
                key={stage.id}
                className={`
                  text-xs font-medium transition-all duration-300
                  ${isDone ? 'text-primary-600' : isActive ? 'text-gray-700 animate-pulse-glow' : 'text-gray-400'}
                `}
              >
                {stage.label}
              </span>
            );
          })}
        </div>

        {/* Active stage progress bar */}
        <div className="space-y-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 animate-pulse-glow">
            {message || STAGES[activeStage]?.label || '正在处理...'}
          </p>
        </div>
      </div>
    </div>
  );
}
