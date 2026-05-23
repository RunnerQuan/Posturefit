interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  primaryIssueLabel?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#eab308'; // yellow-500
  if (score >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '体态良好';
  if (score >= 60) return '略有偏差';
  if (score >= 40) return '需要改善';
  return '建议矫正';
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  primaryIssueLabel,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-2xl leading-none font-serif"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs text-gray-500 mt-1">分</span>
        </div>
      </div>

      {/* Score label */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {primaryIssueLabel && primaryIssueLabel !== '无' && (
          <p className="text-xs text-gray-400 mt-0.5">主要问题：{primaryIssueLabel}</p>
        )}
      </div>
    </div>
  );
}
