import type { CapturedPhoto, CombinedAnalysisResult, PostureAnalysisResult, PostureSession } from '../types';

export function getSessionSingleAnalysis(session: PostureSession | null): PostureAnalysisResult | null {
  return session?.analysis ?? session?.photos.find(photo => photo.analysis)?.analysis ?? null;
}

export function hasCompleteDualAnalysis(session: PostureSession | null): boolean {
  if (!session || session.viewSelection !== 'dual') {
    return false;
  }
  return Boolean(
    session.photos.find(photo => photo.view === 'front')?.analysis &&
    session.photos.find(photo => photo.view === 'side')?.analysis
  );
}

export function getSessionDisplayAnalysis(
  session: PostureSession | null
): PostureAnalysisResult | CombinedAnalysisResult | null {
  if (session?.combinedAnalysis && hasCompleteDualAnalysis(session)) {
    return session.combinedAnalysis;
  }
  return getSessionSingleAnalysis(session);
}

export function getSessionDisplayPhotos(session: PostureSession | null): CapturedPhoto[] {
  if (!session) {
    return [];
  }

  const displayAnalysis = getSessionDisplayAnalysis(session);
  if (displayAnalysis && 'view' in displayAnalysis) {
    const sameViewPhotos = session.photos.filter(photo => photo.view === displayAnalysis.view);
    return sameViewPhotos.length > 0 ? sameViewPhotos.slice(0, 1) : [];
  }

  if (displayAnalysis && session.combinedAnalysis === displayAnalysis) {
    return ['front', 'side']
      .map(view => session.photos.find(photo => photo.view === view && photo.analysis))
      .filter((photo): photo is CapturedPhoto => Boolean(photo));
  }

  return session.photos.slice(0, 2);
}
