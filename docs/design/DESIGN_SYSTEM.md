# PostureFit 设计重构文档

> 版本 1.0 | 日期：2026-05-24
> 风格定位：梦幻极简主义 · 粉彩 · 玻璃拟态 · 彩虹光泽

---

## 1. 设计愿景

### 1.1 核心美学

PostureFit 整体设计风格定义为 **「梦幻极简主义」**（Dreamy Minimalism），融合以下视觉元素：

| 视觉主题 | 描述 | 视觉参考 |
|---------|------|---------|
| **粉彩梦境** | 柔和的粉紫色调，营造温柔、治愈的氛围 | 主色调 |
| **薄雾朦胧** | 渐变模糊背景，模拟清晨薄雾效果 | 背景层 |
| **镜面水映** | 地面如镜面般反射上方元素 | 底部装饰 |
| **彩虹光泽** | 气泡和按钮呈现珍珠般的彩虹折射 | 高光元素 |
| **建筑拱门** | 简约的拱形和矩形开口结构 | 框架装饰 |

### 1.2 情绪板关键词

```
Ethereal · Soft · Dreamy · Minimal · Fluid · Serene · Luminous · Iridescent
```

### 1.3 设计原型参考

根据用户提供的设计描述：
- 中央：女性瑜伽人物（鸽子式姿态）置于镜面水面上
- 周围：漂浮的彩虹气泡，内含功能图标和中文文字
- 整体：柔和漫射光，粉紫色调，建筑拱门框架

---

## 2. 色彩系统

### 2.1 主色板 — 粉彩玫瑰（Pastel Rose）

```css
/* 主色调：粉紫色系 */
:root {
  /* 粉紫色阶 (Rose/Mauve) */
  --color-blush-50:  #fdf2f8;   /* 最浅：背景高亮 */
  --color-blush-100: #fce7f3;   /* 浅色卡片 */
  --color-blush-200: #fbcfe8;   /* 边框亮色 */
  --color-blush-300: #f9a8d4;   /* 主色调浅 */
  --color-blush-400: #f472b6;   /* 主色调 */
  --color-blush-500: #ec4899;   /* 深色调 */
  --color-blush-600: #db2777;   /* 最深：强调 */

  /* 薄雾紫 (Mist Lavender) */
  --color-mist-50:   #faf5ff;
  --color-mist-100:  #f3e8ff;
  --color-mist-200:  #e9d5ff;
  --color-mist-300:  #d8b4fe;
  --color-mist-400:  #c084fc;
  --color-mist-500:  #a855f7;

  /* 天空粉 (Sky Blush) */
  --color-sky-50:    #f0f9ff;
  --color-sky-100:   #e0f2fe;
  --color-sky-200:   #bae6fd;
  --color-sky-300:   #7dd3fc;

  /* 核心品牌色 */
  --color-primary:       var(--color-blush-400);
  --color-primary-light:  var(--color-blush-300);
  --color-primary-dark:   var(--color-blush-500);
  --color-accent:         var(--color-mist-300);

  /* 彩虹光泽渐变 (气泡高光) */
  --iridescent-1: #f472b6;  /* 粉色 */
  --iridescent-2: #c084fc;  /* 紫色 */
  --iridescent-3: #7dd3fc;  /* 蓝色 */
  --iridescent-4: #4ade80;  /* 绿色 */
  --iridescent-5: #facc15;  /* 黄色 */
}
```

### 2.2 文字颜色

```css
:root {
  /* 深色文字 - 保持可读性 */
  --color-text-primary:   #1e1b4b;   /* 深紫黑色：主要文字 */
  --color-text-secondary: #4c1d6e;   /* 深紫色：次要文字 */
  --color-text-muted:     #7c3a8a;   /* 中等紫色：辅助文字 */

  /* 浅色文字 - 用于深色背景 */
  --color-text-light:     #fdf2f8;
  --color-text-lighter:   rgba(253, 242, 248, 0.8);

  /* 文字透明度变体 */
  --color-text-90: rgba(30, 27, 75, 0.9);
  --color-text-70: rgba(30, 27, 75, 0.7);
  --color-text-50: rgba(30, 27, 75, 0.5);
}
```

