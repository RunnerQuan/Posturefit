import type { ReactNode } from 'react';

type MarkdownMessageProps = {
  content: string;
  className?: string;
};

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
  const lines = content.split(/\r?\n/);
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    elements.push(
      <ul key={`list-${elements.length}`} className="my-1 list-disc space-y-0.5 pl-5">
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
      elements.push(<div key={`space-${index}`} className="h-1" />);
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      const Tag = heading[1].length === 1 ? 'h3' : 'h4';
      elements.push(
        <Tag key={`heading-${index}`} className="mt-1 font-semibold bg-gradient-to-r from-blush-600 to-mist-600 bg-clip-text text-transparent">
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
      <p key={`p-${index}`} className="my-0.5 text-blush-800">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-0.5 break-words ${className}`}>{elements}</div>;
}
