// =============================================================================
// PostureFit 类型定义
// 所有共享类型必须从此文件导出
// =============================================================================

export type CaptureSourceType = 'camera' | 'upload';
export type CaptureMode = 'fullBody' | 'halfBody' | 'closeUp' | 'sitting';

// 视角类型和视角选择
export type PoseView = 'front' | 'side';
export type ViewSelection = 'front' | 'side' | 'dual';

// =============================================================================
// MediaPipe BlazePose 33 点关键点定义
// 参考: docs/MediaPipe_BlazePose_体态识别替换技术文档.md
// =============================================================================

export type BlazePoseLandmark =
  | 'nose'
  | 'left_eye_inner'
  | 'left_eye'
  | 'left_eye_outer'
  | 'right_eye_inner'
  | 'right_eye'
  | 'right_eye_outer'
  | 'left_ear'
  | 'right_ear'
  | 'mouth_left'
  | 'mouth_right'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_pinky'
  | 'right_pinky'
  | 'left_index'
  | 'right_index'
  | 'left_thumb'
  | 'right_thumb'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle'
  | 'left_heel'
  | 'right_heel'
  | 'left_foot_index'
  | 'right_foot_index';

export type PoseKeypoint33 = {
  name: BlazePoseLandmark;
  x: number;
  y: number;
  z?: number;
  score: number;
};

// 保留旧版 17 点类型以兼容
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

// =============================================================================
// 体态问题类型定义
// =============================================================================

// 体态问题类型（10个，含骨盆前倾）
export type PostureIssueType =
  | 'forwardHead'           // 头前伸
  | 'roundedShoulder'       // 圆肩
  | 'shoulderImbalance'     // 高低肩
  | 'pelvicTilt'            // 骨盆侧倾
  | 'anteriorPelvicTilt'   // 骨盆前倾
  | 'kneeValgus'           // 膝内扣
  | 'headOffset'           // 头部偏移
  | 'centerOfGravityShift' // 重心偏移
  | 'hunchback'            // 驼背倾向
  | 'kneeHyperextension';  // 膝超伸

export type PostureSeverity = 'normal' | 'mild' | 'moderate' | 'severe';

// 体态角度指标（全部使用角度，单位：度）
export type PostureAngleMetrics = {
  // 正面视角指标
  forwardHeadAngle: number;       // 头前伸角度 (CVA近似角)
  shoulderImbalanceAngle: number;  // 高低肩角度 (atan2斜率)
  pelvicTiltAngle: number;         // 骨盆侧倾角度 (atan2斜率)
  kneeValgusAngle: number;         // 膝内扣角度 (FPPA)
  headOffsetAngle: number;         // 头部偏移角度
  centerOfGravityShiftAngle: number; // 重心偏移角度
  // 侧面视角指标
  roundedShoulderAngle: number;    // 圆肩角度
  hunchbackAngle: number;          // 驼背倾向角度 (加权综合)
  kneeHyperextensionAngle: number; // 膝超伸角度
  anteriorTiltAngle: number;       // 骨盆前倾角度
  // 辅助指标（用于综合评分）
  trunkLeanAngle?: number;         // 躯干前倾角度
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
  keypoints: PoseKeypoint33[];
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
  sessionId: string;
  currentExerciseNames?: string[];
  completedExerciseNames?: string[];
  generatedExerciseNames?: string[];
};

export type CoachFeedbackRequest = {
  profile: UserProfile;
  sessionId: string;
  plan?: TrainingPlan;
  analysis?: PostureAnalysisResult;
  feedback: CheckInFeedback | string;
  feedbackText?: string;
  previousMessages: CoachMessage[];
  currentExerciseNames?: string[];
  completedExerciseNames?: string[];
  generatedExerciseNames?: string[];
};

export interface CoachClient {
  generatePlanMessage(request: CoachPlanRequest): Promise<CoachMessage>;
  generatePlanMessageStream?(
    request: CoachPlanRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage>;
  respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage>;
  respondToFeedbackStream?(
    request: CoachFeedbackRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage>;
}

// Session types
export type PostureSessionStep = 'capture' | 'analysis' | 'profile' | 'chat';

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
  currentExerciseNames?: string[];
  completedExerciseNames?: string[];
  generatedExerciseNames?: string[];
  chatMessages: CoachMessage[];
};

export type AppState = {
  currentSessionId: string | null;
  sessions: PostureSession[];
  preferences?: Partial<UserProfile>;
  schemaVersion: 2;  // 升级版本号以支持双视角
};
