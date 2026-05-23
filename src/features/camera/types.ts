import type { CaptureMode } from '../../types';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  selectedMode: CaptureMode;
  onModeChange: (mode: CaptureMode) => void;
  onUploadImage: (imageDataUrl: string) => void;
}

export type { CameraCaptureProps };
