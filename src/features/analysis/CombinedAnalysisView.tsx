import type { CombinedAnalysisResult, PostureAnalysisResult, PostureIssue, PostureIssueType } from '../../types';
import { ISSUE_LABELS } from '../../data/exercises';
import { SkeletonOverlay } from './SkeletonOverlay';
import { ScoreRing } from '../../components/ScoreRing';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface CombinedAnalysisViewProps {
  frontAnalysis: PostureAnalysisResult | null;
  sideAnalysis: PostureAnalysisResult | null;
  combinedResult: CombinedAnalysisResult | null;
  showDualViews?: boolean;
  frontImageUrl?: string;
  sideImageUrl?: string;
}

/**
 * 获取严重程度对应的颜色
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'normal':
      return 'text-green-700 bg-green-50 border border-green-100';
    case 'mild':
      return 'text-yellow-700 bg-yellow-50 border border-yellow-100';
    case 'moderate':
      return 'text-orange-700 bg-orange-50 border border-orange-100';
    case 'severe':
      return 'text-red-700 bg-red-50 border border-red-100';
    default:
      return 'text-gray-700 bg-gray-50 border border-gray-100';
  }
}

/**
 * 获取严重程度对应的图标
 */
function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'normal':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'mild':
    case 'moderate':
    case 'severe':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
}

/**
 * 单个问题的展示卡片
 */
function IssueCard({ issue }: { issue: PostureIssue }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${getSeverityColor(issue.severity)}`}>
      <div className="flex items-center gap-2.5">
        {getSeverityIcon(issue.severity)}
        <div>
          <p className="font-medium text-sm text-gray-800">{ISSUE_LABELS[issue.type]}</p>
          <p className="text-xs text-gray-500 mt-0.5">{issue.label}</p>
        </div>
      </div>
      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/70 text-gray-600">
        {issue.severity === 'normal' ? '正常' : issue.severity === 'mild' ? '轻度' : issue.severity === 'moderate' ? '中度' : '严重'}
      </span>
    </div>
  );
}

/**
 * 获取主要问题的中文标签
 */
function getPrimaryIssueLabel(issueType: PostureIssueType | null): string {
  if (!issueType) return '无';
  return ISSUE_LABELS[issueType] || issueType;
}

export function CombinedAnalysisView({
  frontAnalysis,
  sideAnalysis,
  combinedResult,
  showDualViews = false,
  frontImageUrl = '',
  sideImageUrl = '',
}: CombinedAnalysisViewProps) {
  // 如果是双视角模式且有合并结果
  if (showDualViews && combinedResult) {
    return (
      <div className="space-y-6">
        {/* 体态评分概览 */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-6">
            <ScoreRing
              score={combinedResult.score}
              primaryIssueLabel={getPrimaryIssueLabel(combinedResult.primaryIssue)}
            />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 mb-1 font-serif">综合体态报告</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">{combinedResult.score.toFixed(1)}</p>
              <p className="text-base text-gray-700 leading-relaxed">
                {combinedResult.score >= 80
                  ? '您的体态状态良好，继续保持规律运动和生活习惯。'
                  : combinedResult.score >= 60
                  ? '您的体态存在轻度偏差，建议针对性的日常矫正练习。'
                  : combinedResult.score >= 40
                  ? '您的体态有中度问题，建议坚持每日矫正训练并改善日常姿势。'
                  : '您的体态问题较为明显，建议系统性的矫正训练并咨询专业理疗师。'}
              </p>
            </div>
          </div>
        </div>

        {/* 双视角骨架图并排展示 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 正面骨架图 */}
          <div>
            <h3 className="text-sm font-medium text-primary-600 mb-2 text-center">正面视图</h3>
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {frontAnalysis ? (
                <SkeletonOverlay
                  result={frontAnalysis}
                  imageUrl={frontImageUrl}
                  className="w-full min-h-[200px]"
                  autoAspectRatio={true}
                  view="front"
                />
              ) : (
                <div className="w-full min-h-[200px] bg-gray-50 rounded-2xl flex items-center justify-center">
                  <p className="text-gray-400">未拍摄正面照</p>
                </div>
              )}
            </div>
          </div>

          {/* 侧面骨架图 */}
          <div>
            <h3 className="text-sm font-medium text-primary-600 mb-2 text-center">侧面视图</h3>
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {sideAnalysis ? (
                <SkeletonOverlay
                  result={sideAnalysis}
                  imageUrl={sideImageUrl}
                  className="w-full min-h-[200px]"
                  autoAspectRatio={true}
                  view="side"
                />
              ) : (
                <div className="w-full min-h-[200px] bg-gray-50 rounded-2xl flex items-center justify-center">
                  <p className="text-gray-400">未拍摄侧面照</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 分组问题列表 */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-700">检测到的体态问题</h3>

          {/* 正面问题 */}
          {combinedResult.issuesByView.front.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-400" />
                正面检测
              </h4>
              <div className="space-y-2">
                {combinedResult.issuesByView.front.map((issue, index) => (
                  <IssueCard key={`front-${issue.type}-${index}`} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* 侧面问题 */}
          {combinedResult.issuesByView.side.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                侧面检测
              </h4>
              <div className="space-y-2">
                {combinedResult.issuesByView.side.map((issue, index) => (
                  <IssueCard key={`side-${issue.type}-${index}`} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* 无问题提示 */}
          {combinedResult.allIssues.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl shadow-card">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-gray-600 font-medium">恭喜！未检测到明显体态问题</p>
              <p className="text-sm text-gray-400 mt-1">继续保持良好的站姿和坐姿习惯</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 单视角模式（向后兼容）
  const analysis = frontAnalysis || sideAnalysis;
  const analysisView = frontAnalysis ? 'front' : 'side';
  if (!analysis) {
    return (
      <div className="text-center py-8 text-gray-400 bg-white rounded-2xl shadow-card">
        <p>暂无分析数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 评分概览 */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-base font-medium text-gray-700 mb-4">分析结果</h3>
        <div className="flex items-center gap-6">
          <ScoreRing
            score={analysis.score ?? 0}
            primaryIssueLabel={getPrimaryIssueLabel(analysis.primaryIssue)}
          />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">体态评分</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">{(analysis.score ?? 0).toFixed(1)}</p>
            <p className="text-base text-gray-700 leading-relaxed">
              {(analysis.score ?? 0) >= 80
                ? '您的体态状态良好，继续保持。'
                : (analysis.score ?? 0) >= 60
                ? '您的体态存在轻度偏差，建议日常矫正练习。'
                : (analysis.score ?? 0) >= 40
                ? '您的体态有中度问题，建议坚持每日矫正训练。'
                : '您的体态问题较为明显，建议系统性的矫正训练。'}
            </p>
          </div>
        </div>
      </div>

      {/* 骨架图 */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <SkeletonOverlay
          result={analysis}
          imageUrl={frontImageUrl || sideImageUrl}
          className="max-h-[400px] w-full"
          autoAspectRatio={true}
          view={analysisView}
        />
      </div>

      {/* 问题列表 */}
      <div className="space-y-2">
        <h3 className="text-base font-medium text-gray-700">检测结果</h3>
        {analysis.issues.map((issue, index) => (
          <IssueCard key={index} issue={issue} />
        ))}
      </div>
    </div>
  );
}

export { IssueCard, getSeverityColor, getSeverityIcon };
