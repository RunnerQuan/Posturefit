import { useState, useCallback, useEffect } from 'react';
import { CameraCapture } from './features/camera';
import { usePoseDetection } from './features/pose';
import { SkeletonOverlay, analyzePose } from './features/analysis';
import { setupDiagnosticConsole } from './features/pose/tensorflowCleanup';
import type { CaptureMode, PostureAnalysisResult, PostureIssueType, PostureSessionStep } from './types';

const METRIC_LABELS: Record<PostureIssueType, string> = {
  forwardHead: '头前伸',
  roundedShoulder: '圆肩',
  anteriorPelvicTilt: '骨盆前倾',
};

function getMetricValue(result: PostureAnalysisResult, issueType: PostureIssueType): number {
  switch (issueType) {
    case 'forwardHead':
      return result.metrics.forwardHeadAngle;
    case 'roundedShoulder':
      return result.metrics.roundedShoulderAngle;
    case 'anteriorPelvicTilt':
      return result.metrics.anteriorTiltAngle;
  }
}

function App() {
  // 初始化诊断工具
  useEffect(() => {
    setupDiagnosticConsole();
  }, []);

  const [currentStep, setCurrentStep] = useState<PostureSessionStep>('capture');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('fullBody');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<PostureAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { detectPoseFromImage, isModelLoading } = usePoseDetection();

  const startAnalysisForImage = useCallback((dataUrl: string) => {
    console.log('[App] startAnalysisForImage called, URL length:', dataUrl.length);
    setImageUrl(dataUrl);
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
    setCurrentStep('analysis');
    console.log('[App] Image set, switching to analysis step');
  }, []);

  const handleCapture = useCallback((dataUrl: string) => {
    startAnalysisForImage(dataUrl);
  }, [startAnalysisForImage]);

  const handleUpload = useCallback((dataUrl: string) => {
    startAnalysisForImage(dataUrl);
  }, [startAnalysisForImage]);

  const handleAnalyze = useCallback(async () => {
    console.log('[App] handleAnalyze called, imageUrl:', imageUrl?.substring(0, 50) + '...');
    if (!imageUrl) {
      console.warn('[App] No imageUrl provided');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    console.log('[App] Starting analysis...');

    try {
      const startTime = performance.now();
      console.log('[App] Detecting pose...');
      const keypoints = await detectPoseFromImage(imageUrl, captureMode);
      const detectTime = performance.now() - startTime;
      console.log('[App] Pose detection completed in', detectTime.toFixed(2), 'ms');
      
      console.log('[App] Analyzing pose...');
      const result = analyzePose(keypoints, { captureMode });
      console.log('[App] ✓ Analysis complete:', result);
      setAnalysisResult(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '分析失败';
      console.error('[App] Analysis error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
      console.log('[App] Analysis finished');
    }
  }, [imageUrl, captureMode, detectPoseFromImage]);

  useEffect(() => {
    console.log('[App] useEffect triggered:', {
      currentStep,
      hasImageUrl: !!imageUrl,
      hasAnalysisResult: !!analysisResult,
      isAnalyzing,
      isModelLoading
    });
    
    if (currentStep === 'analysis' && imageUrl && !analysisResult && !isAnalyzing && !error) {
      console.log('[App] Conditions met for analysis, calling handleAnalyze');
      handleAnalyze();
    } else if (currentStep === 'analysis') {
      console.log('[App] Analysis conditions not met. Reasons:', {
        wrongStep: currentStep !== 'analysis',
        noImage: !imageUrl,
        hasResult: !!analysisResult,
        isStillAnalyzing: isAnalyzing,
        hasError: !!error
      });
    }
  }, [currentStep, imageUrl, analysisResult, isAnalyzing, error, handleAnalyze]);

  const handleRetry = () => {
    setImageUrl('');
    setAnalysisResult(null);
    setError(null);
    setCurrentStep('capture');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">PostureFit</h1>
          <p className="text-sm text-gray-500">AI体态矫正运动搭子</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentStep === 'capture' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              第一步：拍摄或上传照片
            </h2>
            <CameraCapture
              onCapture={handleCapture}
              selectedMode={captureMode}
              onModeChange={setCaptureMode}
              onUploadImage={handleUpload}
            />
          </div>
        )}

        {currentStep === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              第二步：体态分析
            </h2>

            {isAnalyzing || isModelLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">
                  {isModelLoading ? '正在加载AI模型...' : '正在分析体态...'}
                </p>
              </div>
            ) : error ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    重新拍摄
                  </button>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                <div className="max-w-4xl mx-auto">
                  <SkeletonOverlay
                    result={analysisResult}
                    imageUrl={imageUrl}
                    className="aspect-video"
                  />
                </div>

                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">分析结果</h3>
                  
                  <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
                    {analysisResult.supportedIssueTypes.map((issueType) => (
                      <div key={issueType} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {getMetricValue(analysisResult, issueType).toFixed(1)}°
                        </div>
                        <div className="text-sm text-gray-500">{METRIC_LABELS[issueType]}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">体态问题</h4>
                    <div className="space-y-2">
                      {analysisResult.issues.map((issue) => (
                        <div
                          key={issue.type}
                          className={`px-4 py-3 rounded-lg ${
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

                  {analysisResult.score !== undefined && (
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-blue-600">
                        {analysisResult.score}
                      </div>
                      <div className="text-gray-500">体态评分</div>
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentStep('profile')}
                    className="w-full px-6 py-4 bg-blue-500 text-white rounded-xl font-medium text-lg hover:bg-blue-600 transition-colors"
                  >
                    继续选择教练
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {currentStep === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              第三步：选择教练
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center mb-6">
                教练选择功能（由前端B实现）
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setCurrentStep('plan')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  鼓励型
                </button>
                <button
                  onClick={() => setCurrentStep('plan')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  严厉型
                </button>
                <button
                  onClick={() => setCurrentStep('plan')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  幽默型
                </button>
              </div>
              <button
                onClick={() => setCurrentStep('capture')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                上一步
              </button>
            </div>
          </div>
        )}

        {currentStep === 'plan' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              第四步：训练计划
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center mb-6">
                训练计划展示（由前端B实现）
              </p>
              <button
                onClick={() => setCurrentStep('chat')}
                className="w-full px-6 py-4 bg-blue-500 text-white rounded-xl font-medium text-lg hover:bg-blue-600 transition-colors"
              >
                开始训练
              </button>
            </div>
          </div>
        )}

        {currentStep === 'chat' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              第五步：打卡反馈
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center mb-6">
                聊天打卡功能（由前端B实现）
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button className="px-6 py-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors">
                  做完了
                </button>
                <button className="px-6 py-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
                  太累了
                </button>
              </div>
              <button
                onClick={() => setCurrentStep('capture')}
                className="w-full mt-4 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
