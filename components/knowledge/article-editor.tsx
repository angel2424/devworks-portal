"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Command,
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  HighlightExtension,
  HorizontalRule,
  StarterKit,
  TaskItem,
  TaskList,
  TiptapUnderline,
  createSuggestionItems,
  handleCommandNavigation,
  renderItems,
  useEditor,
  type EditorInstance,
  type JSONContent,
  type SuggestionItem,
} from "novel";
import Table, { createTable } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import type { KBArticle } from "@/lib/kb-offline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "pending" | "error";

const AUTOSAVE_DELAY = 1500;

// ─── Content helpers ──────────────────────────────────────────────────────────

function parseContent(raw: string | null | undefined): JSONContent | undefined {
  if (!raw || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type === "doc") return parsed as JSONContent;
  } catch {
    // Legacy plain text — wrap in paragraphs for migration
    return {
      type: "doc",
      content: raw.split("\n").map((line) => ({
        type: "paragraph",
        content: line.trim() ? [{ type: "text", text: line }] : undefined,
      })),
    };
  }
  return undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Inserts an empty paragraph after the current top-level block if it's the last block in the document. */
function addTrailingParagraph(editor: EditorInstance) {
  const { state } = editor;
  const { $to } = state.selection;
  try {
    const topBlockEnd = $to.end(1); // end pos of the depth-1 ancestor (table, blockquote, etc.)
    if (topBlockEnd + 1 >= state.doc.content.size) {
      editor.chain().insertContentAt(topBlockEnd + 1, { type: "paragraph" }).run();
    }
  } catch {
    // ignore if position is out of range
  }
}

// ─── Extensions ───────────────────────────────────────────────────────────────

const suggestionItems: SuggestionItem[] = createSuggestionItems([
  {
    title: "Párrafo",
    description: "Texto normal",
    searchTerms: ["texto", "parrafo", "p"],
    icon: <span className="text-xs text-gray-500 font-medium w-4 text-center">P</span>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run(),
  },
  {
    title: "Encabezado 1",
    description: "Título grande",
    searchTerms: ["h1", "titulo", "heading"],
    icon: <span className="text-xs font-bold text-gray-600 w-4 text-center">H1</span>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: "Encabezado 2",
    description: "Subtítulo de sección",
    searchTerms: ["h2", "subtitulo"],
    icon: <span className="text-xs font-bold text-gray-600 w-4 text-center">H2</span>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: "Encabezado 3",
    description: "Subtítulo menor",
    searchTerms: ["h3", "encabezado"],
    icon: <span className="text-xs font-bold text-gray-600 w-4 text-center">H3</span>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: "Lista con viñetas",
    description: "Lista desordenada",
    searchTerms: ["lista", "bullet", "ul"],
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.008v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
      addTrailingParagraph(editor);
    },
  },
  {
    title: "Lista numerada",
    description: "Lista ordenada",
    searchTerms: ["lista", "numerada", "ol"],
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 113.356 1.052 1.125 1.125 0 01-1.357-.551l-.054-.1v0m4.024 3.033v-.99a.375.375 0 01.375-.375H15m0 0a.375.375 0 01.375.375v.99m-5.625 0h5.625" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      addTrailingParagraph(editor);
    },
  },
  {
    title: "Lista de tareas",
    description: "Checkboxes estilo Notion",
    searchTerms: ["task", "tarea", "checkbox", "todo"],
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
      addTrailingParagraph(editor);
    },
  },
  {
    title: "Cita",
    description: "Bloque de cita destacado",
    searchTerms: ["cita", "quote", "blockquote"],
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      addTrailingParagraph(editor);
    },
  },
  {
    title: "Código",
    description: "Bloque de código monoespaciado",
    searchTerms: ["code", "codigo", "bloque"],
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      addTrailingParagraph(editor);
    },
  },
  {
    title: "Separador",
    description: "Línea divisoria horizontal",
    searchTerms: ["divider", "separador", "hr", "linea"],
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      addTrailingParagraph(editor);
    },
  },
  {
    title: "Tabla",
    description: "Tabla con filas y columnas",
    searchTerms: ["tabla", "table", "grid", "columnas", "filas"],
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-17.25m17.25 0h-17.25M3.375 12h17.25" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const tableNode = createTable(editor.schema, 3, 3, true);
      const { tr } = editor.state;
      tr.replaceSelectionWith(tableNode);
      editor.view.dispatch(tr);
      addTrailingParagraph(editor);
    },
  },
]);