### 2.3 背景与层级

```css
:root {
  /* 渐变背景 */
  --gradient-blush:    linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%);
  --gradient-mist:     linear-gradient(180deg, #faf5ff 0%, #fdf2f8 100%);
  --gradient-hero:     linear-gradient(180deg, #faf5ff 0%, #fce7f3 40%, #bae6fd 100%);

  /* 镜面水效果 */
  --gradient-water:    linear-gradient(180deg, rgba(186, 230, 253, 0.3) 0%, rgba(249, 168, 212, 0.2) 100%);

  /* 玻璃拟态背景 */
  --glass-white:       rgba(255, 255, 255, 0.7);
  --glass-blush:       rgba(252, 231, 243, 0.6);
  --glass-mist:        rgba(250, 245, 255, 0.5);

  /* 阴影 */
  --shadow-soft:       0 4px 20px rgba(167, 139, 250, 0.15);
  --shadow-bubble:      0 8px 32px rgba(196, 132, 252, 0.25), 0 0 60px rgba(244, 114, 182, 0.15);
  --shadow-glow:        0 0 40px rgba(244, 114, 182, 0.4);
}
```

### 2.4 Tailwind 配置扩展

```javascript
// tailwind.config.js 扩展
module.exports = {
  theme: {
    extend: {
      colors: {
        blush: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        mist: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
        },
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
        },
      },
      backgroundImage: {
        'gradient-blush':   'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%)',
        'gradient-hero':     'linear-gradient(180deg, #faf5ff 0%, #fce7f3 40%, #bae6fd 100%)',
        'gradient-water':    'linear-gradient(180deg, rgba(186, 230, 253, 0.3) 0%, rgba(249, 168, 212, 0.2) 100%)',
      },
      boxShadow: {
        'bubble':   '0 8px 32px rgba(196, 132, 252, 0.25), 0 0 60px rgba(244, 114, 182, 0.15)',
        'glow':     '0 0 40px rgba(244, 114, 182, 0.4)',
        'soft':     '0 4px 20px rgba(167, 139, 250, 0.15)',
        'card':     '0 8px 30px rgba(219, 39, 119, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
}
```

---

## 3. 字体系统

### 3.1 字体选择

| 用途 | 字体 | 备选 | 字重范围 |
|-----|------|------|---------|
| **品牌标题** | Lora (衬线) | Georgia, serif | 400-700 |
| **中文正文** | Noto Sans SC | 无 | 300-700 |
| **英文正文** | Raleway | system-ui | 300-600 |
| **数字强调** | DM Sans | sans-serif | 500-700 |

### 3.2 字体大小比例

```css
:root {
  /* 标题层级 */
  --text-hero:    3.5rem;    /* 56px - 首页主标题 */
  --text-h1:      2.5rem;    /* 40px - 页面大标题 */
  --text-h2:      1.875rem;   /* 30px - 区块标题 */
  --text-h3:      1.5rem;     /* 24px - 卡片标题 */
  --text-h4:      1.25rem;    /* 20px - 小标题 */

  /* 正文字级 */
  --text-lg:      1.125rem;  /* 18px */
  --text-base:    1rem;       /* 16px */
  --text-sm:      0.875rem;   /* 14px */
  --text-xs:      0.75rem;    /* 12px */

  /* 气泡内文字 */
  --text-bubble-title:  1.125rem;  /* 18px */
  --text-bubble-desc:   0.875rem;  /* 14px */
}
```

### 3.3 行高与字间距

```css
:root {
  /* 行高 */
  --leading-hero:   1.2;   /* 紧凑：主标题 */
  --leading-heading: 1.3;  /* 标题 */
  --leading-body:   1.6;   /* 正文 */
  --leading-relaxed: 1.8;  /* 宽松：说明文字 */

  /* 字间距 */
  --tracking-tight:  -0.02em;
  --tracking-normal: 0em;
  --tracking-wide:   0.05em;
  --tracking-wider:  0.1em;
}
```

---

## 4. 组件规范

### 4.1 功能气泡组件 (Feature Bubble)

