"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/cn";

export const STRUCTURE_TEMPLATE = `## 🎯 Core Takeaway & Thesis

## 💡 AI Studio Discoveries & Deep Dive

## ✍️ My Commentary & Synthesis

## ⏱️ Key Timestamp Moments
`;

export type MarkdownEditorHandle = {
  insertAtCursor(text: string): void;
  wrapSelection(prefix: string, suffix?: string): void;
  focus(): void;
};

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCapture?: () => void;
  className?: string;
}

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      {children}
    </button>
  );
}

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ value, onChange, onCapture, className }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertAtCursor = (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      onChange(value.slice(0, start) + text + value.slice(end));
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      });
    };

    const wrapSelection = (prefix: string, suffix = prefix) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end) || "text";
      onChange(
        value.slice(0, start) + prefix + selected + suffix + value.slice(end),
      );
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selected.length,
        );
      });
    };

    const prefixLine = (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
      requestAnimationFrame(() => textarea.focus());
    };

    useImperativeHandle(ref, () => ({
      insertAtCursor,
      wrapSelection,
      focus: () => textareaRef.current?.focus(),
    }));

    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 px-2 py-1.5 dark:border-neutral-800">
          <ToolbarButton title="Bold" onClick={() => wrapSelection("**")}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => wrapSelection("_")}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" onClick={() => prefixLine("## ")}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" onClick={() => prefixLine("### ")}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Quote" onClick={() => prefixLine("> ")}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Bullet list" onClick={() => prefixLine("- ")}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Inline code" onClick={() => wrapSelection("`")}>
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Link" onClick={() => wrapSelection("[", "](url)")}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertAtCursor(STRUCTURE_TEMPLATE)}
            className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            Insert Structure
          </button>
          {onCapture && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onCapture}
              className="ml-auto whitespace-nowrap rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              Capture Timestamp
            </button>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="Write your commentary, insights, and key moments here…"
          className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-600"
        />
      </div>
    );
  },
);

export default MarkdownEditor;