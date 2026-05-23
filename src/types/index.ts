// =============================================================================
// PostureFit 类型定义
// 所有共享类型必须从此文件导出
// =============================================================================

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

export type PostureIssueType = 'forwardHead' | 'roundedShoulder' | 'anteriorPelvicTilt';
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
  captureMode: CaptureMode;
  keypoints: PoseKeypoint17[];
  metrics: PostureAngleMetrics;
  issues: PostureIssue[];
  supportedIssueTypes: PostureIssueType[];
  primaryIssue: PostureIssueType | null;
  score?: number;
  analyzedAt: string;
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
};

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

// Session types
export type PostureSessionStep = 'capture' | 'analysis' | 'profile' | 'plan' | 'chat';

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