**描述**：漂浮在页面上的彩虹光泽气泡，内含功能图标和中文文字

**视觉规格**：

| 属性 | 值 |
|-----|-----|
| 尺寸 | 120px - 160px 直径 |
| 背景 | 径向渐变 + 彩虹高光 |
| 模糊 | `backdrop-blur-sm` |
| 边框 | 1px 彩虹渐变边框 |
| 阴影 | `shadow-bubble` |
| 动画 | 浮动 (3-6s ease-in-out infinite) |

**CSS 结构**：

```css
.feature-bubble {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(252, 231, 243, 0.7) 40%,
    rgba(218, 180, 254, 0.5) 100%
  );
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(196, 132, 252, 0.25),
    inset 0 2px 20px rgba(255, 255, 255, 0.8);
  animation: float 4s ease-in-out infinite;
}

.feature-bubble::before {
  content: '';
  position: absolute;
  top: 10%;
  left: 15%;
  width: 35%;
  height: 25%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(192, 132, 252, 0.4) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(4px);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}
```

**Tailwind 原子类**：

```html
<div class="w-[140px] h-[140px] rounded-full
            bg-gradient-to-br from-white/90 via-blush-100/70 to-mist-200/50
            backdrop-blur-sm border border-white/50
            shadow-bubble
            flex flex-col items-center justify-center gap-1
            animate-float">
  <!-- 图标 -->
  <div class="w-8 h-8 text-blush-500">
    <IconSkeleton />
  </div>
  <!-- 标题 -->
  <span class="text-sm font-medium text-purple-900">体态分析</span>
  <!-- 描述 -->
  <span class="text-xs text-purple-600">AI识别中...</span>
</div>
```

**气泡类型定义**：

> 注：以下气泡为首页展示用的功能入口，实际功能对应关系如下：

| 首页气泡 | 图标 | 标题 | 描述 | 对应实际功能 |
|---------|------|------|------|------------|
| 体态分析 | 骨骼/骨架 | 体态分析 | AI识别中... | `CameraCapture` - 拍照分析 |
| AI教练 | 用户头像 | AI教练 | 专属指导 | `CoachChat` - 聊天陪练 |
| 今日计划 | 日历 | 今日计划 | 3个动作 | `TrainingPlan` - 训练计划 |
| 体态评分 | 星星 | 体态评分 | 90分 | `ScoreRing` - 分数显示 |
| 历史记录 | 时钟 | 历史记录 | 查看详情 | `HistoryRail` - 历史侧边栏 |
| 开始训练 | 播放 | 开始训练 | 立即开始 | 入口按钮 |

> **产品边界说明**：
> - 当前产品**无**「训练数据趋势分析」页面
> - 当前产品**无**「连续打卡天数/坚持X天」功能
> - 当前产品**无**「语速」「指导强度」设置
> - 「训练打卡」为聊天页内的快捷按钮，非独立功能页

---

### 4.2 主按钮组件 (Hero CTA Button)

**描述**：首页核心行动号召按钮，药丸形状，玻璃拟态，彩虹发光边缘

**视觉规格**：

| 属性 | 值 |
|-----|-----|
| 尺寸 | padding: 16px 40px |
| 圆角 | rounded-full (全圆角) |
| 背景 | 玻璃拟态 + 彩虹渐变边框 |
| 文字 | 18px, font-weight: 600 |
| 动画 | 柔和脉冲发光 |

**CSS 结构**：

```css
.btn-hero {
  position: relative;
  padding: 16px 40px;
  border-radius: 9999px;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(
    135deg,
    rgba(167, 139, 250, 0.9) 0%,
    rgba(244, 114, 182, 0.9) 100%
  );
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow:
    0 0 30px rgba(244, 114, 182, 0.5),
    0 10px 40px rgba(196, 132, 252, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

.btn-hero::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(
    90deg,
    #f472b6, #c084fc, #7dd3fc, #4ade80, #facc15, #f472b6
  );
  border-radius: inherit;
  z-index: -1;
  background-size: 400% 100%;
  animation: rainbow-shift 4s linear infinite;
}

.btn-hero:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 50px rgba(244, 114, 182, 0.6),
    0 15px 50px rgba(196, 132, 252, 0.4);
}

@keyframes rainbow-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
}
```

