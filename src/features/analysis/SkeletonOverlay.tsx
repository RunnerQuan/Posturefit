import { useEffect, useRef, useState } from 'react';
import type { PostureAnalysisResult } from '../../types';
import { drawSkeleton } from './drawSkeleton';

interface SkeletonOverlayProps {
  result: PostureAnalysisResult;
  imageUrl: string;
  className?: string;
  autoAspectRatio?: boolean;
}

export function SkeletonOverlay({ result, imageUrl, className = '', autoAspectRatio = false }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

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
        // 设置宽高比
        if (autoAspectRatio) {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
        }
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
  }, [result, imageUrl, autoAspectRatio]);

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

  // 计算容器样式
  const containerStyle: React.CSSProperties = {};
  if (autoAspectRatio && aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center ${className}`}
      style={containerStyle}
    >
      {result.keypoints.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[200px] w-full">
          <p className="text-gray-400">暂无分析数据</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ objectFit: 'contain' }}
        />
      )}
    </div>
  );
}
