<div align="center">

**[English](./README_EN.md)** | **中文**

</div>

---

<div align="center">

<img src="./assets/logo.png" alt="PostureFit Logo" width="120" />

# PostureFit — AI 体态矫正运动教练

**你的专属 AI 体态矫正运动搭子**

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-BlazePose-FF6F00?logo=google)](https://mediapipe.dev/)
[![Coze](https://img.shields.io/badge/Coze-AI_Agent-0084FF)](https://www.coze.com/)

</div>

---

## 📖 项目简介

PostureFit 是一款基于 **AI 视觉识别 + Coze 智能体** 的体态矫正 Web 应用。用户只需拍摄一张全身/半身照片，系统即可通过 **MediaPipe BlazePose** 模型实时检测 33 个人体关键点，分析出 **10 种体态问题**（头前伸、圆肩、骨盆前倾、高低肩等），并由 Coze AI 教练生成个性化的每日训练计划。

> 解决 4 亿+久坐人群的体态健康问题——让专业体态矫正变得可及、个性化、可持续。

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| **AI 体态识别** | 基于 MediaPipe BlazePose 33 点模型，2 秒内完成关键点检测与角度计算 |
| **10 种问题检测** | 头前伸、圆肩、骨盆前倾、高低肩、骨盆侧倾、膝内扣、头部偏移、重心偏移、驼背倾向、膝超伸 |
| **双视角分析** | 支持正面 + 侧面双视角拍摄，自动合并分析结果 |
| **4 种拍摄模式** | 全身 / 半身 / 局部特写 / 坐姿，适配不同场景 |
| **AI 教练定制** | 3 种教练风格（鼓励型 / 严厉型 / 幽默型），6 位教练角色 |
| **个性化训练计划** | Coze AI Agent 根据体态数据、身体状态、用户目标生成每日 3 动作训练计划 |
| **77 个训练动作** | 覆盖 10 类体态问题，每个动作附带 B 站跟练视频链接 |
| **会话记忆** | 支持「换一组训练」去重，避免重复推荐已做过的动作 |
| **训练打卡** | 「做完了」/「太累了」反馈机制，AI 动态调整后续计划 |
| **体态评分** | 基于高斯衰减算法的综合评分（0-100），支持正面/侧面分项评分 |
| **梦幻 UI** | 液态玻璃风格、渐变浮泡动画、毛玻璃特效的沉浸式界面 |

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器（前端）                       │
│  Vite + React 18 + TypeScript + Tailwind CSS             │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  CameraCapture│  │ PoseDetection│  │  PostureAnalyze│  │
│  │  摄像头/上传   │→│ MediaPipe    │→│  角度计算+分类  │   │
│  │              │  │ BlazePose33  │  │  10种问题检测  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  ProfileForm  │→│  CoachChat   │→│  PlanView     │   │
│  │  教练选择+目标 │  │  AI教练对话   │  │  训练计划展示  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ SSE 流式请求
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Coze AI Agent（智能体后端）                    │
│                                                          │
│  工作流: posture_plan_workflow                             │
│  ├─ 节点A: 动作匹配（Code 节点 — 77 动作库精确匹配）       │
│  ├─ 节点B: 评分处理（Code 节点 — 正面60% + 侧面40%）       │
│  ├─ 节点C: 计划生成（LLM 节点 — 风格化输出）               │
│  └─ 节点D: 反馈处理（LLM 节点 — 打卡响应）                │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
Posturefit/
├── assets/                          # 静态资源（logo、教练头像、背景图）
├── docs/                            # 项目文档
│   ├── MediaPipe_BlazePose_体态识别替换技术文档.md
│   ├── PostureFit_火山杯黑客松项目说明书.md
│   ├── contracts.md                 # 接口契约文档
│   └── coze-parameter-spec.md       # Coze 参数规范
├── public/                          # 公共静态资源
├── src/
│   ├── app/
│   │   └── stepMachine.ts           # 步骤状态机（capture→analysis→profile→chat）
│   ├── components/
│   │   ├── AnalysisLoader.tsx       # 分析加载动画
│   │   ├── ScoreRing.tsx            # 体态评分环形图
│   │   └── StepIndicator.tsx        # 步骤导航指示器
│   ├── data/
│   │   ├── exercises.ts             # 训练动作数据（77 个动作）
│   │   └── demoProfiles.ts          # 演示用教练配置
│   ├── features/
│   │   ├── analysis/                # 体态分析模块
│   │   │   ├── angleCalculator.ts   # 角度计算（10 种体态角度）
│   │   │   ├── postureAnalyzer.ts   # 体态分析器（单视角+双视角合并）
│   │   │   ├── postureClassifier.ts # 问题分类 + 高斯衰减评分
│   │   │   ├── drawSkeleton.ts      # 骨骼绘制
│   │   │   ├── SkeletonOverlay.tsx  # 骨骼覆盖层组件
│   │   │   └── CombinedAnalysisView.tsx  # 合并分析视图
│   │   ├── camera/                  # 摄像头模块
│   │   │   ├── CameraCapture.tsx    # 拍照组件
│   │   │   ├── ImageUploader.tsx    # 图片上传组件
│   │   │   └── useCameraAccess.ts   # 摄像头 Hook
│   │   ├── chat/                    # AI 教练对话模块
│   │   │   ├── CoachChat.tsx        # 聊天界面
│   │   │   ├── MarkdownMessage.tsx  # Markdown 渲染
│   │   │   ├── exerciseBlock.ts     # 训练动作解析
│   │   │   └── SessionSummaryPanel.tsx  # 会话摘要面板
│   │   ├── history/                 # 历史记录
│   │   │   ├── HistoryRail.tsx      # 历史侧边栏
│   │   │   └── SessionSidebar.tsx   # 会话侧边栏
│   │   ├── landing/                 # 首页
│   │   │   └── LandingPage.tsx      # 落地页（液态玻璃风格）
│   │   ├── onboarding/              # 用户配置
│   │   │   └── ProfileForm.tsx      # 教练选择 + 目标输入
│   │   ├── plan/                    # 训练计划
│   │   │   ├── PlanView.tsx         # 计划展示
│   │   │   └── generateTrainingPlan.ts  # 本地训练计划生成
│   │   └── pose/                    # 姿态检测
│   │       ├── poseDetector.ts      # MediaPipe 检测器封装
│   │       ├── usePoseDetection.ts  # 姿态检测 Hook
│   │       └── normalizeKeypoints.ts # 关键点归一化
│   ├── lib/                         # 工具函数
│   │   ├── math.ts                  # 数学计算（向量、角度）
│   │   ├── ids.ts                   # ID 生成
│   │   ├── storage.ts               # localStorage 封装
│   │   ├── time.ts                  # 时间工具
│   │   └── sessionAnalysis.ts       # 会话分析工具
│   ├── services/
│   │   ├── coach/                   # AI 教练服务
│   │   │   ├── cozeCoachClient.ts   # Coze API 客户端（SSE 流式）
│   │   │   ├── mockCoachClient.ts   # Mock 客户端（离线兜底）
│   │   │   └── resilientCoachClient.ts  # 弹性客户端（自动降级）
│   │   └── storage/
│   │       └── sessionStorage.ts    # 会话持久化
│   ├── types/
│   │   └── index.ts                 # 全局类型定义
│   ├── App.tsx                      # 主应用组件
│   └── main.tsx                     # 入口文件
├── api/                             # API 代理（Netlify Functions）
├── netlify/                         # Netlify 服务端函数
├── netlify.toml                     # Netlify 部署配置
├── vite.config.ts                   # Vite 配置（含 Coze 代理）
├── tailwind.config.js               # Tailwind 配置（自定义色系）
├── tsconfig.json                    # TypeScript 配置
└── vitest.config.ts                 # 测试配置
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/Posturefit.git
cd Posturefit

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选，用于直连 Coze API）
cp .env.example .env
# 编辑 .env，填入 Coze Token 和 Project ID

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可体验。

### 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `VITE_COZE_TOKEN` | 开发环境 | Coze API Token（JWT 格式） |
| `VITE_COZE_PROJECT_ID` | 开发环境 | Coze 项目 ID |
| `VITE_COZE_ENDPOINT` | 否 | Coze API 端点（默认: `https://8f9jzqp2mk.coze.site/stream_run`） |
| `VITE_COZE_PROXY_ENDPOINT` | 否 | 代理端点（默认: `/api/coze/stream_run`） |

### 构建与部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行测试
npm test

# 完整验证（类型检查 + Lint + 测试 + 构建）
npm run verify
```

---

## 🔄 核心流程

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  拍摄    │ →  │  体态分析  │ →  │  教练选择  │ →  │  AI对话   │
│  capture │    │ analysis │    │ profile  │    │   chat   │
└─────────┘    └──────────┘    └──────────┘    └──────────┘
  摄像头/上传     MediaPipe       风格+目标       训练计划
  正面/侧面       33点检测        身体状态        打卡反馈
  拍摄模式        10种问题        教练性别        换一组训练
```

### 体态问题检测

| 问题类型 | 视角 | 正常范围 | 轻度 | 中度 | 严重 |
|---------|------|---------|------|------|------|
| 头前伸 (CVA角) | 正面 | >=50° | 45-50° | 40-45° | <40° |
| 高低肩 | 正面 | <2° | 2-5° | 5-12° | >12° |
| 骨盆侧倾 | 正面 | <2° | 2-5° | 5-12° | >12° |
| 膝内扣 | 正面 | <5° | 5-10° | 10-15° | >15° |
| 头部偏移 | 正面 | <3° | 3-5° | 5-8° | >8° |
| 重心偏移 | 正面 | <3° | 3-5° | 5-8° | >8° |
| 圆肩 | 侧面 | <20° | 20-25° | 25-30° | >30° |
| 骨盆前倾 | 侧面 | 5-15° | <5°或15-20° | 20-25° | >25° |
| 驼背倾向 | 侧面 | <3° | 3-5° | 5-8° | >8° |
| 膝超伸 | 侧面 | 170-185° | 165-170° | 160-165° | <160° |

### 综合评分算法

- **高斯衰减评分**：每个问题根据偏离正常范围的程度，通过高斯函数映射到 0-100 分
- **视图归一化**：正面 6 项权重 60%，侧面 4 项权重 40%
- **最终评分** = 正面归一化分 × 0.6 + 侧面归一化分 × 0.4

---

## 🤖 Coze AI Agent 集成

PostureFit 通过 **Coze 智能体平台** 实现 AI 教练功能。前端将体态分析结果以结构化 JSON 发送给 Coze 工作流，Coze 根据内置的 77 个动作库和教练风格 Prompt 生成个性化训练计划。

### 工作流架构

```
Start → 条件分支(mode)
         ├─ mode=plan   → 动作匹配(Code) → 评分处理(Code) → 计划生成(LLM) → End
         └─ mode=feedback → 反馈处理(LLM) → End
```

### 教练风格

| 风格 | 教练名 | 特点 |
|------|--------|------|
| 鼓励型 | 小林教练 / 小王教练 | 温柔鼓励，陪你一起进步 |
| 严厉型 | 张教练 / 李教练 | 严格专业，追求效果 |
| 幽默型 | 小美教练 / 阿杰教练 | 轻松幽默，快乐健身 |

### 身体状态适配

- **正常 (normal)**：无限制
- **产后 (postpartum)**：自动过滤禁忌动作（俯卧位、腹部受压等）
- **经期 (menstrual)**：避免高强度和腹部受压动作
- **疲劳 (fatigued)**：所有动作时长减半，优先低强度
- **青少年 (teenager)**：全部可用（均为无器械自重训练）

> 详细的 Coze Agent 搭建指南请参考 [Coze Agent 实操手册](./docs/PostureFit_Coze_Agent_实操手册.md)

---

## 🎨 设计特色

- **液态玻璃风格**：毛玻璃背景、渐变浮泡、光影折射效果
- **梦幻渐变色系**：粉色 (blush) + 紫色 (mist) + 天蓝 (sky) 三色渐变
- **微交互动画**：浮泡漂浮、星光闪烁、光晕脉冲等 CSS 动画
- **响应式布局**：适配桌面端和移动端
- **Lora + 苹方字体**：衬线 + 无衬线混排，优雅易读

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 覆盖率报告
npm test -- --coverage
```

测试覆盖：
- 角度计算函数 (`angleCalculator.test.ts`)
- 体态分类器 (`postureClassifier.test.ts`)
- 关键点归一化 (`normalizeKeypoints.test.ts`)
- 训练计划生成 (`generateTrainingPlan.test.ts`)
- Coze 客户端解析 (`cozeCoachClient.test.ts`)
- 会话存储 (`sessionStorage.test.ts`)
- 组件测试 (`App.test.tsx`, `LandingPage.test.tsx`)

---

## 📄 相关文档

- [项目说明书](./docs/PostureFit_PRD.md) — 完整的产品需求文档
- [Coze Agent 实操手册](./docs/PostureFit_Coze_Agent_实操手册.md) — Coze 工作流搭建指南
- [MediaPipe 技术文档](./docs/MediaPipe_BlazePose_体态识别替换技术文档.md) — 姿态检测技术方案
- [接口契约](./docs/contracts.md) — 前后端接口定义
- [Coze 参数规范](./docs/coze-parameter-spec.md) — Coze API 参数说明

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | React 18 + TypeScript 5.6 |
| **构建工具** | Vite 5 |
| **样式方案** | Tailwind CSS 3.4 |
| **路由** | React Router 6 |
| **图标** | Lucide React |
| **AI 模型** | MediaPipe BlazePose (TensorFlow.js) |
| **AI 教练** | Coze AI Agent（GPT-4o / 豆包） |
| **部署** | Vercel（静态站点 + Serverless Functions） |
| **测试** | Vitest + Testing Library + jsdom |

## 📝 许可证

本项目采用 [MIT License](./LICENSE) 开源许可证。

---

<div align="center">

**PostureFit** — 让每个人都拥有专业体态矫正教练

Made with ❤️ for 火山杯 Agent 创新大赛

</div>