**Tailwind 原子类**：

```html
<button class="relative px-10 py-4
              text-lg font-semibold text-white
              bg-gradient-to-br from-blush-400 via-mist-400 to-sky-300
              rounded-full
              shadow-glow
              hover:shadow-bubble hover:-translate-y-1
              transition-all duration-300
              cursor-pointer">
  开始你的体态之旅 →
</button>
```

---

### 4.3 导航栏组件 (Navbar)

**描述**：顶部透明浮动导航栏，品牌 Logo + 中文菜单

**视觉规格**：

| 属性 | 值 |
|-----|-----|
| 位置 | 固定顶部，间距 top-4 left-4 right-4 |
| 背景 | 半透明白色 + 模糊 |
| 圆角 | rounded-2xl |
| 高度 | 64px |

**Tailwind 原子类**：

```html
<nav class="fixed top-4 left-4 right-4 z-50
            h-16 px-6 py-3
            bg-white/70 backdrop-blur-md
            rounded-2xl border border-white/50
            shadow-soft
            flex items-center justify-between">
  <!-- Logo 区域 -->
  <div class="flex flex-col">
    <span class="text-xl font-serif font-semibold text-purple-900">PostureFit</span>
    <span class="text-xs text-purple-600 -mt-1">AI体态矫正运动搭子</span>
  </div>

  <!-- 导航菜单 -->
  <div class="hidden md:flex items-center gap-8">
    <a href="#features" class="text-sm text-purple-700 hover:text-blush-500 transition-colors">功能介绍</a>
    <a href="#how" class="text-sm text-purple-700 hover:text-blush-500 transition-colors">如何使用</a>
    <a href="#about" class="text-sm text-purple-700 hover:text-blush-500 transition-colors">关于我们</a>
  </div>

  <!-- 汉堡菜单 (移动端) -->
  <button class="md:hidden p-2 text-purple-700">
    <IconMenu class="w-6 h-6" />
  </button>
</nav>
```

---

### 4.4 分数环形组件 (Score Ring)

**描述**：显示体态评分的环形进度条，梦幻风格

**视觉规格**：

| 属性 | 值 |
|-----|-----|
| 尺寸 | 120px x 120px |
| 轨道 | 浅色渐变背景环 |
| 进度 | 彩虹渐变 + 发光 |
| 数字 | 居中大号字体 |

**Tailwind 原子类**：

```html
<div class="relative w-[120px] h-[120px]">
  <!-- 背景环 -->
  <svg class="absolute inset-0 w-full h-full -rotate-90">
    <circle
      cx="60" cy="60" r="54"
      stroke="url(#gradient-blush)"
      stroke-width="8"
      fill="none"
      class="opacity-30"
    />
  </svg>
  <!-- 进度环 -->
  <svg class="absolute inset-0 w-full h-full -rotate-90">
    <circle
      cx="60" cy="60" r="54"
      stroke="url(#gradient-rainbow)"
      stroke-width="8"
      fill="none"
      stroke-linecap="round"
      stroke-dasharray="339.3"
      stroke-dashoffset="33.93"
      class="drop-shadow-glow"
    />
  </svg>
  <!-- 分数文字 -->
  <div class="absolute inset-0 flex items-center justify-center">
    <span class="text-3xl font-bold bg-gradient-to-r from-blush-500 to-mist-500 bg-clip-text text-transparent">
      90
    </span>
  </div>
</div>
```

---

### 4.5 聊天气泡组件 (Chat Bubble)

**描述**：AI 教练对话气泡，玻璃拟态风格

**Tailwind 原子类**：

```html
<!-- 用户消息 -->
<div class="flex justify-end mb-4">
  <div class="max-w-[80%] px-4 py-3
              bg-gradient-to-br from-blush-200 to-blush-100
              rounded-2xl rounded-br-md
              shadow-soft
              text-purple-900">
    <p class="text-sm">用户消息内容</p>
  </div>
</div>

<!-- AI 消息 -->
<div class="flex justify-start mb-4">
  <div class="max-w-[80%] px-4 py-3
              bg-white/70 backdrop-blur-sm
              border border-white/50
              rounded-2xl rounded-bl-md
              shadow-soft
              text-purple-900">
    <p class="text-sm">AI 教练回复内容</p>
  </div>
</div>
```

