import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CameraCapture, resolveCaptureView } from './CameraCapture';

vi.mock('./useCameraAccess', () => ({
  useCameraAccess: () => ({
    videoRef: { current: null },
    permissionState: 'prompt',
    error: null,
    isActive: false,
    requestCameraAccess: vi.fn(),
    captureFrame: vi.fn(),
  }),
}));

describe('resolveCaptureView', () => {
  it('uses the selected side view for side-only mode', () => {
    expect(resolveCaptureView('side', null)).toBe('side');
  });

  it('uses the selected front view for front-only mode', () => {
    expect(resolveCaptureView('front', null)).toBe('front');
  });

  it('keeps dual-view capture order as front then side', () => {
    expect(resolveCaptureView('dual', null)).toBe('front');
    expect(resolveCaptureView('dual', 'front')).toBe('side');
  });
});

describe('CameraCapture', () => {
  it('shows capture-mode guidance on the capture page and updates it when mode changes', () => {
    const onModeChange = vi.fn();
    const { rerender } = render(
      <CameraCapture
        onCapture={vi.fn()}
        selectedMode="fullBody"
        onModeChange={onModeChange}
        onUploadImage={vi.fn()}
        viewSelection="dual"
        onViewSelectionChange={vi.fn()}
        showViewSelection
      />
    );

    expect(screen.getByText('拍摄模式指引')).toBeInTheDocument();
    expect(screen.getByText(/当前：正面照/)).toBeInTheDocument();
    expect(screen.getByText(/正面：头部、双肩、双髋、双膝、双踝/)).toBeInTheDocument();
    expect(screen.getByText(/侧面：同侧肩、髋、膝、踝/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '半身' }));
    expect(onModeChange).toHaveBeenCalledWith('halfBody');

    rerender(
      <CameraCapture
        onCapture={vi.fn()}
        selectedMode="halfBody"
        onModeChange={onModeChange}
        onUploadImage={vi.fn()}
        viewSelection="dual"
        onViewSelectionChange={vi.fn()}
        showViewSelection
      />
    );

    expect(screen.getByText(/适合上半身体态和肩颈问题/)).toBeInTheDocument();
    expect(screen.getByText(/正面：头部、双肩、双髋/)).toBeInTheDocument();
    expect(screen.getByText(/不用于膝内扣或膝超伸/)).toBeInTheDocument();
  });

  it('places guidance below the preview area and before capture actions', () => {
    render(
      <CameraCapture
        onCapture={vi.fn()}
        selectedMode="fullBody"
        onModeChange={vi.fn()}
        onUploadImage={vi.fn()}
        viewSelection="front"
        onViewSelectionChange={vi.fn()}
        showViewSelection
      />
    );

    const preview = screen.getByTestId('capture-preview');
    const guide = screen.getByTestId('capture-mode-guide');
    const cameraButtons = screen.getAllByRole('button', { name: '开启摄像头' });
    const primaryAction = cameraButtons[cameraButtons.length - 1];

    expect(preview.compareDocumentPosition(guide) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(primaryAction).toBeDefined();
    expect(guide.compareDocumentPosition(primaryAction as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps a view status row for single-view layouts so the preview does not jump upward', () => {
    const { rerender } = render(
      <CameraCapture
        onCapture={vi.fn()}
        selectedMode="fullBody"
        onModeChange={vi.fn()}
        onUploadImage={vi.fn()}
        viewSelection="front"
        onViewSelectionChange={vi.fn()}
        showViewSelection
      />
    );

    expect(screen.getByTestId('capture-view-progress')).toBeInTheDocument();
    expect(screen.getByTestId('capture-view-progress')).toHaveTextContent('正面照');

    rerender(
      <CameraCapture
        onCapture={vi.fn()}
        selectedMode="fullBody"
        onModeChange={vi.fn()}
        onUploadImage={vi.fn()}
        viewSelection="side"
        onViewSelectionChange={vi.fn()}
        showViewSelection
      />
    );

    expect(screen.getByTestId('capture-view-progress')).toHaveTextContent('侧面照');
  });

  it('switches guidance by selected view and dual-view capture progress', () => {
    const { rerender } = render(
      <CameraCapture
        onCapture={vi.fn()}
        selectedMode="fullBody"
        onModeChange={vi.fn()}
        onUploadImage={vi.fn()}
        viewSelection="side"
        onViewSelectionChange={vi.fn()}
        showViewSelection
      />
    );

    expect(screen.getByText(/当前：侧面照/)).toBeInTheDocument();
    expect(screen.getByText(/侧面：同侧肩、髋、膝、踝/)).toBeInTheDocument();
    expect(screen.getByText(/膝超伸需要膝盖和脚踝清楚可见/)).toBeInTheDocument();

    rerender(
      <CameraCapture
        onCapture={vi.fn()}
        selectedMode="fullBody"
        onModeChange={vi.fn()}
        onUploadImage={vi.fn()}
        viewSelection="dual"
        onViewSelectionChange={vi.fn()}
        currentCaptureView="front"
        showViewSelection
      />
    );

    expect(screen.getByText(/下一张：侧面照/)).toBeInTheDocument();
    expect(screen.getByText(/正面：头部、双肩、双髋、双膝、双踝/)).toBeInTheDocument();
    expect(screen.getByText(/侧面：同侧肩、髋、膝、踝/)).toBeInTheDocument();
  });
});
