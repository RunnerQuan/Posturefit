import type { PostureSession, PostureSessionStep } from '../types';

export const STEP_ORDER: PostureSessionStep[] = ['capture', 'analysis', 'profile', 'plan', 'chat'];

export function getStepProgress(step: PostureSessionStep): number {
  const index = STEP_ORDER.indexOf(step);
  return index < 0 ? 0 : Math.round(((index + 1) / STEP_ORDER.length) * 100);
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
    return Boolean(session.combinedAnalysis || session.analysis);
  }
  if (step === 'plan') {
    return Boolean(session.profile && (session.combinedAnalysis || session.analysis));
  }
  return Boolean(session.plan);
}