---

### 4.6 历史记录侧边栏 (History Rail)

**描述**：会话历史侧边栏，玻璃拟态

**Tailwind 原子类**：

```html
<aside class="w-72 h-full
              bg-white/60 backdrop-blur-md
              border-r border-blush-100
              shadow-soft
              flex flex-col">
  <!-- 标题 -->
  <div class="px-4 py-4 border-b border-blush-100">
    <h3 class="text-lg font-semibold text-purple-900">训练记录</h3>
  </div>

  <!-- 历史列表 -->
  <div class="flex-1 overflow-y-auto p-3 space-y-2">
    <!-- 历史项 -->
    <div class="p-3 rounded-xl
                bg-blush-50/50 hover:bg-blush-100/50
                border border-transparent hover:border-blush-200
                cursor-pointer transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blush-300 to-mist-300" />
        <div>
          <p class="text-sm font-medium text-purple-900">体态分析</p>
          <p class="text-xs text-purple-500">2024-01-15</p>
        </div>
      </div>
    </div>
  </div>
</aside>
```

---

## 5. 页面设计模式

### 5.1 首页 / 拍照页 (Capture)

```
┌─────────────────────────────────────────────────────┐
│  [Navbar: Logo + 导航菜单]                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              场景背景层                      │    │
│  │  ┌────────┐     ┌────────┐                  │    │
│  │  │气泡1  │     │气泡2  │                   │    │
│  │  │体态分析│     │AI教练 │                   │    │
│  │  └────────┘     └────────┘                  │    │
│  │                                             │    │
│  │     ┌─────────────────────────────────┐     │    │
│  │     │      Hero 内容区                 │     │    │
│  │     │                                 │     │    │
│  │     │  你的专属 AI体态教练              │     │    │
│  │     │  24小时在线陪伴 · 科学矫正体态     │     │    │
│  │     │                                 │     │    │
│  │     │  [开始你的体态之旅 →]             │     │    │
│  │     │                                 │     │    │
│  │     └─────────────────────────────────┘     │    │
│  │                                             │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐        │    │
│  │  │气泡3  │  │气泡4  │  │气泡5  │        │    │
│  │  │今日计划│  │训练数据│  │训练打卡│        │    │
│  │  └────────┘  └────────┘  └────────┘        │    │
│  │                                             │    │
│  │  ════════════ 镜面水面 ════════════         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [底部: 滑动鼠标 · 探索更多 ↓]                        │
└─────────────────────────────────────────────────────┘
```

**关键实现点**：

1. **背景层**：渐变背景 + 伪元素实现薄雾效果
2. **气泡定位**：绝对定位 + CSS Grid 网格布局
3. **水面效果**：底部半透明渐变 + transform: scaleY(-1) 倒影
4. **浮动动画**：不同气泡不同动画延迟

---

### 5.2 分析页 (Analysis)

```
┌─────────────────────────────────────────────────────┐
│  [Navbar]                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │                  │  │                  │        │
│  │   骨架覆盖层      │  │   骨架覆盖层       │        │
│  │   SkeletonOverlay │  │   SkeletonOverlay │        │
│  │                  │  │                  │        │
│  │   [骨骼关键点]    │  │   [骨骼关键点]     │        │
│  │                  │  │                  │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │  体态评分卡片                               │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐    │     │
│  │  │ 总分    │  │ 问题数  │  │ 建议数  │    │     │
│  │  │  90分   │  │  3个    │  │  5条    │    │     │
│  │  └─────────┘  └─────────┘  └─────────┘    │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │  体态问题列表                               │     │
│  │  - 圆肩 (中等)                              │     │
│  │  - 头前倾 (轻微)                            │     │
│  │  - 骨盆前倾 (中等)                          │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  [下一步: 设置训练计划 →]                            │
└─────────────────────────────────────────────────────┘
```

