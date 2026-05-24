import { Clock3 } from 'lucide-react';
import { ISSUE_LABELS } from '../../data/exercises';
import { formatDate } from '../../lib/time';
import type { PostureSession } from '../../types';

type HistoryRailProps = {
  sessions: PostureSession[];
  currentSessionId: string | null;
  onSelect: (sessionId: string) => void;
};

export function HistoryRail({ sessions, currentSessionId, onSelect }: HistoryRailProps) {
  return (
    <aside className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary-500" />
        <h2 className="text-base font-semibold text-gray-800">最近记录</h2>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm leading-6 text-gray-500">完成一次拍摄后，这里会保存最近 10 条评估。</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const issue = session.combinedAnalysis?.primaryIssue ?? session.analysis?.primaryIssue ?? null;
            const score = session.combinedAnalysis?.score ?? session.analysis?.score;
            const active = currentSessionId === session.id;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelect(session.id)}
                className={`w-full cursor-pointer rounded-2xl p-3 text-left transition ${
                  active ? 'bg-primary-50 text-primary-800' : 'bg-gray-50 text-gray-700 hover:bg-primary-50/70'
                }`}
              >
                <span className="block text-sm font-semibold">{issue ? ISSUE_LABELS[issue] : '待分析记录'}</span>
                <span className="mt-1 block text-xs text-gray-500">{formatDate(session.updatedAt)}</span>
                {typeof score === 'number' && <span className="mt-1 block text-xs text-gray-500">评分 {score.toFixed(1)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
