# PostureFit Hackathon 共同开发框架与规范

版本：v0.1  
日期：2026-05-23  
项目目录：`posturefit-hackathon/`  
适用对象：前端 A、前端 B、全栈 C

## 1. 项目目标

PostureFit 是一个 24 小时黑客松 MVP 网页应用，目标是在浏览器内完成体态评估、问题标注、训练计划生成和打卡反馈闭环。

P0 必须保证评委能在 1 分钟内体验：

1. 现场摄像头拍摄或上传真实人体样例图。
2. TensorFlow.js MoveNet SinglePose Lightning 完成姿态识别。
3. 根据 17 个关键点计算头前伸、圆肩、骨盆前倾等体态指标。
4. Canvas/Overlay 标注骨架、问题部位和角度。
5. 用户选择教练风格、性别、目标、身体状态。
6. 本地动作库生成结构化训练计划。
7. Coze/MockCoachClient 输出教练话术。
8. 用户通过“做完了 / 太累了”打卡，得到反馈调整。
9. localStorage 保存当前会话和最近 10 条历史记录。

P1 在 P0 稳定后再做：

- 体态评分趋势图。
- 更精细的历史记录页。
- ArkClaw Skill。
- 更完整的 Coze Bot 真实接口体验。

## 2. 已确认技术决策

| 决策项 | 结论 |
| --- | --- |
| 项目位置 | 新建独立目录 `posturefit-hackathon/` |
| 前端框架 | Vite + React + TypeScript |
| 应用形态 | 单页分步骤向导，不引入 React Router |
| 后端 | 不自建业务后端，做纯前端静态应用 |
| 姿态识别 | TensorFlow.js MoveNet SinglePose Lightning |
| 关键点格式 | 内部归一成 PRD 里的 17 点格式 |
| Coze 对接 | 双通道：默认 MockCoachClient，配置环境变量后启用 CozeCoachClient |
| 训练计划 | 前端本地动作库生成结构化计划，Coze/Mock 负责教练话术和反馈调整 |
| 数据持久化 | localStorage 保存当前会话 + 最近 10 条历史 |
| UI 样式 | Tailwind CSS + 少量自定义 CSS + lucide-react |
| 质量门槛 | TypeScript strict + ESLint/Prettier + 最少单元测试 |

## 3. 推荐目录结构

```text
posturefit-hackathon/
  docs/
    development-framework.md
    contracts.md
    coze-contract.md
  public/
    demo-samples/
  src/
    app/
      App.tsx
      stepMachine.ts
    components/
      layout/
      ui/
    data/
      demoProfiles.ts
      exercises.ts
    features/
      analysis/
      camera/
      chat/
      history/
      onboarding/
      plan/
      pose/
    lib/
      ids.ts
      math.ts
      time.ts
    services/
      coach/
      storage/
    types/
      coach.ts
      posture.ts
      session.ts
      training.ts
    main.tsx
    styles.css
  tests/
```

## 4. 目录所有权

| 区域 | Owner | 职责 | 其他人改动规则 |
| --- | --- | --- | --- |
| `src/features/camera/` | 前端 A | 摄像头权限、实时预览、拍照、上传真实样例图 | 前端 B 只调用组件，不改采集逻辑 |
| `src/features/pose/` | 前端 A | MoveNet 加载、关键点识别、17 点归一 | 禁止 UI 组件直接依赖 MoveNet 原始输出 |
| `src/features/analysis/` | 前端 A | 角度计算、问题判定、骨架标注数据 | 阈值变化先同步 `types/posture.ts` 和测试 |
| `src/app/` | 前端 B | 单页向导状态机、主流程编排 | 其他人只通过约定回调接入 |
| `src/components/` | 前端 B | 通用 UI、布局、按钮、卡片、状态展示 | 可新增组件，避免修改已有公共 API |
| `src/features/onboarding/` | 前端 B | 教练风格、性别、目标、身体状态选择 | 字段必须使用共享类型 |
| `src/features/plan/` | 前端 B | 训练计划卡片、B 站链接展示 | 不在 UI 里写死动作选择规则 |
| `src/features/chat/` | 前端 B | 对话气泡、打卡按钮、反馈状态 | 只调用 CoachClient，不直接 fetch Coze |
| `src/features/history/` | 前端 B | 最近 10 条历史记录、P1 趋势入口 | 不改 storage 序列化格式 |
| `src/services/coach/` | 全栈 C | `MockCoachClient`、`CozeCoachClient`、统一 CoachClient 接口 | 前端只依赖接口 |
| `src/data/exercises.ts` | 全栈 C | 动作库、B 站搜索链接、动作适配规则 | 动作字段变化必须更新类型和 UI |
| `docs/coze-contract.md` | 全栈 C | Coze 输入输出、环境变量、Bot 配置说明 | 前端 B 根据文档接 UI |
| `src/types/` | 共同维护 | 共享契约 | 变更前必须同步所有 owner |
| `src/services/storage/` | 共同维护，前端 B 主责 | localStorage 读写、迁移 | 不允许业务模块直接操作 localStorage |
| `src/lib/` | 共同维护 | 纯函数工具 | 必须有测试或足够简单 |

