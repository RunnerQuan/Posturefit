import { describe, expect, it } from 'vitest';

vi.mock('./features/camera', () => ({
  CameraCapture: ({
    onUploadImage,
  }: {
    onUploadImage: (imageDataUrl: string, view: 'front' | 'side') => void;
  }) => (
    <button type="button" onClick={() => onUploadImage(`data:image/${Date.now()}`, 'side')}>
      上传侧面样例
    </button>
  ),
}));

vi.mock('./features/analysis', async importOriginal => {
  const actual = await importOriginal<typeof import('./features/analysis')>();
  return {
    ...actual,
    SkeletonOverlay: ({ imageUrl }: { imageUrl: string }) => (
      <div data-testid="skeleton-overlay">{imageUrl}</div>
    ),
  };
});

vi.mock('./features/pose', async importOriginal => {
  const actual = await importOriginal<typeof import('./features/pose')>();
  return {
    ...actual,
    usePoseDetection: vi.fn(),
  };
});

const mockUsePoseDetection = vi.mocked(usePoseDetection);

const pose: PoseKeypoint17[] = [
  { name: 'nose', x: 100, y: 40, score: 0.95 },
  { name: 'leftEye', x: 95, y: 35, score: 0.95 },
  { name: 'rightEye', x: 105, y: 35, score: 0.95 },
  { name: 'leftEar', x: 100, y: 45, score: 0.95 },
  { name: 'rightEar', x: 104, y: 45, score: 0.95 },
  { name: 'leftShoulder', x: 100, y: 100, score: 0.95 },
  { name: 'rightShoulder', x: 106, y: 100, score: 0.95 },
  { name: 'leftElbow', x: 100, y: 150, score: 0.95 },
  { name: 'rightElbow', x: 106, y: 150, score: 0.95 },
  { name: 'leftWrist', x: 100, y: 200, score: 0.95 },
  { name: 'rightWrist', x: 106, y: 200, score: 0.95 },
  { name: 'leftHip', x: 100, y: 210, score: 0.95 },
  { name: 'rightHip', x: 106, y: 210, score: 0.95 },
  { name: 'leftKnee', x: 100, y: 320, score: 0.95 },
  { name: 'rightKnee', x: 106, y: 320, score: 0.95 },
  { name: 'leftAnkle', x: 100, y: 430, score: 0.95 },
  { name: 'rightAnkle', x: 106, y: 430, score: 0.95 },
];

describe('App frontend B flow', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUsePoseDetection.mockReset();
    mockUsePoseDetection.mockReturnValue({
      isModelLoading: false,
      isDetecting: false,
      error: null,
      detectPoseFromImage: vi.fn<UsePoseDetectionResult['detectPoseFromImage']>().mockResolvedValue(pose),
      detectPoseFromElement: vi.fn(),
      modelType: 'SinglePose.Lightning',
      setModelType: vi.fn(),
    });
  });

  it('runs upload, analysis, profile, plan, and check-in feedback', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));

    await screen.findByText('分析结果');
    expect(screen.getByTestId('skeleton-overlay')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /继续选择教练/ }));
    expect(await screen.findByText('选择你的专属教练')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('例如：改善圆肩、缓解久坐酸痛'), {
      target: { value: '改善圆肩' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成今日计划' }));

    expect(await screen.findByText('今日训练计划')).toBeInTheDocument();
    expect(screen.getAllByText('B站跟练参考')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: '去打卡' }));
    expect(await screen.findByText(/今天完成 3 个动作了吗/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '做完了' }));
    await waitFor(() => expect(screen.getAllByText('做完了').length).toBeGreaterThan(1));
    expect(await screen.findByText(/太厉害了|已完成|哇哦/)).toBeInTheDocument();
  });

  it('persists a session into localStorage after analysis', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));
    await screen.findByText('分析结果');

    await waitFor(() => {
      const stored = localStorage.getItem('posturefit.appState.v1');
      expect(stored).toContain('sessions');
    });
  });
});
