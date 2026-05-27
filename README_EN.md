<div align="center">

**[中文](./README.md)** | **English**

</div>

---

<div align="center">

<img src="./assets/logo.png" alt="PostureFit Logo" width="120" />

# PostureFit — AI Posture Correction Coach

**Your Personal AI Posture Correction Companion**

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-BlazePose-FF6F00?logo=google)](https://mediapipe.dev/)
[![Coze](https://img.shields.io/badge/Coze-AI_Agent-0084FF)](https://www.coze.com/)

</div>

---

## About

PostureFit is an AI-powered posture correction web application that combines **computer vision** with an **intelligent coaching agent**. Users simply take a photo (full-body, half-body, or close-up), and the system uses **MediaPipe BlazePose** to detect 33 body keypoints in real-time, analyzing **10 types of posture issues** — from forward head posture to pelvic tilt. A Coze AI coach then generates personalized daily training plans tailored to the user's specific needs.

> Addressing posture health for 400M+ sedentary workers — making professional posture correction accessible, personalized, and sustainable.

---

## Features

| Feature | Description |
|---------|-------------|
| **AI Posture Analysis** | MediaPipe BlazePose 33-keypoint model, completes detection and angle calculation within 2 seconds |
| **10 Issue Detection** | Forward head, rounded shoulders, anterior pelvic tilt, shoulder imbalance, pelvic tilt, knee valgus, head offset, center of gravity shift, hunchback, knee hyperextension |
| **Dual-View Analysis** | Front + side view capture with automatic combined analysis |
| **4 Capture Modes** | Full body / Half body / Close-up / Sitting — adapts to different scenarios |
| **AI Coach Customization** | 3 coaching styles (Encouraging / Strict / Humorous), 6 coach personas |
| **Personalized Training Plans** | Coze AI Agent generates daily 3-exercise plans based on posture data, body state, and user goals |
| **77 Exercise Library** | Covers 10 posture issue categories, each exercise with Bilibili tutorial video links |
| **Session Memory** | "Swap exercises" feature with deduplication to avoid repeating previously recommended exercises |
| **Check-in Feedback** | "Done" / "Too tired" feedback mechanism — AI dynamically adjusts subsequent plans |
| **Posture Score** | Gaussian decay-based composite scoring (0-100), with front/side sub-scores |
| **Dreamy UI** | Liquid glass style, gradient floating bubbles, frosted glass effects, immersive interface |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                     │
│  Vite + React 18 + TypeScript + Tailwind CSS             │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ CameraCapture │  │ PoseDetection│  │ PostureAnalyze│  │
│  │ Camera/Upload │→│ MediaPipe    │→│ Angle Calc +  │   │
│  │              │  │ BlazePose 33 │  │ 10-Issue Scan │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  ProfileForm  │→│  CoachChat   │→│  PlanView     │   │
│  │ Coach + Goals │  │ AI Coach Chat│  │ Training Plan │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ SSE Streaming
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Coze AI Agent (Backend)                      │
│                                                          │
│  Workflow: posture_plan_workflow                          │
│  ├─ Node A: Exercise Matching (Code — 77-exercise library)│
│  ├─ Node B: Score Processing (Code — Front 60% + Side 40%)│
│  ├─ Node C: Plan Generation (LLM — Styled Output)        │
│  └─ Node D: Feedback Handling (LLM — Check-in Response)  │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Posturefit/
├── assets/                          # Static assets (logo, coach avatars, backgrounds)
├── docs/                            # Project documentation
│   ├── MediaPipe_BlazePose_技术文档.md
│   ├── PostureFit_项目说明书.md
│   ├── contracts.md                 # API contract docs
│   └── coze-parameter-spec.md       # Coze parameter spec
├── public/                          # Public static files
├── src/
│   ├── app/
│   │   └── stepMachine.ts           # Step state machine (capture→analysis→profile→chat)
│   ├── components/
│   │   ├── AnalysisLoader.tsx       # Analysis loading animation
│   │   ├── ScoreRing.tsx            # Posture score ring chart
│   │   └── StepIndicator.tsx        # Step navigation indicator
│   ├── data/
│   │   ├── exercises.ts             # Exercise data (77 exercises)
│   │   └── demoProfiles.ts          # Demo coach configurations
│   ├── features/
│   │   ├── analysis/                # Posture analysis module
│   │   │   ├── angleCalculator.ts   # Angle calculation (10 posture angles)
│   │   │   ├── postureAnalyzer.ts   # Posture analyzer (single + dual-view merge)
│   │   │   ├── postureClassifier.ts # Issue classifier + Gaussian decay scoring
│   │   │   ├── drawSkeleton.ts      # Skeleton drawing
│   │   │   ├── SkeletonOverlay.tsx  # Skeleton overlay component
│   │   │   └── CombinedAnalysisView.tsx  # Combined analysis view
│   │   ├── camera/                  # Camera module
│   │   │   ├── CameraCapture.tsx    # Photo capture component
│   │   │   ├── ImageUploader.tsx    # Image upload component
│   │   │   └── useCameraAccess.ts   # Camera access hook
│   │   ├── chat/                    # AI coach chat module
│   │   │   ├── CoachChat.tsx        # Chat interface
│   │   │   ├── MarkdownMessage.tsx  # Markdown renderer
│   │   │   ├── exerciseBlock.ts     # Exercise block parser
│   │   │   └── SessionSummaryPanel.tsx  # Session summary panel
│   │   ├── history/                 # History records
│   │   │   ├── HistoryRail.tsx      # History sidebar
│   │   │   └── SessionSidebar.tsx   # Session sidebar
│   │   ├── landing/                 # Landing page
│   │   │   └── LandingPage.tsx      # Landing page (liquid glass style)
│   │   ├── onboarding/              # User configuration
│   │   │   └── ProfileForm.tsx      # Coach selection + goal input
│   │   ├── plan/                    # Training plan
│   │   │   ├── PlanView.tsx         # Plan display
│   │   │   └── generateTrainingPlan.ts  # Local plan generation
│   │   └── pose/                    # Pose detection
│   │       ├── poseDetector.ts      # MediaPipe detector wrapper
│   │       ├── usePoseDetection.ts  # Pose detection hook
│   │       └── normalizeKeypoints.ts # Keypoint normalization
│   ├── lib/                         # Utility functions
│   │   ├── math.ts                  # Math (vectors, angles)
│   │   ├── ids.ts                   # ID generation
│   │   ├── storage.ts               # localStorage wrapper
│   │   ├── time.ts                  # Time utilities
│   │   └── sessionAnalysis.ts       # Session analysis tools
│   ├── services/
│   │   ├── coach/                   # AI coach service
│   │   │   ├── cozeCoachClient.ts   # Coze API client (SSE streaming)
│   │   │   ├── mockCoachClient.ts   # Mock client (offline fallback)
│   │   │   └── resilientCoachClient.ts  # Resilient client (auto-degrade)
│   │   └── storage/
│   │       └── sessionStorage.ts    # Session persistence
│   ├── types/
│   │   └── index.ts                 # Global type definitions
│   ├── App.tsx                      # Main app component
│   └── main.tsx                     # Entry point
├── api/                             # API proxy (Netlify Functions)
├── netlify/                         # Netlify serverless functions
├── netlify.toml                     # Netlify deployment config
├── vite.config.ts                   # Vite config (with Coze proxy)
├── tailwind.config.js               # Tailwind config (custom color system)
├── tsconfig.json                    # TypeScript config
└── vitest.config.ts                 # Test config
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Posturefit.git
cd Posturefit

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional, for direct Coze API connection)
cp .env.example .env
# Edit .env with your Coze Token and Project ID

# 4. Start development server
npm run dev
```

Visit `http://localhost:5173` to try it out.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_COZE_TOKEN` | Dev only | Coze API Token (JWT format) |
| `VITE_COZE_PROJECT_ID` | Dev only | Coze Project ID |
| `VITE_COZE_ENDPOINT` | No | Coze API endpoint (default: `https://8f9jzqp2mk.coze.site/stream_run`) |
| `VITE_COZE_PROXY_ENDPOINT` | No | Proxy endpoint (default: `/api/coze/stream_run`) |

### Build & Deploy

```bash
# Build for production
npm run build

# Preview build output
npm run preview

# Run tests
npm test

# Full verification (type check + lint + test + build)
npm run verify
```

---

## Core Workflow

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Capture │ →  │ Analysis │ →  │ Profile  │ →  │   Chat   │
└─────────┘    └──────────┘    └──────────┘    └──────────┘
 Camera/Upload   MediaPipe       Style+Goal      Training Plan
 Front/Side      33 Keypoints    Body State      Check-in Feedb.
 Capture Mode    10 Issues       Coach Gender    Swap Exercises
```

### Posture Issue Detection

| Issue Type | View | Normal | Mild | Moderate | Severe |
|-----------|------|--------|------|----------|--------|
| Forward Head (CVA) | Front | >=50° | 45-50° | 40-45° | <40° |
| Shoulder Imbalance | Front | <2° | 2-5° | 5-12° | >12° |
| Pelvic Tilt | Front | <2° | 2-5° | 5-12° | >12° |
| Knee Valgus | Front | <5° | 5-10° | 10-15° | >15° |
| Head Offset | Front | <3° | 3-5° | 5-8° | >8° |
| Center of Gravity Shift | Front | <3° | 3-5° | 5-8° | >8° |
| Rounded Shoulder | Side | <20° | 20-25° | 25-30° | >30° |
| Anterior Pelvic Tilt | Side | 5-15° | <5° or 15-20° | 20-25° | >25° |
| Hunchback | Side | <3° | 3-5° | 5-8° | >8° |
| Knee Hyperextension | Side | 170-185° | 165-170° | 160-165° | <160° |

### Scoring Algorithm

- **Gaussian Decay Scoring**: Each issue is mapped to a 0-100 score based on deviation from normal range using a Gaussian function
- **View Normalization**: Front 6 metrics weighted at 60%, Side 4 metrics weighted at 40%
- **Final Score** = Front Normalized Score x 0.6 + Side Normalized Score x 0.4

---

## Coze AI Agent Integration

PostureFit uses the **Coze AI Agent Platform** for its intelligent coaching capabilities. The frontend sends structured JSON posture analysis results to a Coze workflow, which generates personalized training plans using a built-in 77-exercise library and coach-style prompts.

### Workflow Architecture

```
Start → Condition Branch (mode)
         ├─ mode=plan     → Exercise Match (Code) → Score Processing (Code) → Plan Gen (LLM) → End
         └─ mode=feedback → Feedback Handling (LLM) → End
```

### Coaching Styles

| Style | Coach Name | Personality |
|-------|-----------|-------------|
| Encouraging | Coach Lin / Coach Wang | Warm and supportive, accompanies your progress |
| Strict | Coach Zhang / Coach Lee | Professional and demanding, results-oriented |
| Humorous | Coach Xiao Mei / Coach Jie | Fun and lighthearted, makes fitness enjoyable |

### Body State Adaptation

- **Normal**: No restrictions
- **Postpartum**: Automatically filters contraindicated exercises (prone positions, abdominal pressure, etc.)
- **Menstrual**: Avoids high-intensity and abdominal pressure exercises
- **Fatigued**: All exercise durations halved, prioritizes low-intensity
- **Teenager**: All exercises available (all are bodyweight-only, no equipment needed)

> For detailed Coze Agent setup guide, see [Coze Agent Manual](./docs/PostureFit_Coze_Agent_实操手册.md)

---

## Design Highlights

- **Liquid Glass Style**: Frosted glass backgrounds, gradient floating bubbles, light refraction effects
- **Dreamy Gradient Palette**: Pink (blush) + Purple (mist) + Sky Blue (sky) triple gradient
- **Micro-interaction Animations**: Floating bubbles, twinkling stars, glow pulses via CSS animations
- **Responsive Layout**: Adapts to desktop and mobile viewports
- **Lora + PingFang Typography**: Serif + sans-serif mixed typesetting, elegant and readable

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

Test coverage includes:
- Angle calculation functions (`angleCalculator.test.ts`)
- Posture classifier (`postureClassifier.test.ts`)
- Keypoint normalization (`normalizeKeypoints.test.ts`)
- Training plan generation (`generateTrainingPlan.test.ts`)
- Coze client parsing (`cozeCoachClient.test.ts`)
- Session storage (`sessionStorage.test.ts`)
- Component tests (`App.test.tsx`, `LandingPage.test.tsx`)

---

## Documentation

- [Product Requirements (PRD)](./PostureFit_PRD_v3.0_Hackathon.md) — Complete product specification
- [Coze Agent Manual](./docs/PostureFit_Coze_Agent_实操手册.md) — Coze workflow setup guide
- [MediaPipe Technical Doc](./docs/MediaPipe_BlazePose_体态识别替换技术文档.md) — Pose detection technical details
- [API Contracts](./docs/contracts.md) — Frontend-backend interface definitions
- [Coze Parameter Spec](./docs/coze-parameter-spec.md) — Coze API parameter documentation

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | React 18 + TypeScript 5.6 |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3.4 |
| **Routing** | React Router 6 |
| **Icons** | Lucide React |
| **AI Model** | MediaPipe BlazePose (Tensorflow.js) |
| **AI Coach** | Coze AI Agent (GPT-4o / Doubao) |
| **Deployment** | Netlify (Static Site + Serverless Functions) |
| **Testing** | Vitest + Testing Library + jsdom |

---

## Competition Entry

This project is submitted to the **Volcano Cup Agent Innovation Contest · Lifestyle Track · Sports Sub-track**.

| Material | Status |
|----------|--------|
| Project Documentation | `PostureFit_PRD_v3.0_Hackathon.md` |
| Coze Experience Link | Configured |
| Source Code | This repository |
| Deployment Link | Netlify deployment |

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

**PostureFit** — Making professional posture correction accessible to everyone

Made with ❤️ for the Volcano Cup Agent Innovation Contest

</div>