**关键实现点**：

1. **SkeletonOverlay 改造**：添加彩虹渐变发光效果
2. **骨骼关键点**：使用渐变圆点替代纯色点
3. **骨骼连线**：彩虹渐变描边
4. **问题标注**：气泡指示器 + 渐变高亮

---

### 5.3 聊天页 (Chat)

```
┌─────────────────────────────────────────────────────┐
│  [Navbar]                                           │
├───────────────────────────────────┬─────────────────┤
│                                   │                 │
│  ┌─────────────────────────────┐  │  历史记录侧边栏  │
│  │                             │  │                 │
│  │      聊天消息区域            │  │  [HistoryRail]  │
│  │                             │  │                 │
│  │  [AI消息气泡]               │  │                 │
│  │                             │  │                 │
│  │            [用户消息气泡]   │  │                 │
│  │                             │  │                 │
│  │  [训练动作卡片]             │  │                 │
│  │                             │  │                 │
│  └─────────────────────────────┘  │                 │
│  ┌─────────────────────────────┐  │                 │
│  │ [输入框: 输入消息...] [发送] │  │                 │
│  └─────────────────────────────┘  │                 │
└───────────────────────────────────┴─────────────────┘
```

**关键实现点**：

1. **消息气泡**：玻璃拟态背景 + 渐变边框
2. **训练动作卡片**：气泡风格 + 动作图标
3. **输入框**：毛玻璃效果 + 彩虹聚焦边框

---

### 5.4 个人设置页 (Profile)

产品实际功能：教练风格选择 + 身体状态选择 + 训练目标输入

```
┌─────────────────────────────────────────────────────┐
│  [Navbar]                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  定制你的 AI 运动搭子                         │    │
│  │  系统将由女性数字人教练陪你训练               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  风格倾向                                    │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │ 鼓励型  │ │ 严厉型  │ │ 幽默型  │       │    │
│  │  │ 温柔陪伴│ │ 高效专业│ │ 轻松有趣│       │    │
│  │  └─────────┘ └─────────┘ └─────────┘       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  训练目标: [改善圆肩、缓解久坐酸痛...]        │    │
│  │  身体状态: [日常状态 ▼]                      │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  [教练名称]已就位                            │    │
│  │  女性数字人教练 · 鼓励型 · 温柔引导           │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [返回分析]        [进入 AI 陪练]                   │
└─────────────────────────────────────────────────────┘
```

**关键实现点**：

1. **风格选择卡片**：三个选项卡片，选中状态高亮
2. **训练目标输入**：自由文本输入框
3. **身体状态下拉**：`normal | postpartum | menstrual | fatigued | teenager`
4. **教练预览区**：显示选中风格对应的教练信息

**Tailwind 原子类参考**：

```html
<!-- 风格选项卡片 -->
<button class={`cursor-pointer rounded-2xl border-2 p-4 text-left transition ${
  active ? 'border-primary-400 bg-primary-50/70' : 'border-gray-100 bg-white hover:border-primary-200'
}`}>
  <Icon className={`mb-3 h-5 w-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
  <p class="text-sm font-semibold text-gray-800">{label}</p>
  <p class="mt-1 text-xs text-gray-500">{desc}</p>
</button>

<!-- 身体状态选择器 -->
<select class="w-full cursor-pointer rounded-2xl border border-gray-200 px-4 py-3 text-sm
               focus:border-primary-400 focus:ring-4 focus:ring-primary-100">
  <option value="normal">日常状态</option>
  <option value="postpartum">产后恢复</option>
  <option value="menstrual">生理期</option>
  <option value="fatigued">疲劳状态</option>
  <option value="teenager">青少年</option>
</select>
```

---

## 6. 动效与交互相册

### 6.1 全局动画

```css
/* 气泡浮动动画 */
@keyframes float-slow {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(3deg); }
}

@keyframes float-medium {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(-2deg); }
}

