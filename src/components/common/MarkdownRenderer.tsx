import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by newlines to render blocks
  const lines = content.split('\n');

  const renderFormattedText = (text: string) => {
    // Process bold (**text**), inline code (`code`), and italics (*text*)
    const parts: (string | React.ReactNode)[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-[11px]">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-slate-300">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`space-y-1.5 text-slate-200 ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // H3: ### Header
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-emerald-400 mt-2 mb-1">
              {renderFormattedText(trimmed.slice(4))}
            </h4>
          );
        }

        // H2: ## Header
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm font-black text-white mt-2.5 mb-1 pb-0.5 border-b border-white/10">
              {renderFormattedText(trimmed.slice(3))}
            </h3>
          );
        }

        // H1: # Header
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-base font-black text-white mt-3 mb-1.5">
              {renderFormattedText(trimmed.slice(2))}
            </h2>
          );
        }

        // Unordered list items: - or * or •
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const bulletContent = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 pl-1">
              <span className="text-emerald-400 mt-0.5 text-[10px] shrink-0">•</span>
              <span className="leading-relaxed">{renderFormattedText(bulletContent)}</span>
            </div>
          );
        }

        // Numbered list items: 1. or 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 pl-1">
              <span className="text-emerald-400 font-bold font-mono text-[11px] shrink-0">{numMatch[1]}.</span>
              <span className="leading-relaxed">{renderFormattedText(numMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-xs leading-relaxed text-slate-300">
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
