import type { ReactNode } from 'react';

type MarkdownMessageProps = {
  content: string;
  className?: string;
};

// AI 教练回复中常包含的评分段落特征，常见格式如：
// - 📊 体态评分：85分（良好 ✅）
// - 正面问题得分：60分
// - 侧面问题得分：25分
const SCORE_PATTERNS: RegExp[] = [
  /^[\s]*[📊🔢📈✅❌]+[\s]*(体态评分|评分|总分|得分|综合评分)[：:]\s*\d+[\s]*[分分]?/u,
  /^[\s]*[📊🔢📈✅❌]+[\s]*(正面|背面|侧面|整体)[\s]*(问题)?[\s]*(得分|评分|分)[：:]/u,
  /^[\s]*[📊🔢📈✅❌]+[\s]*(问题|评分|综合|总分)[：:]/u,
  /^[\s]*(体态评分|评分|总分|综合评分|整体评分)[：:]\s*\d+/,
  /^[\s]*(正面|背面|侧面|整体)[\s]*(问题)?[\s]*(得分|评分|分)[：:]\s*\d+/,
  /^[\s]*[✅❌][\s]*(良好|一般|严重|轻微|正常)/u,
];

function containsScoreSection(line: string): boolean {
  return SCORE_PATTERNS.some(p => p.test(line.trim()));
}

function removeScoreSection(content: string): string {
  const lines = content.split(/\r?\n/);
  const result: string[] = [];
  let skipMode = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '' || trimmed === '---') {
      skipMode = false;
      result.push(line);
      continue;
    }

    if (containsScoreSection(line)) {
      skipMode = true;
      // 跳过这一行及之后连续的评分相关行
      while (i < lines.length && containsScoreSection(lines[i])) {
        i++;
      }
      i--; // 退回一个，因为 for 循环会再++
      continue;
    }

    if (skipMode) {
      continue;
    }

    result.push(line);
  }

  return result.join('\n').trim();
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenRe = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      nodes.push(<strong key={`${match.index}-strong`} className="font-semibold bg-gradient-to-r from-blush-600 to-mist-600 bg-clip-text text-transparent">{match[2]}</strong>);
    } else if (match[3] && match[4]) {
      nodes.push(
        <a
          key={`${match.index}-link`}
          href={match[4]}
          target="_blank"
          rel="noreferrer"
          className="font-medium bg-gradient-to-r from-blush-500 to-mist-500 bg-clip-text text-transparent underline decoration-blush-200 underline-offset-4 hover:decoration-mist-300 transition-all"
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = tokenRe.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  const cleanedContent = removeScoreSection(content);
  if (!cleanedContent) {
    return <div className={className} />;
  }
  const lines = cleanedContent.split(/\r?\n/);
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    elements.push(
      <ul key={`list-${elements.length}`} className="my-0 list-disc space-y-0.5 pl-4 sm:pl-5">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`} className="text-blush-700">{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      elements.push(<div key={`space-${index}`} className="h-0.5" />);
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      const Tag = heading[1].length === 1 ? 'h3' : 'h4';
      elements.push(
        <Tag key={`heading-${index}`} className="mt-0 font-semibold bg-gradient-to-r from-blush-600 to-mist-600 bg-clip-text text-transparent">
          {renderInline(heading[2])}
        </Tag>
      );
      return;
    }

    const list = trimmed.match(/^[-*]\s+(.+)$/) ?? trimmed.match(/^\d+\.\s+(.+)$/);
    if (list) {
      listItems.push(list[1]);
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${index}`} className="my-0 text-blush-800">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-0 break-words ${className}`}>{elements}</div>;
}