@keyframes float-fast {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 彩虹光泽流动 */
@keyframes iridescent-shift {
  0% { filter: hue-rotate(0deg) saturate(1); }
  50% { filter: hue-rotate(30deg) saturate(1.2); }
  100% { filter: hue-rotate(0deg) saturate(1); }
}

/* 薄雾飘动 */
@keyframes mist-drift {
  0% { transform: translateX(0) scale(1); opacity: 0.3; }
  50% { transform: translateX(20px) scale(1.05); opacity: 0.5; }
  100% { transform: translateX(0) scale(1); opacity: 0.3; }
}

/* 发光脉冲 */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(244, 114, 182, 0.3); }
  50% { box-shadow: 0 0 40px rgba(244, 114, 182, 0.6); }
}

/* 镜面水波 */
@keyframes water-ripple {
  0% { transform: scaleY(1) translateY(0); }
  50% { transform: scaleY(0.98) translateY(2px); }
  100% { transform: scaleY(1) translateY(0); }
}
```

### 6.2 过渡动画

```css
/* 按钮悬停 */
.btn-ethereal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-ethereal:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 0 50px rgba(244, 114, 182, 0.5),
    0 15px 50px rgba(196, 132, 252, 0.3);
}

/* 卡片悬停 */
.card-ethereal {
  transition: all 0.3s ease;
}

.card-ethereal:hover {
  transform: translateY(-4px);
  box-shadow:
    0 20px 40px rgba(196, 132, 252, 0.2),
    0 0 30px rgba(244, 114, 182, 0.1);
}

