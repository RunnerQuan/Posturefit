import { useEffect, useRef } from 'react';
import type { PostureAnalysisResult } from '../../types';
import { drawSkeleton } from './drawSkeleton';

interface SkeletonOverlayProps {
  result: PostureAnalysisResult;
  imageUrl: string;
  className?: string;
}

export function SkeletonOverlay({ result, imageUrl, className = '' }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || result.keypoints.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    if (!imageRef.current || imageRef.current.src !== imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        drawOnCanvas();
      };
      img.src = imageUrl;
    } else {
      drawOnCanvas();
    }

    function drawOnCanvas() {
      if (!canvas || !ctx || !imageRef.current) {
        return;
      }

      const img = imageRef.current;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      drawSkeleton(
        ctx,
        result.keypoints,
        result.metrics,
        result.issues,
        result.score,
        { width: canvas.width, height: canvas.height },
        {
          showKeypoints: true,
          showSkeleton: true,
          showAngles: true,
          showIssues: true,
          showScores: true,
        }
      );
    }
  }, [result, imageUrl]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      if (imageRef.current) {
        const img = imageRef.current;
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;
        
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);
        
        canvas.style.width = `${imgWidth * scale}px`;
        canvas.style.height = `${imgHeight * scale}px`;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}
    >
      {result.keypoints.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <p className="text-gray-400">暂无分析数据</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full mx-auto"
          style={{ objectFit: 'contain' }}
        />
      )}
    </div>
  );
}
