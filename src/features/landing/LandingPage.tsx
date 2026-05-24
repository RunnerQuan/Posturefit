import { useNavigate } from 'react-router-dom';
import { Activity, Bot, Calendar, CheckCircle2, Star, type LucideIcon } from 'lucide-react';
import backgroundImage from '../../../assets/background.png';

interface FeatureBubbleProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface DecorativeBubbleProps {
  className?: string;
}

const bubbleSizeClass = {
  sm: 'h-[92px] w-[92px] gap-1 sm:h-[104px] sm:w-[104px]',
  md: 'h-[112px] w-[112px] gap-1 sm:h-[124px] sm:w-[124px]',
  lg: 'h-[144px] w-[144px] gap-1.5 sm:h-[170px] sm:w-[170px]',
};

const iconSizeClass = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12 sm:h-14 sm:w-14',
};

const textSizeClass = {
  sm: 'text-[12px] sm:text-sm',
  md: 'text-sm sm:text-[15px]',
  lg: 'text-base sm:text-lg',
};

function DecorativeBubble({ className = '' }: DecorativeBubbleProps) {
  return (
    <span
      aria-hidden="true"
      className={`
        pointer-events-none absolute rounded-full border border-white/45
        bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.88),rgba(255,255,255,0.32)_28%,rgba(216,180,254,0.18)_58%,rgba(125,211,252,0.12)_100%)]
        shadow-[inset_4px_5px_12px_rgba(255,255,255,0.46),inset_-8px_-10px_18px_rgba(168,85,247,0.12),0_8px_24px_rgba(216,180,254,0.18)]
        backdrop-blur-md
        ${className}
      `}
    >
      <span className="absolute left-[26%] top-[20%] h-1.5 w-1.5 rounded-full bg-white/85 shadow-[0_0_10px_rgba(255,255,255,0.85)]" />
      <span className="absolute inset-[2px] rounded-full border border-white/25" />
    </span>
  );
}

