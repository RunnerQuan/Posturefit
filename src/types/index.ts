// =============================================================================
// PostureFit 类型定义
// 所有共享类型必须从此文件导出
// =============================================================================

export type CaptureSourceType = 'camera' | 'upload';
export type CaptureMode = 'fullBody' | 'halfBody' | 'closeUp' | 'sitting';

// 新增：视角类型和视角选择
export type PoseView = 'front' | 'side';
export type ViewSelection = 'front' | 'side' | 'dual';

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

// 扩展后的体态问题类型（正面6个 + 侧面4个 = 10个）
export type PostureIssueType =
  | 'forwardHead'           // 头前伸（正面）
  | 'roundedShoulder'       // 圆肩（侧面）
  | 'anteriorPelvicTilt'   // 骨盆前倾（侧面）
  | 'shoulderImbalance'     // 高低肩（正面）
  | 'pelvicTilt'            // 骨盆侧倾（正面）
  | 'kneeValgus'           // 膝内扣（正面）
  | 'headOffset'           // 头部左右偏移（正面）
  | 'centerOfGravityShift' // 身体重心偏移（正面）
  | 'hunchback'            // 驼背倾向（侧面）
  | 'kneeHyperextension';  // 膝超伸（侧面）
export type PostureSeverity = 'normal' | 'mild' | 'moderate' | 'severe';

export type PostureAngleMetrics = {
  // 正面视角指标
  forwardHeadAngle: number;       // 头前伸角度
  shoulderImbalance: number;      // 高低肩差值(px)
  pelvicTilt: number;             // 骨盆侧倾差值(px)
  kneeValgus: number;             // 膝内扣角度
  headOffset: number;             // 头部左右偏移(px)
  centerOfGravityShift: number;   // 身体重心偏移(px)
  // 侧面视角指标
  roundedShoulderAngle: number;   // 圆肩角度
  anteriorTiltAngle: number;      // 骨盆前倾角度
  hunchback: number;             // 驼背倾向(px)
  kneeHyperextension: number;    // 膝超伸角度
};

export type PostureIssue = {
  type: PostureIssueType;
  severity: PostureSeverity;
  angle: number;
  threshold: number;
  label: string;
  view: PoseView;  // 问题来源视角
};

export type PostureAnalysisResult = {
  keypoints: PoseKeypoint17[];
  metrics: PostureAngleMetrics;
  issues: PostureIssue[];
  primaryIssue: PostureIssueType | null;
  score?: number;
  analyzedAt: string;
  view: PoseView;  // 分析结果对应的视角
};

// 合并分析结果（用于双视角模式）
export type CombinedAnalysisResult = {
  allIssues: PostureIssue[];           // 所有问题（含来源标注，按严重程度排序）
  issuesByView: Record<PoseView, PostureIssue[]>;  // 按视角分组的问题
  primaryIssue: PostureIssueType | null;
  score: number;
  analyzedAt: string;
};

// 拍摄的照片记录
export type CapturedPhoto = {
  id: string;
  view: PoseView;
  imageUrl: string;
  analysis?: PostureAnalysisResult;
  capturedAt: string;
};

// Training types
export type BodyState = 'normal' | 'postpartum' | 'menstrual' | 'fatigued' | 'teenager';
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

// Coach types
export type CoachMessageRole = 'user' | 'assistant';
export type CheckInFeedback = 'completed' | 'tooTired';

export type CoachMessage = {
  id: string;
  role: CoachMessageRole;
  content: string;
  createdAt: string;
  source?: 'coze' | 'mock';
  fallbackReason?: string;
};

export type CoachPlanRequest = {
  analysis: PostureAnalysisResult;
  profile: UserProfile;
  plan: TrainingPlan;
};

export type CoachFeedbackRequest = {
  profile: UserProfile;
  plan: TrainingPlan;
  analysis?: PostureAnalysisResult;
  feedback: CheckInFeedback;
  feedbackText?: string;
  previousMessages: CoachMessage[];
};

export interface CoachClient {
  generatePlanMessage(request: CoachPlanRequest): Promise<CoachMessage>;
  respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage>;
  respondToFeedbackStream?(
    request: CoachFeedbackRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage>;
}

// Session types
export type PostureSessionStep = 'capture' | 'analysis' | 'profile' | 'plan' | 'chat';

export type PostureSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  step: PostureSessionStep;
  sourceType: CaptureSourceType;
  captureMode: CaptureMode;
  viewSelection: ViewSelection;       // 用户选择的视角模式
  photos: CapturedPhoto[];            // 拍摄的照片列表
  combinedAnalysis?: CombinedAnalysisResult;  // 合并后的分析结果（双视角模式）
  // 保留单张照片字段以兼容旧版本
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
  schemaVersion: 2;  // 升级版本号以支持双视角
};
