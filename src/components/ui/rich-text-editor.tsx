"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

function ToolbarButton({
  isActive,
  onClick,
  disabled,
  children,
  title,
}: {
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Toggle
      className={cn(
        "h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        disabled && "cursor-not-allowed opacity-50"
      )}
      disabled={disabled}
      onPressedChange={onClick}
      pressed={isActive}
      size="sm"
      title={title}
    >
      {children}
    </Toggle>
  );
}

function LinkButton({ editor }: { editor: Editor | null }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [open, setOpen] = useState(false);

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) {
      return;
    }
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  }, [editor]);

  const isActive = editor?.isActive("link") ?? false;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger>
        <div
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md font-medium text-sm transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isActive && "bg-primary text-primary-foreground"
          )}
          title="Add link"
        >
          <LinkIcon className="h-4 w-4" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="font-medium text-xs">Link URL</label>
            <Input
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setLink();
                }
              }}
              placeholder="https://example.com"
              value={linkUrl}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button className="flex-1" onClick={setLink} size="sm">
              {isActive ? "Update Link" : "Add Link"}
            </Button>
            {isActive && (
              <Button onClick={removeLink} size="sm" variant="destructive">
                Remove
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
      {/* Text formatting */}
      <ToolbarButton
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Lists */}
      <ToolbarButton
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Link */}
      <LinkButton editor={editor} />

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Clear formatting */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        title="Clear formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <ToolbarButton
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Return empty string if editor is empty (just has empty paragraph)
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert min-h-[120px] max-w-none p-3 focus:outline-none",
          "[&_li]:my-0.5 [&_ol]:my-1 [&_p]:my-1 [&_ul]:my-1"
        ),
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (
      editor &&
      value !== editor.getHTML() &&
      value !== (editor.getHTML() === "<p></p>" ? "" : editor.getHTML())
    ) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