/* 气泡悬停 */
.bubble-ethereal:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
}
```

### 6.3 加载状态

```css
/* 骨架屏加载 */
.skeleton-ethereal {
  background: linear-gradient(
    90deg,
    rgba(252, 231, 243, 0.4) 25%,
    rgba(243, 232, 255, 0.4) 50%,
    rgba(252, 231, 243, 0.4) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 7. 响应式断点

### 7.1 断点定义

| 断点 | 屏幕宽度 | 布局变化 |
|-----|---------|---------|
| `sm` | 640px | 气泡缩小至 100px |
| `md` | 768px | 导航菜单显示 |
| `lg` | 1024px | 历史栏始终显示 |
| `xl` | 1280px | 气泡增大至 160px |
| `2xl` | 1536px | 最大布局宽度限制 |

### 7.2 移动端适配

```css
/* 移动端导航 */
.mobile-nav {
  @apply fixed inset-0 z-50 bg-white/95 backdrop-blur-lg;
}

/* 移动端气泡网格 */
.bubble-grid-mobile {
  @apply grid grid-cols-3 gap-4 p-4;
}

.bubble-grid-desktop {
  @apply flex flex-wrap justify-center gap-6;
}
```

---

## 8. 无障碍设计

### 8.1 颜色对比

| 元素 | 前景色 | 背景色 | 对比度 |
|-----|-------|-------|-------|
| 主要文字 | `#1e1b4b` | `#fdf2f8` | 12.5:1 ✓ |
| 次要文字 | `#4c1d6e` | `#fce7f3` | 7.2:1 ✓ |
| 按钮文字 | `#ffffff` | `#f472b6` | 3.1:1 ⚠ |

> ⚠️ 注意：按钮文字对比度略低，可通过添加文字阴影增强

```css
.btn-text-shadow {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

### 8.2 动画偏好

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.3 焦点状态

```css
/* 自定义焦点环 */
.focus-ring:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(244, 114, 182, 0.5),
    0 0 0 6px rgba(244, 114, 182, 0.2);
}
```

---

## 9. 图标规范

### 9.1 图标库选择

| 类别 | 推荐图标库 | 备选 |
|-----|----------|------|
| 界面图标 | Lucide React | Heroicons |
| 品牌图标 | 自定义 SVG | - |

### 9.2 必需图标清单

> 产品已使用 Lucide React 图标库，以下为实际使用的图标：

```tsx
// 功能气泡图标 (首页展示)
// 实际产品中气泡为装饰性展示，非独立功能入口

// 教练风格图标
<Heart />           // 鼓励型 - ProfileForm
<Zap />             // 严厉型 - ProfileForm
<Smile />           // 幽默型 - ProfileForm

// 聊天界面图标
<Bot />             // AI 教练头像 - CoachChat
<UserRound />       // 用户头像 - CoachChat
<SendHorizontal />  // 发送按钮 - CoachChat
<RefreshCw />       // 换一组训练 - CoachChat
<RotateCcw />       // 重新评估 - CoachChat
<ExternalLink />    // 视频链接 - CoachChat
<Timer />           // 动作时长 - CoachChat

// 界面图标
<Menu />            // 移动端菜单
<X />               // 关闭
<Camera />          // 拍照
<Upload />          // 上传
<ChevronDown />     // 下展开
<ChevronRight />    // 右展开
<Clock />           // 历史时间
<Star />            // 评分星星
<Check />           // 完成/打卡
<Activity />        // 体态分析/骨骼
<Calendar />        // 计划/日历
<BarChart3 />       // 数据图表

// 历史记录图标
<FileText />        // 会话记录
<History />         // 历史
```

### 9.3 图标规格

```tsx
// 图标统一规格
<IconComponent
  className="w-6 h-6"  // 固定尺寸
  strokeWidth={1.5}     // 描边粗细
  stroke="currentColor" // 继承文字颜色
/>
```

---

## 10. 实施检查清单

### 10.1 设计系统文件

- [ ] 创建 `src/styles/ethereal.css` - 全局梦幻样式
- [ ] 更新 `tailwind.config.js` - 添加粉彩色板
- [ ] 创建 `src/components/FeatureBubble.tsx` - 气泡组件
- [ ] 创建 `src/components/HeroButton.tsx` - 主按钮组件
- [ ] 创建 `src/components/ScoreRingEthereal.tsx` - 评分环组件

### 10.2 页面改造

- [ ] 更新 `App.tsx` - 应用整体布局
- [ ] 改造 `CameraCapture.tsx` - 首页风格
- [ ] 改造 `SkeletonOverlay.tsx` - 彩虹骨架
- [ ] 改造 `CoachChat.tsx` - 聊天气泡
- [ ] 改造 `HistoryRail.tsx` - 玻璃拟态侧边栏
- [ ] 改造 `ProfileForm.tsx` - 设置页面

### 10.3 视觉效果

- [ ] 实现气泡浮动动画
- [ ] 实现水面反射效果
- [ ] 实现彩虹渐变边框
- [ ] 实现薄雾背景层
- [ ] 实现发光脉冲效果

---

## 附录 A：参考代码片段

### A.1 彩虹渐变 SVG

```tsx
<svg width="0" height="0">
  <defs>
    <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#f472b6" />
      <stop offset="25%" stopColor="#c084fc" />
      <stop offset="50%" stopColor="#7dd3fc" />
      <stop offset="75%" stopColor="#4ade80" />
      <stop offset="100%" stopColor="#f472b6" />
    </linearGradient>
    <linearGradient id="blush-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fce7f3" />
      <stop offset="50%" stopColor="#f3e8ff" />
      <stop offset="100%" stopColor="#e0f2fe" />
    </linearGradient>
  </defs>
</svg>
```

### A.2 薄雾背景效果

```css
.mist-background {
  position: relative;
  background: linear-gradient(180deg, #faf5ff 0%, #fce7f3 50%, #bae6fd 100%);
}

.mist-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(248, 180, 217, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(216, 180, 254, 0.3) 0%, transparent 50%);
  pointer-events: none;
}
```

### A.3 镜面水效果

```css
.water-reflection {
  position: relative;
}

.water-reflection::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(180deg, transparent 0%, rgba(186, 230, 253, 0.3) 100%);
  transform: scaleY(-1);
  opacity: 0.5;
  pointer-events: none;
}
```

---

## 附录 B：设计资源链接

### B.1 字体

- Lora: https://fonts.google.com/specimen/Lora
- Noto Sans SC: https://fonts.google.com/noto/specimen/Noto+Sans+SC
- Raleway: https://fonts.google.com/specimen/Raleway

### B.2 灵感参考

- Dribbble: "Ethereal UI" 标签
- Behance: "Soft gradient" 作品集
- Pinterest: "Dreamy pastel aesthetic" 画板

---

*文档版本 1.0 | 最后更新：2026-05-24*