function FeatureBubble({ icon: Icon, title, desc, size = 'md', className = '' }: FeatureBubbleProps) {
  return (
    <div
      className={`
        pointer-events-none relative isolate overflow-hidden rounded-full
        border border-white/55 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.88),rgba(255,255,255,0.34)_23%,rgba(252,231,243,0.22)_48%,rgba(216,180,254,0.12)_70%,rgba(125,211,252,0.10)_100%)]
        shadow-[inset_9px_10px_22px_rgba(255,255,255,0.52),inset_-18px_-20px_34px_rgba(168,85,247,0.12),0_12px_45px_rgba(236,72,153,0.16),0_0_38px_rgba(125,211,252,0.12)]
        backdrop-blur-xl
        flex flex-col items-center justify-center
        ${bubbleSizeClass[size]}
        ${className}
      `}
    >
      <span className="absolute inset-[3px] rounded-full border border-white/35" />
      <span className="absolute -left-3 top-2 h-1/2 w-3/4 rotate-[-22deg] rounded-full bg-gradient-to-br from-white/70 via-white/24 to-transparent blur-[2px]" />
      <span className="absolute -right-4 bottom-2 h-1/2 w-2/3 rounded-full bg-gradient-to-br from-sky-200/18 via-mist-300/16 to-blush-300/22 blur-md" />
      <span className="absolute left-[21%] top-[16%] h-2 w-2 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.95)]" />
      <span className="absolute right-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_130deg,rgba(255,255,255,0.0),rgba(244,114,182,0.18),rgba(192,132,252,0.20),rgba(125,211,252,0.20),rgba(255,255,255,0.0))] opacity-70 mix-blend-screen" />

      <div
        className={`
          relative z-10 flex items-center justify-center rounded-full
          bg-white/18 text-white shadow-[inset_0_1px_10px_rgba(255,255,255,0.5),0_0_18px_rgba(255,255,255,0.24)]
          ${iconSizeClass[size]}
        `}
      >
        <Icon className="h-1/2 w-1/2 text-white drop-shadow-[0_1px_6px_rgba(219,39,119,0.42)]" strokeWidth={1.6} />
      </div>
      <span className={`relative z-10 font-semibold text-[#5f2a78] drop-shadow-[0_1px_8px_rgba(255,255,255,0.7)] ${textSizeClass[size]}`}>
        {title}
      </span>
      <span className="relative z-10 text-[10px] font-semibold text-[#704089]/90 drop-shadow-[0_1px_6px_rgba(255,255,255,0.72)] sm:text-xs">
        {desc}
      </span>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景图片 */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* 装饰光晕 */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-blush-300/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-mist-300/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Logo - 左上角 */}
      <div className="fixed left-6 top-6 z-20 flex items-center gap-3 sm:left-8 sm:top-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 to-mist-400 shadow-[0_4px_20px_rgba(236,72,153,0.3)] sm:h-14 sm:w-14">
          <svg className="h-6 w-6 text-white sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span className="font-serif text-2xl font-semibold text-blush-600 drop-shadow-[0_1px_8px_rgba(255,255,255,0.35)]">PostureFit</span>
      </div>

      {/* 主内容区域 */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-5xl">
          <DecorativeBubble className="left-[8%] top-[18%] h-9 w-9 animate-float-bubble sm:left-[14%] sm:top-[12%] sm:h-12 sm:w-12" />
          <DecorativeBubble className="right-[10%] top-[24%] h-6 w-6 animate-float-slow sm:right-[18%] sm:top-[18%] sm:h-8 sm:w-8" />
          <DecorativeBubble className="bottom-[28%] left-[2%] h-7 w-7 animate-float-medium sm:bottom-[25%] sm:left-[6%] sm:h-10 sm:w-10" />
          <DecorativeBubble className="bottom-[18%] right-[6%] h-8 w-8 animate-float-bubble sm:bottom-[24%] sm:right-[3%] sm:h-12 sm:w-12" />
          <DecorativeBubble className="hidden h-6 w-6 animate-float-slow md:block md:left-[43%] md:top-[8%]" />

          {/* 功能气泡 - 左上 */}
          <div className="absolute -top-16 left-2 z-20 animate-float-slow sm:-top-12 md:left-6 lg:left-0">
            <FeatureBubble
              icon={Activity}
              title="体态分析"
              desc="AI 识别中..."
              size="lg"
            />
          </div>

          {/* 功能气泡 - 右上 */}
          <div className="absolute -top-14 right-3 z-20 animate-float-medium sm:-top-12 md:right-10 lg:right-4">
            <FeatureBubble
              icon={Bot}
              title="AI教练"
              desc="活力鼓励型"
              size="md"
            />
          </div>

          {/* 功能气泡 - 左下 */}
          <div className="absolute -bottom-5 left-4 z-20 animate-float-bubble sm:bottom-2 md:left-20">
            <FeatureBubble
              icon={Calendar}
              title="今日计划"
              desc="3 个动作"
              size="sm"
            />
          </div>

          {/* 功能气泡 - 右下 */}
          <div className="absolute bottom-0 right-2 z-20 animate-float-slow sm:bottom-24 sm:right-8 md:right-20 lg:right-28">
            <FeatureBubble
              icon={Star}
              title="体态评分"
              desc="72/100"
              size="sm"
            />
          </div>

          {/* 功能气泡 - 训练打卡 */}
          <div className="absolute -bottom-28 right-28 z-20 animate-float-medium sm:-bottom-24 sm:right-44 md:-bottom-16 md:right-0 lg:right-2">
            <FeatureBubble
              icon={CheckCircle2}
              title="训练打卡"
              desc="今日未打卡"
              size="md"
            />
          </div>

          {/* 中央内容 */}
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {/* 标题 - 艺术字效果 */}
            <div className="text-center z-10 mb-10">
              <div className="relative inline-block">
                {/* 玻璃反光底层 */}
                <div className="absolute inset-0 blur-3xl opacity-80 bg-gradient-to-b from-pink-300 via-pink-200 to-pink-400 scale-110" />
                {/* 副标题 */}
                <p className="relative text-2xl md:text-3xl font-semibold tracking-[0.4em] mb-6 italic" style={{
                  WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.9)',
                  WebkitTextFillColor: 'transparent',
                  backgroundImage: 'linear-gradient(180deg, #fff 0%, #ffb6c1 50%, #ff69b4 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}>
                  你的专属
                </p>
                {/* 主标题 */}
                <h1 className="relative text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-bold italic tracking-wide">
                  {/* 白色描边 + 粉色渐变 + 玻璃反光 */}
                  <span style={{
                    WebkitTextStroke: '3px rgba(255, 255, 255, 0.9)',
                    textShadow: `
                      0 0 40px rgba(255, 182, 193, 0.8),
                      0 0 80px rgba(255, 192, 203, 0.6),
                      1px 1px 0 #fff,
                      -1px -1px 0 #fff,
                      1px -1px 0 #fff,
                      -1px 1px 0 #fff
                    `,
                    WebkitTextFillColor: 'transparent',
                    backgroundImage: 'linear-gradient(180deg, #fff 0%, #ffb6c1 40%, #ff69b4 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}>
                    AI
                  </span>
                  <span style={{
                    WebkitTextStroke: '3px rgba(255, 255, 255, 0.9)',
                    textShadow: `
                      0 0 40px rgba(255, 182, 193, 0.8),
                      0 0 80px rgba(255, 192, 203, 0.6),
                      1px 1px 0 #fff,
                      -1px -1px 0 #fff,
                      1px -1px 0 #fff,
                      -1px 1px 0 #fff
                    `,
                    WebkitTextFillColor: 'transparent',
                    backgroundImage: 'linear-gradient(180deg, #fff 0%, #ffb6c1 40%, #ff1493 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}>
                    体态教练
                  </span>
                </h1>
                {/* 顶部玻璃高光 */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-gradient-to-b from-white/60 via-white/20 to-transparent rounded-t-full blur-sm pointer-events-none" />
                {/* 底部反光 */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-gradient-to-t from-pink-200/40 to-transparent rounded-full blur-lg pointer-events-none" />
              </div>
              <p className="mt-6 text-xl md:text-2xl font-semibold tracking-widest" style={{
                WebkitTextStroke: '1px rgba(255, 255, 255, 0.8)',
                WebkitTextFillColor: 'transparent',
                backgroundImage: 'linear-gradient(180deg, #fff 0%, #ffc0cb 50%, #ff69b4 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}>
                24小时在线陪伴 · 科学矫正体态
              </p>
            </div>

            {/* CTA 按钮 */}
            <button
              onClick={() => navigate('/capture')}
              className="group relative px-12 py-5 text-lg font-semibold text-white
                        bg-gradient-to-br from-blush-400 via-mist-400 to-sky-300
                        rounded-full shadow-[0_8px_30px_rgba(236,72,153,0.35)]
                        hover:shadow-[0_12px_40px_rgba(236,72,153,0.45)]
                        hover:-translate-y-2
                        transition-all duration-300 ease-out cursor-pointer"
            >
              <span className="relative z-10">开始你的体态之旅</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blush-500 via-mist-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300">→</span>
            </button>

            {/* 底部装饰线 */}
            <div className="mt-16 flex items-center gap-3 text-blush-300/50">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-blush-300/50" />
              <span className="text-xs tracking-widest uppercase">PostureFit</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-blush-300/50" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