// Extensions — stable reference, defined once outside component
const extensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  TiptapUnderline,
  HighlightExtension,
  TaskList,
  TaskItem.configure({ nested: true }),
  TableHeader,
  TableCell,
  TableRow,
  Table.configure({ resizable: false }),
  HorizontalRule,
  Command.configure({
    suggestion: {
      items: ({ query }: { query: string }) =>
        suggestionItems.filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.searchTerms?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
        ),
      render: renderItems,
    },
  }),
];

// ─── Bubble menu items (use useEditor hook for active state) ──────────────────

function BoldItem() {
  const { editor } = useEditor();
  return (
    <EditorBubbleItem
      onSelect={(ed) => ed.chain().focus().toggleBold().run()}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        title="Negrita (⌘B)"
        className={cn(
          "px-2.5 py-1.5 text-xs rounded transition-colors font-bold",
          editor?.isActive("bold")
            ? "bg-brand-50 text-brand-700"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        B
      </button>
    </EditorBubbleItem>
  );
}

function ItalicItem() {
  const { editor } = useEditor();
  return (
    <EditorBubbleItem
      onSelect={(ed) => ed.chain().focus().toggleItalic().run()}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        title="Cursiva (⌘I)"
        className={cn(
          "px-2.5 py-1.5 text-xs rounded transition-colors italic",
          editor?.isActive("italic")
            ? "bg-brand-50 text-brand-700"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        I
      </button>
    </EditorBubbleItem>
  );
}

function UnderlineItem() {
  const { editor } = useEditor();
  return (
    <EditorBubbleItem
      onSelect={(ed) => ed.chain().focus().toggleUnderline().run()}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        title="Subrayado (⌘U)"
        className={cn(
          "px-2.5 py-1.5 text-xs rounded transition-colors underline",
          editor?.isActive("underline")
            ? "bg-brand-50 text-brand-700"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        U
      </button>
    </EditorBubbleItem>
  );
}

function StrikeItem() {
  const { editor } = useEditor();
  return (
    <EditorBubbleItem
      onSelect={(ed) => ed.chain().focus().toggleStrike().run()}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        title="Tachado"
        className={cn(
          "px-2.5 py-1.5 text-xs rounded transition-colors line-through",
          editor?.isActive("strike")
            ? "bg-brand-50 text-brand-700"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        S
      </button>
    </EditorBubbleItem>
  );
}

function CodeItem() {
  const { editor } = useEditor();
  return (
    <EditorBubbleItem
      onSelect={(ed) => ed.chain().focus().toggleCode().run()}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        title="Código inline"
        className={cn(
          "px-2.5 py-1.5 text-xs rounded transition-colors font-mono",
          editor?.isActive("code")
            ? "bg-brand-50 text-brand-700"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        {"</>"}
      </button>
    </EditorBubbleItem>
  );
}

function HighlightItem() {
  const { editor } = useEditor();
  return (
    <EditorBubbleItem
      onSelect={(ed) => ed.chain().focus().toggleHighlight().run()}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        title="Resaltar"
        className={cn(
          "px-2.5 py-1.5 text-xs rounded transition-colors",
          editor?.isActive("highlight")
            ? "bg-brand-100 text-brand-700 font-medium"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        <span className="inline-flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
    </EditorBubbleItem>
  );
}

// ─── Save Indicator ───────────────────────────────────────────────────────────

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const map: Record<SaveStatus, { label: string; color: string }> = {
    idle: { label: "", color: "" },
    saving: { label: "Guardando...", color: "text-gray-400" },
    saved: { label: "Guardado", color: "text-green-500" },
    pending: { label: "Pendiente de sync", color: "text-amber-500" },
    error: { label: "Error al guardar", color: "text-red-500" },
  };

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", map[status].color)}>
      {status === "saving" && (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status === "saved" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
      {status === "pending" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {status === "error" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )}
      <span>{map[status].label}</span>
    </div>
  );
}

// ─── Main ArticleEditor ───────────────────────────────────────────────────────

interface ArticleEditorProps {
  article: KBArticle;
  isOnline: boolean;
  hasPending: boolean;
  onBack: () => void;
  onSave: (id: string, title: string, content: string) => Promise<void>;
}

export function ArticleEditor({
  article,
  isOnline,
  hasPending,
  onBack,
  onSave,
}: ArticleEditorProps) {
  const [title, setTitle] = useState(article.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs hold latest values so the debounced callback always sees fresh data
  const titleRef = useRef(article.title);
  const contentRef = useRef<string>(article.content ?? "");

  // Reset when switching articles
  useEffect(() => {
    setTitle(article.title);
    titleRef.current = article.title;
    contentRef.current = article.content ?? "";
    setSaveStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [article.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");

    debounceRef.current = setTimeout(async () => {
      try {
        await onSave(article.id, titleRef.current, contentRef.current);
        setSaveStatus(isOnline ? "saved" : "pending");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    }, AUTOSAVE_DELAY);
  }, [article.id, isOnline, onSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    triggerSave();
  };

  const handleEditorUpdate = useCallback(
    ({ editor }: { editor: EditorInstance }) => {
      contentRef.current = JSON.stringify(editor.getJSON());
      triggerSave();
    },
    [triggerSave]
  );

  const effectiveStatus: SaveStatus =
    hasPending && saveStatus === "idle" ? "pending" : saveStatus;

  const updatedAt = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(article.updated_at));

  const initialContent = parseContent(article.content);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
        <Button onClick={onBack} variant="ghost" size="sm" className="gap-1.5 text-gray-500 [&_svg]:hover:-translate-x-0.5">
          <svg className="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Button>

        <div className="flex items-center gap-4">
          <SaveIndicator status={effectiveStatus} />
          <span className="text-xs text-gray-400 hidden sm:block">
            Editado {updatedAt}
          </span>
        </div>
      </div>

      {/* Offline notice */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          Sin conexión — los cambios se guardarán cuando vuelva la red
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Título"
            className="w-full text-4xl font-heading font-bold text-gray-900 placeholder:text-gray-200 border-none outline-hidden bg-transparent mb-8 leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          />

          {/* Novel rich text editor — keyed by article.id forces remount on switch */}
          <EditorRoot key={article.id}>
            <EditorContent
              initialContent={initialContent}
              extensions={extensions}
              className="min-h-[400px]"
              editorProps={{
                attributes: { class: "focus:outline-hidden" },
                handleKeyDown: (_view, event) =>
                  handleCommandNavigation(event) ?? false,
              }}
              onUpdate={handleEditorUpdate}
            >
              {/* Slash command dropdown */}
              <EditorCommand className="z-50 h-auto max-h-72 w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 p-1 scrollbar-thin">
                <EditorCommandEmpty className="px-3 py-3 text-sm text-gray-400 text-center">
                  Sin resultados
                </EditorCommandEmpty>
                <EditorCommandList>
                  {suggestionItems.map((item) => (
                    <EditorCommandItem
                      key={item.title}
                      value={item.title}
                      onCommand={({ editor, range }) =>
                        item.command?.({ editor, range })
                      }
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-gray-700 hover:bg-gray-50 aria-selected:bg-brand-50 transition-colors"
                    >
                      <span className="shrink-0 w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 leading-none mb-0.5">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 leading-none truncate">
                          {item.description}
                        </p>
                      </div>
                    </EditorCommandItem>
                  ))}
                </EditorCommandList>
              </EditorCommand>

              {/* Bubble formatting menu */}
              <EditorBubble
                tippyOptions={{ duration: 100, placement: "top" }}
                className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white shadow-lg shadow-gray-200/50 px-1 py-1"
              >
                <BoldItem />
                <ItalicItem />
                <UnderlineItem />
                <StrikeItem />
                <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />
                <CodeItem />
                <HighlightItem />
              </EditorBubble>
            </EditorContent>
          </EditorRoot>
        </div>
      </div>
    </div>
  );
}
