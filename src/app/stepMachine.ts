import type { PostureSession, PostureSessionStep } from '../types';

export const STEP_ORDER: PostureSessionStep[] = ['capture', 'analysis', 'profile', 'chat'];

export function getStepProgress(step: PostureSessionStep): number {
  const index = STEP_ORDER.indexOf(step);
  return index < 0 ? 0 : Math.round(((index + 1) / STEP_ORDER.length) * 100);
}

function hasRequiredSuccessfulAnalysis(session: PostureSession): boolean {
  if (session.photos.some(photo => photo.analysisStatus === 'failed')) {
    return false;
  }

  if (session.viewSelection === 'dual') {
    if (session.photos.length === 0) {
      return Boolean(session.combinedAnalysis);
    }
    return Boolean(
      session.photos.find(photo => photo.view === 'front' && photo.analysis) &&
      session.photos.find(photo => photo.view === 'side' && photo.analysis) &&
      session.combinedAnalysis
    );
  }

  if (session.photos.length === 0) {
    return Boolean(session.analysis);
  }
  return Boolean(session.photos.find(photo => photo.view === session.viewSelection && photo.analysis));
}

export function canEnterStep(session: PostureSession | null, step: PostureSessionStep): boolean {
  if (step === 'capture') {
    return true;
  }
  if (!session) {
    return false;
  }
  if (step === 'analysis') {
    return session.photos.length > 0 || Boolean(session.imageDataUrl);
  }
  if (step === 'profile') {
    return hasRequiredSuccessfulAnalysis(session);
  }
  return Boolean(session.profile && hasRequiredSuccessfulAnalysis(session));
}
