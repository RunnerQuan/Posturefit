# PostureFit 核心接口契约

版本：v1.0  
日期：2026-05-23  
状态：已冻结

---

## 1. 类型契约

### 1.1 姿态识别类型 (`src/types/posture.ts`)

```typescript
export type CaptureSourceType = 'camera' | 'upload';
export type CaptureMode = 'fullBody' | 'halfBody' | 'closeUp' | 'sitting';

export type KeypointName =
  | 'nose'
  | 'leftEye'
  | 'rightEye'
  | 'leftEar'
  | 'rightEar'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle';

export type PoseKeypoint17 = {
  name: KeypointName;
  x: number;
  y: number;
  score: number;
};

export type PostureIssueType =
  | 'forwardHead'
  | 'roundedShoulder'
  | 'anteriorPelvicTilt';

export type PostureSeverity = 'normal' | 'mild' | 'moderate' | 'severe';

export type PostureAngleMetrics = {
  forwardHeadAngle: number;
  roundedShoulderAngle: number;
  anteriorTiltAngle: number;
};

export type PostureIssue = {
  type: PostureIssueType;
  severity: PostureSeverity;
  angle: number;
  threshold: number;
  label: string;
};

export type PostureAnalysisResult = {
  keypoints: PoseKeypoint17[];
  metrics: PostureAngleMetrics;
  issues: PostureIssue[];
  primaryIssue: PostureIssueType | null;
  score?: number;
  analyzedAt: string;
};
```

### 1.2 训练计划类型 (`src/types/training.ts`)

```typescript
export type BodyState =
  | 'normal'
  | 'postpartum'
  | 'menstrual'
  | 'fatigued'
  | 'teenager';

export type CoachStyle = 'encouraging' | 'strict' | 'humorous';
export type CoachGender = 'male' | 'female';

export type UserProfile = {
  coachStyle: CoachStyle;
  coachGender: CoachGender;
  userGoal: string;
  bodyState: BodyState;
};

export type Exercise = {
  id: string;
  issueType: PostureIssueType;
  name: string;
  description: string;
  durationSeconds: number;
  bilibiliSearchUrl: string;
  contraindications?: BodyState[];
};

export type TrainingPlan = {
  id: string;
  sessionId: string;
  primaryIssue: PostureIssueType | null;
  exercises: Exercise[];
  createdAt: string;
  intensity: 'low' | 'medium';
};
```

### 1.3 教练服务类型 (`src/types/coach.ts`)

```typescript
export type CoachMessageRole = 'user' | 'assistant';

export type CoachMessage = {
  id: string;
  role: CoachMessageRole;
  content: string;
  createdAt: string;
};

export type CheckInFeedback = 'completed' | 'tooTired';

export type CoachPlanRequest = {
  analysis: PostureAnalysisResult;
  profile: UserProfile;
  plan: TrainingPlan;
};

export type CoachFeedbackRequest = {
  profile: UserProfile;
  plan: TrainingPlan;
  feedback: CheckInFeedback;
  previousMessages: CoachMessage[];
};

export interface CoachClient {
  generatePlanMessage(request: CoachPlanRequest): Promise<CoachMessage>;
  respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage>;
}
```

### 1.4 会话类型 (`src/types/session.ts`)

```typescript
export type PostureSessionStep =
  | 'capture'
  | 'analysis'
  | 'profile'
  | 'plan'
  | 'chat';

export type PostureSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  step: PostureSessionStep;
  sourceType: CaptureSourceType;
  captureMode: CaptureMode;
  imageDataUrl?: string;
  analysis?: PostureAnalysisResult;
  profile?: UserProfile;
  plan?: TrainingPlan;
  chatMessages: CoachMessage[];
};

export type AppState = {
  currentSessionId: string | null;
  sessions: PostureSession[];
  preferences?: Partial<UserProfile>;
  schemaVersion: 1;
};
```

---

## 2. 模块接口

### 2.1 摄像头模块 (`src/features/camera/`)

```typescript
// useCameraAccess.ts
export function useCameraAccess(): {
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
```

### 2.2 姿态检测模块 (`src/features/pose/`)

```typescript
// usePoseDetection.ts
export function usePoseDetection(
  autoInit?: boolean,
  modelType?: MoveNetModelType
): {
  isModelLoading: boolean;
  isDetecting: boolean;
  error: string | null;
  detectPoseFromImage: (imageUrl: string) => Promise<PoseKeypoint17[]>;
  detectPoseFromElement: (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => Promise<PoseKeypoint17[]>;
  modelType: MoveNetModelType;
  setModelType: (type: MoveNetModelType) => void;
}
```

### 2.3 体态分析模块 (`src/features/analysis/`)

```typescript
// postureAnalyzer.ts
export function analyzePose(
  keypoints: PoseKeypoint17[],
  options?: AnalyzePoseOptions
): PostureAnalysisResult

// angleCalculator.ts
export function calculateAllPostureAngles(
  keypoints: PoseKeypoint17[]
): PostureAngleMetrics

// postureClassifier.ts
export function classifyAllPostureIssues(
  metrics: PostureAngleMetrics,
  thresholds?: PostureThresholds
): PostureIssue[]

export function findPrimaryIssue(issues: PostureIssue[]): PostureIssueType | null

export function calculatePostureScore(issues: PostureIssue[]): number
```

### 2.4 骨架绘制模块 (`src/features/analysis/`)

```typescript
// drawSkeleton.ts
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint17[],
  metrics?: PostureAngleMetrics,
  issues?: PostureIssue[],
  score?: number,
  imageSize?: { width: number; height: number },
  options?: DrawOptions
): void
```

---

## 3. 体态阈值

| 体态问题 | 正常 | 轻度 | 中度 | 重度 |
|---------|------|------|------|------|
| 头前伸角 | < 5° | 5-10° | 10-15° | >= 15° |
| 圆肩角 | < 20° | 20-25° | 25-30° | >= 30° |
| 骨盆前倾角 | 5-15° | 15-20° | 20-25° | >= 25° |

---

## 4. 步骤状态机

```
capture → analysis → profile → plan → chat
   ↑__________________|__________|
```

步骤推进规则：
- 没有 `imageUrl` 不能进入 `analysis`
- 没有 `analysis` 不能进入 `profile`
- 没有 `profile` 不能生成 `plan`
- 没有 `plan` 不能进入 `chat`
- 每次步骤变化都写入 storage

---

## 5. 数据流

```
摄像头/上传图片
    ↓
usePoseDetection.detectPoseFromImage()
    ↓
normalizeMoveNetKeypoints() → PoseKeypoint17[]
    ↓
analyzePose() → PostureAnalysisResult
    ↓
├─ angleCalculator.calculateAllPostureAngles() → PostureAngleMetrics
├─ postureClassifier.classifyAllPostureIssues() → PostureIssue[]
├─ postureClassifier.findPrimaryIssue() → primaryIssue
└─ postureClassifier.calculatePostureScore() → score
    ↓
SkeletonOverlay 显示标注
    ↓
传递给前端B生成训练计划
```

---

## 6. 禁止事项

1. 禁止演示路径直接写死角度
2. 禁止 UI 直接读取 MoveNet 原始对象
3. 禁止 Coze 返回值覆盖本地角度计算结果
4. 禁止上传用户照片到业务后端
5. 业务组件禁止直接调用 localStorage

---

**文档结束**