## 5. 第 0 阶段：接口冻结

第 0 阶段必须在开发开始后 1 小时内完成。目标不是完美，而是让三人能并行开发。

交付物：

- `src/types/posture.ts`
- `src/types/training.ts`
- `src/types/coach.ts`
- `src/types/session.ts`
- `src/data/exercises.ts`
- `src/data/demoProfiles.ts`
- `src/services/coach/mockCoachClient.ts`
- `docs/contracts.md`

冻结规则：

1. 字段名一旦进入第 0 版，后续改名必须同步 owner。
2. UI 不直接发明字段，必须从 `types/` 引入。
3. Mock 数据必须覆盖完整主流程。
4. 所有 P0 模块先接 mock，再接真实实现。

## 6. 核心类型契约草案

### 6.1 姿态识别

```ts
export type CaptureSourceType = "camera" | "upload";
export type CaptureMode = "fullBody" | "halfBody" | "closeUp" | "sitting";

export type KeypointName =
  | "nose"
  | "leftEye"
  | "rightEye"
  | "leftEar"
  | "rightEar"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftWrist"
  | "rightWrist"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftAnkle"
  | "rightAnkle";

export type PoseKeypoint17 = {
  name: KeypointName;
  x: number;
  y: number;
  score: number;
};

export type PostureIssueType =
  | "forwardHead"
  | "roundedShoulder"
  | "anteriorPelvicTilt";

export type PostureSeverity = "normal" | "mild" | "moderate" | "severe";

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

### 6.2 训练计划

```ts
export type BodyState =
  | "normal"
  | "postpartum"
  | "menstrual"
  | "fatigued"
  | "teenager";

export type CoachStyle = "encouraging" | "strict" | "humorous";
export type CoachGender = "male" | "female";

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
  intensity: "low" | "medium";
};
```

### 6.3 教练服务

```ts
export type CoachMessageRole = "user" | "assistant";

export type CoachMessage = {
  id: string;
  role: CoachMessageRole;
  content: string;
  createdAt: string;
};

export type CheckInFeedback = "completed" | "tooTired";

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

### 6.4 会话持久化

