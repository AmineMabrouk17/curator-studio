"use client";

import type { Root } from "hast";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { TIMESTAMP_RE, parseTimestampToSeconds } from "@/lib/youtube";
import { cn } from "@/lib/cn";

function rehypeTimestampBadges() {
  return (tree: Root) => {
    const edits: Array<{
      parent: { children: Array<unknown>; [key: string]: unknown };
      index: number;
      value: string;
    }> = [];
    visit(tree, "text", (node: { value: string }, index, parent) => {
      if (!parent || (parent as { tagName?: string }).tagName === "code") return;
      if (!TIMESTAMP_RE.test(node.value)) return;
      edits.push({
        parent: parent as { children: Array<unknown> },
        index: index ?? 0,
        value: node.value,
      });
    });
    for (const { parent, index, value } of edits) {
      const children: Array<unknown> = [];
      let lastIndex = 0;
      TIMESTAMP_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = TIMESTAMP_RE.exec(value)) !== null) {
        if (match.index > lastIndex) {
          children.push({ type: "text", value: value.slice(lastIndex, match.index) });
        }
        const raw = match[0];
        const seconds = parseTimestampToSeconds(raw.replace(/[\[\]]/g, ""));
        children.push({
          type: "element",
          tagName: "span",
          properties: { "data-seconds": String(seconds) },
          children: [{ type: "text", value: raw }],
        });
        lastIndex = match.index + raw.length;
      }
      if (lastIndex < value.length) {
        children.push({ type: "text", value: value.slice(lastIndex) });
      }
      parent.children.splice(index, 1, ...children);
    }
  };
}

interface TimestampBadgeProps {
  seconds: number;
  raw: string;
  onTimestampClick?: (seconds: number) => void;
}

export function TimestampBadge({ seconds, raw, onTimestampClick }: TimestampBadgeProps) {
  const interactive = Boolean(onTimestampClick);
  return (
    <button
      type="button"
      data-seconds={seconds}
      disabled={!interactive}
      onClick={() => onTimestampClick?.(seconds)}
      title={interactive ? "Jump to this moment" : undefined}
      className={cn(
        "mx-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 align-middle text-xs font-semibold tabular-nums",
        "border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300",
        interactive &&
          "cursor-pointer transition hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20",
        !interactive && "cursor-default",
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {raw}
    </button>
  );
}

interface MarkdownRendererProps {
  content: string;
  onTimestampClick?: (seconds: number) => void;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  onTimestampClick,
  className,
}: MarkdownRendererProps) {
  const components: Components = {
    span: (props) => {
      const seconds = props.node?.properties?.["data-seconds"];
      if (typeof seconds === "string") {
        const raw =
          (props.node?.children?.[0] as { value?: string } | undefined)?.value ??
          `[${seconds}]`;
        return (
          <TimestampBadge seconds={Number(seconds)} raw={raw} onTimestampClick={onTimestampClick} />
        );
      }
      return <span {...props} />;
    },
  };

  return (
    <div className={cn("md-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeTimestampBadges]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}