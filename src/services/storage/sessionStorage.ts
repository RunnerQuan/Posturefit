import type { AppState, PostureSession, CaptureSourceType, CaptureMode, ViewSelection } from '../../types';
import { STORAGE_KEY, SESSION_LIMIT } from '../../lib/storage';
import { generateSessionId } from '../../lib/ids';
import { getCurrentISOString } from '../../lib/time';

function createEmptyAppState(): AppState {
  return {
    currentSessionId: null,
    sessions: [],
    schemaVersion: 2,
  };
}

export function loadAppState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createEmptyAppState();
    }
    const parsed = JSON.parse(stored) as AppState;
    if (parsed.schemaVersion !== 2) {
      console.warn('Storage schema version mismatch, resetting');
      return createEmptyAppState();
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load app state:', error);
    return createEmptyAppState();
  }
}

function sortAndTrimSessions(sessions: PostureSession[]): PostureSession[] {
  return [...sessions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, SESSION_LIMIT);
}

export function saveAppState(state: AppState): void {
  try {
    const trimmedState: AppState = {
      ...state,
      sessions: sortAndTrimSessions(state.sessions),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedState));
  } catch (error) {
    console.error('Failed to save app state:', error);
  }
}

export function createSession(sourceType: CaptureSourceType, captureMode: CaptureMode): PostureSession {
  const now = getCurrentISOString();
  return {
    id: generateSessionId(),
    createdAt: now,
    updatedAt: now,
    step: 'capture',
    sourceType,
    captureMode,
    viewSelection: 'dual' as ViewSelection,
    photos: [],
    chatMessages: [],
  };
}

export function updateSession(session: PostureSession, updates: Partial<PostureSession>): PostureSession {
  return {
    ...session,
    ...updates,
    updatedAt: getCurrentISOString(),
  };
}
