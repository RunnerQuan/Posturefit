import { BarChart3, ImageIcon, MessageCircle, Sparkles } from 'lucide-react';
import { formatDate } from '../../lib/time';
import { getSessionDisplayAnalysis, getSessionDisplayIssueLabel, getSessionDisplayPhotos } from '../../lib/sessionAnalysis';
import type { PostureSession } from '../../types';

type SessionSidebarProps = {
  sessions: PostureSession[];
  currentSessionId: string | null;
  onSelect: (sessionId: string) => void;
};

function getSessionScore(session: PostureSession): number | undefined {
  return getSessionDisplayAnalysis(session)?.score;
}

export function SessionSidebar({ sessions, currentSessionId, onSelect }: SessionSidebarProps) {
  return (
    <aside className="flex h-[calc(100vh-10.5rem)] min-h-[600px] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-soft backdrop-blur-xl">
      <div className="border-b border-blush-100/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-500 to-mist-500 text-white shadow-bubble">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-blush-700">历史评估</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blush-100 bg-blush-50/50 px-4 py-8 text-center">
            <ImageIcon className="mx-auto h-7 w-7 text-mist-400" />
            <p className="mt-3 text-sm leading-6 text-mist-500">完成评估后，这里会保存最近 10 次记录。</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => {
              const active = session.id === currentSessionId;
              const score = getSessionScore(session);
              const photos = getSessionDisplayPhotos(session);
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelect(session.id)}
                  className={`w-full cursor-pointer rounded-2xl border p-2.5 text-left transition ${
                    active
                      ? 'border-blush-200 bg-gradient-to-br from-blush-50 to-mist-50 shadow-sm'
                      : 'border-transparent bg-white/55 hover:border-blush-100 hover:bg-white/90'
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`grid h-12 w-12 shrink-0 gap-1 overflow-hidden rounded-xl bg-blush-50 ${
                        photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                      }`}
                    >
                      {photos.length > 0 ? (
                        photos.slice(0, 2).map(photo => (
                          <img
                            key={photo.id}
                            src={photo.imageUrl}
                            alt=""
                            className="h-full min-h-0 w-full object-cover"
                          />
                        ))
                      ) : (
                        <div className="col-span-2 flex items-center justify-center text-mist-300">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-blush-700">{getSessionDisplayIssueLabel(session)}</p>
                        {typeof score === 'number' && (
                          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-mist-600">
                            {score.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-mist-500">{formatDate(session.updatedAt)}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-mist-500">
                        <span className="inline-flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {session.plan ? '已出计划' : '待计划'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {session.chatMessages.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
