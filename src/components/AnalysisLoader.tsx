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
      <div className="w-full max-w-sm space-y-8">
        {/* 阶段指示器 */}
        <div className="flex justify-between items-center relative">
          {/* 背景轨道 */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-blush-100 to-mist-100 rounded-full" />

          {/* 进度轨道 */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blush-400 to-mist-400 rounded-full transition-all duration-500"
            style={{ width: `${(activeStage / (STAGES.length - 1)) * 100}%` }}
          />

          {STAGES.map((stage, index) => {
            const isDone = index < activeStage;
            const isActive = index === activeStage;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center gap-3 relative z-10">
                {/* 图标容器 */}
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 relative
                    ${isDone || isActive
                      ? 'bg-gradient-to-br from-blush-400 to-mist-400 text-white shadow-bubble'
                      : 'bg-white text-gray-300 border border-gray-100'
                    }
                    ${isActive ? 'ring-4 ring-blush-100 scale-110' : ''}
                  `}
                >
                  {/* 发光效果 */}
                  {(isDone || isActive) && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blush-400/30 to-mist-400/30 blur-md animate-pulse" />
                  )}

                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'animate-bounce' : ''}`} />

                  {/* 完成勾选标记 */}
                  {isDone && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 阶段标签 */}
        <div className="flex justify-between px-2">
          {STAGES.map((stage, index) => {
            const isDone = index < activeStage;
            const isActive = index === activeStage;

            return (
              <span
                key={stage.id}
                className={`
                  text-xs font-medium transition-all duration-300 text-center
                  ${isDone
                    ? 'text-blush-500'
                    : isActive
                      ? 'text-blush-600 font-semibold animate-pulse'
                      : 'text-gray-400'
                  }
                `}
              >
                {stage.label}
              </span>
            );
          })}
        </div>

        {/* 活跃阶段进度条 */}
        <div className="space-y-3">
          <div className="h-2 bg-gradient-to-r from-blush-50 to-mist-50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blush-400 via-mist-400 to-sky-300 rounded-full transition-all duration-100 ease-out shadow-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-blush-500 animate-pulse font-medium">
            {message || STAGES[activeStage]?.label || '正在处理...'}
          </p>
        </div>
      </div>
    </div>
  );
}
