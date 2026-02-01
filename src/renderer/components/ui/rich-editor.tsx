import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, ImageIcon, Minus, Plus } from 'lucide-react';

import { cn } from '../../lib/utils';

// Custom resizable image component
function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0 });

  const width = node.attrs.width || 'auto';

  const handleMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const img = imageRef.current;
    if (!img) return;

    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: img.offsetWidth,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startPos.current.x;
      let newWidth = startPos.current.width + (corner.includes('right') ? deltaX : -deltaX);
      newWidth = Math.max(50, Math.min(newWidth, 800)); // Min 50px, max 800px
      updateAttributes({ width: `${newWidth}px` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  const adjustSize = useCallback((delta: number) => {
    const img = imageRef.current;
    if (!img) return;

    const currentWidth = img.offsetWidth;
    let newWidth = currentWidth + delta;
    newWidth = Math.max(50, Math.min(newWidth, 800));
    updateAttributes({ width: `${newWidth}px` });
  }, [updateAttributes]);

  return (
    <NodeViewWrapper className="relative inline-block my-2">
      <div className={cn(
        'relative inline-block group',
        selected && 'ring-2 ring-primary ring-offset-2 rounded',
        isResizing && 'select-none'
      )}>
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={{ width: width !== 'auto' ? width : undefined }}
          className="max-w-full h-auto rounded block"
          draggable={false}
        />

        {/* Resize handles - visible when selected */}
        {selected && (
          <>
            {/* Corner handles */}
            <div
              className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm cursor-se-resize border border-background"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
            />
            <div
              className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm cursor-sw-resize border border-background"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
            />

            {/* Size controls */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-popover border border-border rounded-md shadow-md px-1 py-0.5">
              <button
                type="button"
                onClick={() => adjustSize(-50)}
                className="p-1 hover:bg-muted rounded"
                title="Kleiner"
              >
                <Minus size={14} />
              </button>
              <span className="text-xs px-1 min-w-[50px] text-center">
                {imageRef.current?.offsetWidth || '---'}px
              </span>
              <button
                type="button"
                onClick={() => adjustSize(50)}
                className="p-1 hover:bg-muted rounded"
                title="Größer"
              >
                <Plus size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Custom Image extension with resizing support
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        renderHTML: (attributes) => {
          if (attributes.width === 'auto') return {};
          return { style: `width: ${attributes.width}` };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

type RichEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded hover:bg-muted transition-colors',
        active && 'bg-muted text-primary',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

export function RichEditor({
  value,
  onChange,
  placeholder = 'Schreibe hier...',
  className,
  minHeight = '120px',
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                handleImageFile(file);
              }
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  const handleImageFile = React.useCallback(
    (file: File) => {
      if (!editor) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    },
    [editor],
  );

  const handleImageUpload = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageFile(file);
      }
    };
    input.click();
  }, [handleImageFile]);

  // Sync external value changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('rounded-md border border-input bg-background', className)}>
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Fett (Strg+B)"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Kursiv (Strg+I)"
        >
          <Italic size={16} />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Aufzählung"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Nummerierte Liste"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={handleImageUpload} title="Bild einfügen">
          <ImageIcon size={16} />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2"
        style={{ minHeight }}
      />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror .ProseMirror-selectednode {
          outline: none;
        }
      `}</style>
    </div>
  );
}
