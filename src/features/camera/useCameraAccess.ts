import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface UseCameraAccessResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  permissionState: CameraPermissionState;
  error: string | null;
  isActive: boolean;
  requestCameraAccess: () => Promise<boolean>;
  stopCamera: () => void;
  captureFrame: () => string | null;
  captureCanvas: () => HTMLCanvasElement | null;
}

export function useCameraAccess(): UseCameraAccessResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('prompt');
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const requestCameraAccess = useCallback(async (): Promise<boolean> => {
    setError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      
      setStream(mediaStream);
      setPermissionState('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setPermissionState('denied');
          setError('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
        } else if (err.name === 'NotFoundError') {
          setPermissionState('unavailable');
          setError('未找到摄像头设备');
        } else if (err.name === 'NotReadableError') {
          setPermissionState('unavailable');
          setError('摄像头被其他应用占用');
        } else {
          setError(`摄像头错误: ${err.message}`);
        }
      } else {
        setError('无法访问摄像头');
      }
      
      return false;
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !stream) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [stream]);

  const captureCanvas = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !stream) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0);
    return canvas;
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    permissionState,
    error,
    isActive: stream !== null,
    requestCameraAccess,
    stopCamera,
    captureFrame,
    captureCanvas,
  };
}
