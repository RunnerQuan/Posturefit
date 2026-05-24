import { useNavigate } from 'react-router-dom';
import { Activity, Bot, Calendar, Star, type LucideIcon } from 'lucide-react';
import backgroundImage from '../../../assets/background.png';

interface FeatureBubbleProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  className?: string;
}

function FeatureBubble({ icon: Icon, title, desc, className = '' }: FeatureBubbleProps) {
  return (
    <div
      className={`
        w-[140px] h-[140px] rounded-full
        bg-gradient-to-br from-white/95 via-blush-50/80 to-mist-100/60
        backdrop-blur-md border border-white/60
        shadow-[0_8px_32px_rgba(236,72,153,0.15)]
        flex flex-col items-center justify-center gap-1.5
        ${className}
        cursor-pointer
        transition-all duration-300 ease-out
        hover:scale-110 hover:shadow-[0_12px_40px_rgba(236,72,153,0.25)]
        hover:-translate-y-1
      `}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blush-400/20 to-mist-400/20 flex items-center justify-center">
        <Icon className="w-6 h-6 text-blush-500" strokeWidth={1.5} />
      </div>
      <span className="text-sm font-medium text-blush-600">{title}</span>
      <span className="text-xs text-mist-500">{desc}</span>
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
      <div className="fixed top-6 left-6 z-20 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blush-400 to-mist-400 flex items-center justify-center shadow-[0_4px_20px_rgba(236,72,153,0.3)]">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span className="font-serif text-2xl font-semibold text-blush-600">PostureFit</span>
      </div>

      {/* 主内容区域 */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-5xl">
          {/* 功能气泡 - 左上 */}
          <div className="absolute -top-4 left-0 md:left-16 z-20 animate-float-slow">
            <FeatureBubble
              icon={Activity}
              title="体态分析"
              desc="AI 智能识别"
            />
          </div>

          {/* 功能气泡 - 右上 */}
          <div className="absolute -top-8 right-0 md:right-16 z-20 animate-float-medium">
            <FeatureBubble
              icon={Bot}
              title="AI教练"
              desc="专属指导"
            />
          </div>

          {/* 功能气泡 - 左下 */}
          <div className="absolute bottom-0 left-8 md:left-24 z-20 animate-float-bubble">
            <FeatureBubble
              icon={Calendar}
              title="今日计划"
              desc="个性化训练"
            />
          </div>

          {/* 功能气泡 - 右下 */}
          <div className="absolute bottom-4 right-8 md:right-24 z-20 animate-float-slow">
            <FeatureBubble
              icon={Star}
              title="体态评分"
              desc="科学打分"
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
