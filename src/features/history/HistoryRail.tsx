import { Clock3, ChevronRight } from 'lucide-react';
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
    <aside className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-soft overflow-hidden">
      {/* 头部 */}
      <div className="px-4 py-4 border-b border-blush-100/50 bg-gradient-to-r from-blush-50/50 to-mist-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blush-400 to-mist-400 flex items-center justify-center">
            <Clock3 className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-blush-600">历史记录</h2>
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blush-50 to-mist-50 flex items-center justify-center">
              <Clock3 className="w-6 h-6 text-mist-400" />
            </div>
            <p className="text-sm text-mist-500">完成一次拍摄后，这里会保存最近 10 条评估。</p>
          </div>
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
                  className={`w-full cursor-pointer rounded-xl p-3 text-left transition-all group ${
                    active
                      ? 'bg-gradient-to-r from-blush-100/80 to-mist-100/80 border border-blush-200/50 shadow-sm'
                      : 'bg-white/50 text-blush-700 border border-transparent hover:border-blush-200/50 hover:bg-gradient-to-r hover:from-blush-50/50 hover:to-mist-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${active ? 'text-blush-700' : 'text-blush-600 group-hover:text-blush-700'}`}>
                        {issue ? ISSUE_LABELS[issue] : '待分析记录'}
                      </p>
                      <p className="text-xs text-mist-500 mt-0.5">{formatDate(session.updatedAt)}</p>
                      {typeof score === 'number' && (
                        <p className="text-xs font-medium bg-gradient-to-r from-blush-500 to-mist-500 bg-clip-text text-transparent mt-1">
                          评分 {score.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${active ? 'text-blush-400 rotate-90' : 'text-mist-300 group-hover:text-mist-400 group-hover:translate-x-0.5'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 样式 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f9a8d4, #d8b4fe);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #f472b6, #c084fc);
        }
      `}</style>
    </aside>
  );
}