```ts
export type PostureSessionStep =
  | "capture"
  | "analysis"
  | "profile"
  | "plan"
  | "chat";

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

## 7. 单页分步骤向导

不使用 React Router。`src/app/stepMachine.ts` 负责流程状态。

主步骤：

1. `capture`：选择拍摄模式，摄像头实时预览，拍照，上传真实样例图。
2. `analysis`：显示照片、骨架标注、角度、主要问题。
3. `profile`：选择教练风格、性别、目标、身体状态。
4. `plan`：显示结构化训练计划和教练首条话术。
5. `chat`：打卡反馈，CoachClient 根据“做完了 / 太累了”回复。

步骤推进规则：

- 没有 `imageDataUrl` 不能进入 `analysis`。
- 没有 `analysis` 不能进入 `profile`。
- 没有 `profile` 不能生成 `plan`。
- 没有 `plan` 不能进入 `chat`。
- 每次步骤变化都写入 storage。

## 8. 姿态识别与分析管线

统一管线：

```text
camera/upload image
→ load image/video element
→ MoveNet estimatePoses
→ normalize to PoseKeypoint17[]
→ calculate PostureAngleMetrics
→ classify PostureIssue[]
→ produce PostureAnalysisResult
→ render overlay
```

禁止事项：

- 禁止演示路径直接写死角度。
- 禁止 UI 直接读取 MoveNet 原始对象。
- 禁止 Coze 返回值覆盖本地角度计算结果。
- 禁止上传用户照片到业务后端。

演示输入策略：

- 主路径使用现场摄像头实时拍摄。
- 备用路径支持上传真实人体样例图。
- 两种输入共用同一个 `analyzePose(imageSource)` 管线。

## 9. 训练计划生成

训练计划由本地规则和动作库生成，保证结构稳定。

流程：

```text
PostureAnalysisResult
→ select primaryIssue
→ filter exercises by issueType and bodyState
→ choose 3 exercises
→ build TrainingPlan
→ CoachClient generates coach message
```

动作库要求：

- 每个体态问题至少 3 个动作。
- 每个动作必须有 B 站搜索链接。
- 产后、生理期、疲劳等身体状态可以降低强度或排除动作。
- UI 只展示 `TrainingPlan.exercises`，不自己选择动作。

## 10. Coze 双通道

默认使用 `MockCoachClient`，保证离线和演示稳定。

启用真实 Coze 的条件：

- 配置 `VITE_COZE_ENABLED=true`
- 配置必要的 API 地址、Bot ID、Token 或平台提供的接入参数
- `CozeCoachClient` 必须实现同一个 `CoachClient` 接口

运行策略：

- `MockCoachClient` 是 P0 必须完成项。
- `CozeCoachClient` 是 P0 对接项，但不能阻塞主流程。
- 若 Coze 调用失败，UI 显示错误并允许切回 mock。
- Coze 返回文本不作为动作卡片的数据源，只作为聊天话术。

## 11. localStorage 规范

storage key：

```text
posturefit.appState.v1
```

规则：

- 保存 `currentSessionId`。
- 保存最近 10 条 `sessions`。
- 每次写入前按 `updatedAt` 排序并裁剪。
- 所有读写集中在 `src/services/storage/`。
- 业务组件禁止直接调用 `localStorage`。
- 读取失败时回退到空状态，不能让页面崩溃。

## 12. 开发阶段计划

### 阶段 0：接口冻结，1 小时

Owner：三人一起，前端 B 主持。

- 创建 Vite + React + TS 项目。
- 配置 TypeScript strict、ESLint、Prettier、Tailwind、Vitest。
- 创建共享类型和 mock 数据。
- 创建 `docs/contracts.md`。

### 阶段 1：并行开发，6-8 小时

前端 A：

- 摄像头权限和预览。
- 图片上传输入。
- MoveNet 加载和识别。
- 17 点归一。
- 角度计算和问题判定。
- Canvas/Overlay 标注。
- 算法单元测试。

前端 B：

- 单页向导框架。
- 页面布局和视觉系统。
- 教练选择、目标、身体状态表单。
- 训练计划卡片。
- 聊天气泡和打卡按钮。
- history 简单列表。
- storage 接入。

全栈 C：

- 动作库。
- MockCoachClient。
- Coze Bot prompt 和工作流。
- CozeCoachClient 适配。
- `docs/coze-contract.md`。
- 可选 ArkClaw Skill 设计。

### 阶段 2：集成，4-5 小时

- 真实拍照进入分析页。
- 上传样例图进入同一分析页。
- 分析结果生成训练计划。
- CoachClient 输出聊天话术。
- 打卡反馈能生成回复。
- 刷新后能恢复当前会话。

### 阶段 3：演示打磨，3-4 小时

- 连续跑 3 次完整流程。
- 测 Chrome、Edge、Safari。
- 准备真实人体样例图。
- 准备 Coze 体验链接。
- 准备 3-5 分钟录屏。
- 修复移动端和投屏尺寸问题。

## 13. 代码规范

TypeScript：

- 开启 `strict`。
- 禁止 `any`，除非在 Coze 原始响应边界短暂使用并立即解析。
- 所有共享数据必须有显式类型。
- 纯函数优先，便于测试。

React：

- 组件文件使用 `PascalCase.tsx`。
- hooks 使用 `useXxx.ts`。
- 组件 props 必须定义 type。
- 页面状态由 `App.tsx` 和 `stepMachine.ts` 编排。
- 子组件通过 props 和回调通信，不直接改全局状态。

命名：

- 类型：`PostureAnalysisResult`、`TrainingPlan`。
- 函数：`calculateAngle`、`classifyPostureIssues`。
- 文件：业务组件用 PascalCase，工具和服务用 camelCase。
- storage key 和环境变量必须集中定义。

样式：

- Tailwind 处理主要布局。
- 摄像头、Canvas 叠层和聊天细节可写自定义 CSS。
- 不引入 Ant Design、MUI 等大型组件库。
- 图标使用 `lucide-react`。

## 14. 测试规范

最低测试范围：

- `calculateAngle` 三点夹角。
- 头前伸、圆肩、骨盆前倾阈值判定。
- 训练计划选择规则。
- bodyState 对动作过滤或强度的影响。
- localStorage 序列化和最多 10 条历史裁剪。
- MockCoachClient 输出 `CoachMessage`。

推荐命令：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

建议提供统一命令：

```bash
npm run verify
```

`verify` 串起 typecheck、lint、test、build。

## 15. Git 与协作规范

如果后续初始化 git，建议：

- `main` 保持可演示。
- 每个人开独立分支：
  - `feat/camera-pose`
  - `feat/ui-flow`
  - `feat/coach-client`
- 合并前必须跑 `npm run verify`。
- 每次合并只合一个模块，避免巨大冲突。
- 共享类型变更单独提交，并在群里说明影响。

提交信息建议：

```text
feat(camera): add camera capture flow
feat(pose): normalize MoveNet keypoints
feat(chat): add check-in feedback UI
test(analysis): cover posture thresholds
docs(coze): document coach client contract
```

## 16. 风险与兜底

| 风险 | 影响 | 兜底 |
| --- | --- | --- |
| 摄像头权限失败 | 无法拍摄 | 支持上传真实人体样例图 |
| MoveNet 加载慢 | 演示等待 | 进入页面后预加载模型，显示加载状态 |
| 现场光线差 | 识别不准 | 准备样例图，提示拍摄姿势 |
| Coze 不稳定 | 无法生成话术 | 默认 MockCoachClient |
| 返回文本不可解析 | UI 崩溃 | 结构化计划只来自本地动作库 |
| localStorage 脏数据 | 页面崩溃 | storage 层 try/catch 并重置 |
| 三人改同一文件 | 冲突 | 强目录所有权，类型变更先沟通 |

## 17. 集成验收清单

P0 完成标准：

- [ ] Vite 应用能启动。
- [ ] 摄像头能正常预览和拍照。
- [ ] 可以上传真实人体样例图。
- [ ] MoveNet 能输出 17 个归一关键点。
- [ ] 三个角度能计算并显示。
- [ ] 体态问题能判定并标注。
- [ ] 用户能选择教练风格、性别、目标、身体状态。
- [ ] 本地动作库能生成 3 个动作训练计划。
- [ ] 每个动作有 B 站搜索链接。
- [ ] MockCoachClient 能生成教练话术。
- [ ] 打卡“做完了 / 太累了”能得到回复。
- [ ] localStorage 刷新不丢当前会话。
- [ ] 最近 10 条历史记录可见。
- [ ] `npm run verify` 通过。
- [ ] Chrome 连续演示 3 次无崩溃。

## 18. 对接原则

1. 先对类型，不先对页面。
2. 前端 A 输出 `PostureAnalysisResult`，不关心训练计划和聊天。
3. 前端 B 消费 `PostureSession`、`TrainingPlan`、`CoachMessage`，不关心 MoveNet 原始对象。
4. 全栈 C 实现 `CoachClient` 和动作库，不直接改 UI 流程。
5. Coze 是增强通道，不是主流程单点依赖。
6. 演示输入可以来自摄像头或样例图，但分析管线必须相同。
7. 所有共享字段变化必须先改 `types/`，再改实现。

