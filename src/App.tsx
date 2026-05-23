import { useState, useCallback, useEffect } from 'react';
import { CameraCapture } from './features/camera';
import { usePoseDetection, validateKeypointsForMode, KEYPOINT_LABELS, MODE_MIN_KEYPOINTS } from './features/pose';
import { SkeletonOverlay, analyzePose, combineAnalyses, CombinedAnalysisView } from './features/analysis';
import { StepIndicator } from './components/StepIndicator';
import { AnalysisLoader } from './components/AnalysisLoader';
import { COACH_PROFILES, DEFAULT_PROFILE } from './data/demoProfiles';
import type { CoachProfileKey } from './data/demoProfiles';
import { Heart, Zap, Smile, ChevronRight } from 'lucide-react';
import type { CaptureMode, PostureAnalysisResult, PostureSessionStep, ViewSelection, PoseView, CapturedPhoto, CoachStyle, CoachGender } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<PostureSessionStep>('capture');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('fullBody');
  const [viewSelection, setViewSelection] = useState<ViewSelection>('dual');

  // 拍摄状态
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [currentCaptureView, setCurrentCaptureView] = useState<PoseView | null>(null);

  // 分析状态
  const [frontAnalysis, setFrontAnalysis] = useState<PostureAnalysisResult | null>(null);
  const [sideAnalysis, setSideAnalysis] = useState<PostureAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 教练选择状态
  const [selectedCoachStyle, setSelectedCoachStyle] = useState<CoachStyle>(DEFAULT_PROFILE.coachStyle);
  const [selectedCoachGender, setSelectedCoachGender] = useState<CoachGender>(DEFAULT_PROFILE.coachGender);

  const { detectPoseFromImage, isModelLoading } = usePoseDetection();

  // 获取当前照片对应的图片URL
  const getImageUrl = (view: PoseView): string => {
    const photo = photos.find(p => p.view === view);
    return photo?.imageUrl || '';
  };

  // 处理拍摄
  const handleCapture = useCallback((dataUrl: string, view: PoseView) => {
    const newPhoto: CapturedPhoto = {
      id: `${Date.now()}-${view}`,
      view,
      imageUrl: dataUrl,
      capturedAt: new Date().toISOString(),
    };

    setPhotos(prev => {
      const filtered = prev.filter(p => p.view !== view);
      return [...filtered, newPhoto];
    });

    if (viewSelection === 'dual' && view === 'front') {
      setCurrentCaptureView('front');
    } else if (viewSelection === 'dual' && view === 'side') {
      setCurrentCaptureView('side');
      setCurrentStep('analysis');
    } else {
      setCurrentStep('analysis');
    }
  }, [viewSelection]);

  const handleUpload = useCallback((dataUrl: string, view: PoseView) => {
    handleCapture(dataUrl, view);
  }, [handleCapture]);

  // 重置当前拍摄
  const handleResetCapture = useCallback(() => {
    if (viewSelection === 'dual' && currentCaptureView === 'front') {
      setPhotos(prev => prev.filter(p => p.view !== 'front'));
      setCurrentCaptureView(null);
    }
  }, [viewSelection, currentCaptureView]);

  // 执行分析
  const performAnalysis = useCallback(async (photo: CapturedPhoto) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('[DEBUG] 开始分析照片:', photo.view, '拍摄模式:', captureMode);

      const minKeypointCount = MODE_MIN_KEYPOINTS[captureMode];
      console.log('[DEBUG] 最少需要关键点数量:', minKeypointCount);

      const keypoints = await detectPoseFromImage(photo.imageUrl, minKeypointCount);
      console.log('[DEBUG] 检测到的关键点数量:', keypoints.length);
      console.log('[DEBUG] 关键点详情:', keypoints.map(k => `${k.name}: score=${k.score?.toFixed(2)}`).join(', '));

      const validation = validateKeypointsForMode(keypoints, captureMode);
      console.log('[DEBUG] 验证结果:', validation);

      if (!validation.isValid) {
        const missingLabels = validation.missingKeypoints?.map(k => KEYPOINT_LABELS[k]).join('、') || '';
        const errorMsg = `${validation.message}\n缺失关键点：${missingLabels}`;
        console.log('[DEBUG] 设置错误信息:', errorMsg);
        setError(errorMsg);
        setIsAnalyzing(false);
        return;
      }

      const result = analyzePose(keypoints, {
        view: photo.view,
        captureMode: captureMode
      });
      console.log('[DEBUG] 分析结果:', { score: result.score, issues: result.issues.length });

      if (photo.view === 'front') {
        setFrontAnalysis(result);
      } else {
        setSideAnalysis(result);
      }

      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, analysis: result } : p
      ));
    } catch (err) {
      console.error('[DEBUG] 分析失败:', err);
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [detectPoseFromImage, captureMode]);

  // 当进入分析步骤时，分析所有照片
  useEffect(() => {
    if (currentStep === 'analysis') {
      const unanalyzedPhotos = photos.filter(p => !p.analysis);
      if (unanalyzedPhotos.length > 0) {
        performAnalysis(unanalyzedPhotos[0]);
      }
    }
  }, [currentStep, photos, performAnalysis]);

  // 重试
  const handleRetry = () => {
    setPhotos([]);
    setFrontAnalysis(null);
    setSideAnalysis(null);
    setCurrentCaptureView(null);
    setError(null);
    setCurrentStep('capture');
  };

  // 计算合并分析结果
  const combinedResult = (frontAnalysis || sideAnalysis)
    ? combineAnalyses(frontAnalysis, sideAnalysis)
    : null;

  // 是否显示双视角模式
  const showDualViews = viewSelection === 'dual' && photos.length >= 2;

  // 当前选中教练
  const currentCoachKey: CoachProfileKey = `${selectedCoachStyle}_${selectedCoachGender}`;
  const currentCoach = COACH_PROFILES[currentCoachKey];

  // 确认教练选择，进入计划步骤
  const handleConfirmCoach = () => {
    setCurrentStep('plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-primary-700 font-serif">PostureFit</h1>
              <p className="text-xs text-primary-500 mt-0.5">AI体态矫正运动搭子</p>
            </div>
            <StepIndicator currentStep={currentStep} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentStep === 'capture' && (
          <div className="max-w-2xl mx-auto">
            <CameraCapture
              onCapture={handleCapture}
              selectedMode={captureMode}
              onModeChange={setCaptureMode}
              onUploadImage={handleUpload}
              viewSelection={viewSelection}
              onViewSelectionChange={setViewSelection}
              currentCaptureView={viewSelection === 'dual' ? currentCaptureView : null}
              onResetCapture={handleResetCapture}
              showViewSelection={true}
            />
          </div>
        )}

        {currentStep === 'analysis' && (
          <div className="space-y-6">
            {isAnalyzing || isModelLoading ? (
              <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-card p-4">
                <AnalysisLoader
                  message={isModelLoading ? '正在加载AI模型...' : undefined}
                />
              </div>
            ) : error ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white border border-red-100 rounded-2xl shadow-card p-6 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium transition-colors cursor-pointer"
                  >
                    重新拍摄
                  </button>
                </div>
              </div>
            ) : (frontAnalysis || sideAnalysis) ? (
              <div className="space-y-6">
                {showDualViews ? (
                  <div className="max-w-5xl mx-auto">
                    <CombinedAnalysisView
                      frontAnalysis={frontAnalysis}
                      sideAnalysis={sideAnalysis}
                      combinedResult={combinedResult}
                      showDualViews={true}
                      frontImageUrl={getImageUrl('front')}
                      sideImageUrl={getImageUrl('side')}
                    />
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-medium text-gray-700">
                        {viewSelection === 'front' ? '正面' : '侧面'}分析结果
                      </h3>
                      {combinedResult && (
                        <div className="text-2xl font-bold text-gray-900">
                          {combinedResult.score}
                          <span className="text-sm font-normal text-gray-400 ml-1">分</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
                      <SkeletonOverlay
                        result={(viewSelection === 'front' ? frontAnalysis : sideAnalysis)!}
                        imageUrl={getImageUrl(viewSelection === 'front' ? 'front' : 'side')}
                        className="max-h-[400px]"
                      />
                    </div>

                    <div className="space-y-2">
                      {combinedResult?.allIssues.map((issue, index) => (
                        <div
                          key={`${issue.type}-${index}`}
                          className={`px-4 py-3 rounded-xl ${
                            issue.severity === 'normal'
                              ? 'bg-green-50 text-green-700'
                              : issue.severity === 'mild'
                              ? 'bg-yellow-50 text-yellow-700'
                              : issue.severity === 'moderate'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {issue.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-w-2xl mx-auto flex flex-col gap-3">
                  <button
                    onClick={() => setCurrentStep('profile')}
                    className="w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium text-base transition-colors cursor-pointer"
                  >
                    继续选择教练
                  </button>
                  <button
                    onClick={handleRetry}
                    className="w-full px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-medium transition-colors cursor-pointer"
                  >
                    重新拍摄
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {currentStep === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-card p-6">
              {/* Section title */}
              <h2 className="text-lg font-semibold text-gray-800 mb-1">选择你的专属教练</h2>
              <p className="text-sm text-gray-400 mb-6">根据你的偏好匹配合适的训练风格</p>

              {/* Style selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">风格倾向</h3>
                <div className="grid grid-cols-3 gap-3">
                  {/* Encouraging */}
                  <button
                    onClick={() => setSelectedCoachStyle('encouraging')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedCoachStyle === 'encouraging'
                        ? 'border-primary-400 bg-primary-50/60'
                        : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedCoachStyle === 'encouraging' ? 'bg-pink-100 text-pink-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Heart className="w-5 h-5" />
                    </div>
                    <span className={`text-sm font-medium ${selectedCoachStyle === 'encouraging' ? 'text-primary-700' : 'text-gray-600'}`}>鼓励型</span>
                    <span className="text-xs text-gray-400 text-center leading-snug">温柔陪伴<br/>耐心引导</span>
                  </button>

                  {/* Strict */}
                  <button
                    onClick={() => setSelectedCoachStyle('strict')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedCoachStyle === 'strict'
                        ? 'border-primary-400 bg-primary-50/60'
                        : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedCoachStyle === 'strict' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className={`text-sm font-medium ${selectedCoachStyle === 'strict' ? 'text-primary-700' : 'text-gray-600'}`}>严厉型</span>
                    <span className="text-xs text-gray-400 text-center leading-snug">高效专业<br/>结果导向</span>
                  </button>

                  {/* Humorous */}
                  <button
                    onClick={() => setSelectedCoachStyle('humorous')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedCoachStyle === 'humorous'
                        ? 'border-primary-400 bg-primary-50/60'
                        : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedCoachStyle === 'humorous' ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Smile className="w-5 h-5" />
                    </div>
                    <span className={`text-sm font-medium ${selectedCoachStyle === 'humorous' ? 'text-primary-700' : 'text-gray-600'}`}>幽默型</span>
                    <span className="text-xs text-gray-400 text-center leading-snug">轻松有趣<br/>快乐健身</span>
                  </button>
                </div>
              </div>

              {/* Gender selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">教练性别</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['female', 'male'] as CoachGender[]).map(gender => {
                    const coach = COACH_PROFILES[`${selectedCoachStyle}_${gender}`];
                    return (
                      <button
                        key={gender}
                        onClick={() => setSelectedCoachGender(gender)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedCoachGender === gender
                            ? 'border-primary-400 bg-primary-50/60'
                            : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${coach.avatarBg} ${coach.avatarColor}`}>
                          {coach.initials}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-medium ${selectedCoachGender === gender ? 'text-primary-700' : 'text-gray-700'}`}>
                            {gender === 'female' ? '女教练' : '男教练'}
                          </p>
                          <p className="text-xs text-gray-400">{coach.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected coach confirmation */}
              <div className="mb-6 bg-primary-50/70 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${currentCoach.avatarBg} ${currentCoach.avatarColor}`}>
                    {currentCoach.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 font-serif">{currentCoach.name}</p>
                    <p className="text-xs text-gray-500">{currentCoach.bio}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmCoach}
                  className="w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium text-base transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  确认选择
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentStep('capture')}
                  className="w-full px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-medium transition-colors cursor-pointer"
                >
                  上一步
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'plan' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <p className="text-gray-500 text-center mb-6">
                训练计划展示（由前端B实现）
              </p>
              <button
                onClick={() => setCurrentStep('chat')}
                className="w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium text-base transition-colors cursor-pointer"
              >
                开始训练
              </button>
            </div>
          </div>
        )}

        {currentStep === 'chat' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <p className="text-gray-500 text-center mb-6">
                聊天打卡功能（由前端B实现）
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button className="px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-medium transition-colors cursor-pointer">
                  做完了
                </button>
                <button className="px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-medium transition-colors cursor-pointer">
                  太累了
                </button>
              </div>
              <button
                onClick={() => setCurrentStep('capture')}
                className="w-full mt-4 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-medium transition-colors cursor-pointer"
              >
                重新开始
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
