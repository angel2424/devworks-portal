"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type KBArticle,
  type KBFolder,
  addCachedArticle,
  addCachedFolder,
  getCachedArticles,
  getCachedFolders,
  getLastSynced,
  getPendingUpdates,
  queuePendingUpdate,
  removeCachedArticle,
  removeCachedFolder,
  removePendingUpdate,
  syncArticles,
  syncFolders,
  updateCachedArticle,
} from "@/lib/kb-offline";
import {
  createArticle,
  createFolder,
  deleteArticle,
  deleteFolder,
  moveArticle,
  renameFolder,
  updateArticle,
} from "@/app/(dashboard)/dashboard/knowledge/actions";
import { ArticleEditor } from "@/components/knowledge/article-editor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "list" | "editor";
type FolderNode = KBFolder & { children: FolderNode[] };

// ─── Build Folder Tree ────────────────────────────────────────────────────────

function buildFolderTree(folders: KBFolder[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  for (const f of folders) map.set(f.id, { ...f, children: [] });
  const roots: FolderNode[] = [];
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sort = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

// ─── Offline Badge ────────────────────────────────────────────────────────────

function OfflineBadge({
  isOnline,
  lastSynced,
  hasPending,
}: {
  isOnline: boolean;
  lastSynced: string | null;
  hasPending: boolean;
}) {
  if (isOnline && !hasPending) return null;

  const label = !isOnline
    ? "Sin conexión — mostrando caché"
    : "Sincronizando cambios...";

  const formatted = lastSynced
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(lastSynced))
    : null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
        !isOnline
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-blue-50 border-blue-200 text-blue-700"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          !isOnline ? "bg-amber-400 animate-pulse" : "bg-blue-400 animate-spin"
        )}
      />
      {label}
      {!isOnline && formatted && (
        <span className="opacity-60">· {formatted}</span>
      )}
    </div>
  );
}

// ─── New Folder Dialog ────────────────────────────────────────────────────────

function NewFolderDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6">
        <h3 className="font-heading text-gray-900 mb-4">
          Nueva carpeta
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onConfirm(name);
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Nombre de la carpeta"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" onClick={() => name.trim() && onConfirm(name)} disabled={!name.trim()}>Crear</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename Dialog ────────────────────────────────────────────────────────────

function RenameDialog({
  current,
  title = "Renombrar",
  onConfirm,
  onCancel,
}: {
  current: string;
  title?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(current);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6">
        <h3 className="font-heading text-gray-900 mb-4">
          {title}
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onConfirm(name);
            if (e.key === "Escape") onCancel();
          }}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" onClick={() => name.trim() && onConfirm(name)} disabled={!name.trim()}>Guardar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Folder Tree Node ─────────────────────────────────────────────────────────

function FolderTreeNode({
  node,
  depth,
  selectedFolderId,
  expandedFolders,
  articleCountByFolder,
  isOnline,
  isDraggingActive,
  onSelectFolder,
  onToggleExpand,
  onRename,
  onDelete,
  onDropArticle,
}: {
  node: FolderNode;
  depth: number;
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  articleCountByFolder: Record<string, number>;
  isOnline: boolean;
  isDraggingActive: boolean;
  onSelectFolder: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onRename: (folder: KBFolder) => void;
  onDelete: (id: string) => void;
  onDropArticle: (articleId: string, folderId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  const isSelected = selectedFolderId === node.id;
  const isExpanded = expandedFolders.has(node.id);
  const hasChildren = node.children.length > 0;
  const articleCount = articleCountByFolder[node.id] ?? 0;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <>
      <div
        className={cn("relative group", menuOpen && "z-20")}
        style={{ paddingLeft: depth * 12 }}
      >
        <div
          className="flex items-center gap-0.5"
          onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragOver(true); }}
          onDragLeave={() => { if (--dragCounter.current === 0) setIsDragOver(false); }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={(e) => {
            e.preventDefault();
            dragCounter.current = 0;
            setIsDragOver(false);
            const articleId = e.dataTransfer.getData("text/plain");
            if (articleId) onDropArticle(articleId, node.id);
          }}
        >
          <button
            onClick={() => hasChildren && onToggleExpand(node.id)}
            className={cn(
              "w-4 h-4 shrink-0 flex items-center justify-center rounded transition-colors",
              hasChildren
                ? "text-gray-400 hover:text-gray-600 hover:bg-black/5 cursor-pointer"
                : "pointer-events-none text-transparent"
            )}
          >
            <svg
              className={cn("w-2.5 h-2.5 transition-transform", isExpanded && "rotate-90")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => onSelectFolder(node.id)}
            className={cn(
              "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all text-left cursor-pointer min-w-0 pr-6",
              isSelected
                ? "bg-brand-50 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              isDragOver && isDraggingActive && "ring-2 ring-brand-400 bg-brand-50 text-gray-900"
            )}
          >
            <svg
              className={cn("w-4 h-4 shrink-0 transition-colors", isSelected ? "text-brand-500" : "text-gray-400")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
            <span className="flex-1 truncate">{node.name}</span>
            {articleCount > 0 && (
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full shrink-0", isSelected ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500")}>
                {articleCount}
              </span>
            )}
          </button>
        </div>

        {isOnline && (
          <div ref={menuRef} className="absolute right-1 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-7 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start rounded-none text-gray-700"
                  onClick={() => { setMenuOpen(false); onRename(node); }}
                >
                  Renombrar
                </Button>
                <Button
                  variant="ghost-destructive"
                  size="sm"
                  className="w-full justify-start rounded-none"
                  onClick={() => { setMenuOpen(false); onDelete(node.id); }}
                >
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && node.children.map((child) => (
        <FolderTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedFolderId={selectedFolderId}
          expandedFolders={expandedFolders}
          articleCountByFolder={articleCountByFolder}
          isOnline={isOnline}
          isDraggingActive={isDraggingActive}
          onSelectFolder={onSelectFolder}
          onToggleExpand={onToggleExpand}
          onRename={onRename}
          onDelete={onDelete}
          onDropArticle={onDropArticle}
        />
      ))}
    </>
  );
}

// ─── Folder Row (notes list) ──────────────────────────────────────────────────

function FolderRow({
  folder,
  articleCount,
  isDraggingActive,
  onClick,
  onDropArticle,
}: {
  folder: KBFolder;
  articleCount: number;
  isDraggingActive: boolean;
  onClick: () => void;
  onDropArticle: (articleId: string, folderId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg",
        isDragOver && isDraggingActive && "ring-2 ring-inset ring-brand-400 bg-brand-50"
      )}
      onClick={onClick}
      onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragOver(true); }}
      onDragLeave={() => { if (--dragCounter.current === 0) setIsDragOver(false); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragOver(false);
        const articleId = e.dataTransfer.getData("text/plain");
        if (articleId) onDropArticle(articleId, folder.id);
      }}
    >
      <div className="shrink-0 w-7 h-7 rounded-md bg-brand-50 flex items-center justify-center">
        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{folder.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {articleCount} nota{articleCount !== 1 ? "s" : ""}
        </p>
      </div>
      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
}

// ─── Article Row ──────────────────────────────────────────────────────────────

function ArticleRow({
  article,
  isSelected,
  isOnline,
  isBeingDragged,
  onClick,
  onDragStart,
  onDragEnd,
  onRename,
  onDelete,
}: {
  article: KBArticle;
  isSelected: boolean;
  isOnline: boolean;
  isBeingDragged: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const wordCount = article.content
    ? article.content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const updatedAt = new Intl.DateTimeFormat("es", {
    dateStyle: "short",
  }).format(new Date(article.updated_at));

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      draggable={isOnline && !menuOpen}
      className={cn(
        "relative group flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-100 last:border-0 transition-colors first:rounded-t-lg last:rounded-b-lg",
        isSelected ? "bg-brand-50" : "hover:bg-gray-50",
        menuOpen && "z-20",
        isBeingDragged && "opacity-40"
      )}
      onClick={onClick}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", article.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      {/* Doc icon */}
      <div
        className={cn(
          "shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center",
          isSelected ? "bg-brand-100" : "bg-gray-100"
        )}
      >
        <svg
          className={cn(
            "w-4 h-4",
            isSelected ? "text-brand-600" : "text-gray-400"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isSelected ? "text-gray-900" : "text-gray-800"
          )}
        >
          {article.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {updatedAt}
          {wordCount > 0 && <span className="ml-2">{wordCount} palabras</span>}
        </p>
      </div>

      {/* Context menu */}
      {isOnline && (
        <div
          ref={menuRef}
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </Button>

          {menuOpen && (
            <div className="absolute right-3 top-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-none text-gray-700"
                onClick={() => { setMenuOpen(false); onRename(); }}
              >
                Renombrar
              </Button>
              <Button
                variant="ghost-destructive"
                size="sm"
                className="w-full justify-start rounded-none"
                onClick={() => { setMenuOpen(false); onDelete(); }}
              >
                Eliminar nota
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main KB Browser ──────────────────────────────────────────────────────────

export function KBBrowser() {
  const [folders, setFolders] = useState<KBFolder[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [view, setView] = useState<View>("list");
  const [mobilePanel, setMobilePanel] = useState<"folders" | "articles" | "editor">("folders");
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [hasPending, setHasPending] = useState(false);

  // Folder tree
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  // Dialogs
  const [newFolderParentId, setNewFolderParentId] = useState<string | null | undefined>(undefined);
  const [renaming, setRenaming] = useState<KBFolder | null>(null);
  const [renamingArticle, setRenamingArticle] = useState<KBArticle | null>(null);

  // Drag & drop
  const [draggingArticleId, setDraggingArticleId] = useState<string | null>(null);
  const [isDragOverUnfiled, setIsDragOverUnfiled] = useState(false);
  const unfiledDragCounter = useRef(0);

  // ── Online/offline detection ──────────────────────────────────────────────

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Flush pending saves when reconnected ─────────────────────────────────

  const flushPending = useCallback(async () => {
    const pending = await getPendingUpdates();
    if (pending.length === 0) return;

    setHasPending(true);
    for (const p of pending) {
      try {
        const updated = await updateArticle(p.id, p.title, p.content);
        await updateCachedArticle(updated);
        await removePendingUpdate(p.id);
        // Patch in-memory state
        setArticles((prev) =>
          prev.map((a) => (a.id === p.id ? updated : a))
        );
      } catch {
        // Keep in queue, try next time
      }
    }
    setHasPending(false);
  }, []);

  useEffect(() => {
    if (isOnline) flushPending();
  }, [isOnline, flushPending]);

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadFromNetwork = useCallback(async () => {
    const supabase = createClient();
    const [{ data: foldersData }, { data: articlesData }] = await Promise.all([
      supabase.from("kb_folders").select("*").order("name"),
      supabase.from("kb_articles").select("*").order("updated_at", { ascending: false }),
    ]);

    if (foldersData) {
      setFolders(foldersData as KBFolder[]);
      await syncFolders(foldersData as KBFolder[]);
    }
    if (articlesData) {
      setArticles(articlesData as KBArticle[]);
      await syncArticles(articlesData as KBArticle[]);
    }
  }, []);

  const loadFromCache = useCallback(async () => {
    const [cachedFolders, cachedArticles, synced] = await Promise.all([
      getCachedFolders(),
      getCachedArticles(),
      getLastSynced(),
    ]);
    if (cachedFolders.length > 0) setFolders(cachedFolders);
    if (cachedArticles.length > 0) setArticles(cachedArticles);
    setLastSynced(synced);
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      // Always load cache first (instant)
      await loadFromCache();

      // Then try network
      if (navigator.onLine) {
        try {
          await loadFromNetwork();
          const synced = await getLastSynced();
          setLastSynced(synced);
        } catch {
          // Network failed, cache already loaded
        }
      }

      setIsLoading(false);

      // Restore last open article
      const savedId = localStorage.getItem("kb:lastArticleId");
      if (savedId) {
        setArticles((current) => {
          const found = current.find((a) => a.id === savedId);
          if (found) {
            setSelectedArticle(found);
            setView("editor");
            setMobilePanel("editor");
          }
          return current;
        });
      }
    };
    init();
  }, [loadFromCache, loadFromNetwork]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const selectedFolderArticles = (selectedFolderId
    ? articles.filter((a) => a.folder_id === selectedFolderId)
    : articles.filter((a) => a.folder_id === null)
  ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const articleCountByFolder = folders.reduce<Record<string, number>>(
    (acc, f) => {
      acc[f.id] = articles.filter((a) => a.folder_id === f.id).length;
      return acc;
    },
    {}
  );

  const childFolders = selectedFolderId
    ? folders
        .filter((f) => f.parent_id === selectedFolderId)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const unfiled = articles.filter((a) => a.folder_id === null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNewFolder = async (name: string) => {
    const parentId = newFolderParentId ?? null;
    setNewFolderParentId(undefined);
    if (!isOnline) return;
    try {
      const folder = await createFolder(name, parentId);
      setFolders((prev) => [...prev, folder]);
      await addCachedFolder(folder);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameFolder = async (name: string) => {
    if (!renaming || !isOnline) return;
    const id = renaming.id;
    setRenaming(null);
    try {
      await renameFolder(id, name);
      setFolders((prev) =>
        prev
          .map((f) => (f.id === id ? { ...f, name } : f))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameArticle = async (title: string) => {
    if (!renamingArticle || !isOnline) return;
    const id = renamingArticle.id;
    const content = renamingArticle.content ?? "";
    setRenamingArticle(null);
    try {
      const updated = await updateArticle(id, title, content);
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
      await updateCachedArticle(updated);
      if (selectedArticle?.id === id) setSelectedArticle(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!isOnline) return;
    const toDelete = new Set<string>();
    const collect = (fid: string) => {
      toDelete.add(fid);
      folders.filter((f) => f.parent_id === fid).forEach((f) => collect(f.id));
    };
    collect(id);
    const confirmed = window.confirm(
      toDelete.size > 1
        ? "¿Eliminar esta carpeta y todas sus subcarpetas? Los artículos dentro quedarán sin carpeta."
        : "¿Eliminar esta carpeta? Los artículos dentro quedarán sin carpeta."
    );
    if (!confirmed) return;
    try {
      await deleteFolder(id);
      setFolders((prev) => prev.filter((f) => !toDelete.has(f.id)));
      setArticles((prev) =>
        prev.map((a) => (toDelete.has(a.folder_id ?? "") ? { ...a, folder_id: null } : a))
      );
      if (selectedFolderId && toDelete.has(selectedFolderId)) setSelectedFolderId(null);
      for (const fid of toDelete) await removeCachedFolder(fid);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewArticle = async () => {
    if (!isOnline) return;
    try {
      const article = await createArticle("Nueva nota", selectedFolderId);
      setArticles((prev) => [article, ...prev]);
      await addCachedArticle(article);
      setSelectedArticle(article);
      setView("editor");
      setMobilePanel("editor");
      localStorage.setItem("kb:lastArticleId", article.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!isOnline) return;
    const confirmed = window.confirm("¿Eliminar esta nota?");
    if (!confirmed) return;
    try {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      await removeCachedArticle(id);
      if (selectedArticle?.id === id) {
        setSelectedArticle(null);
        setView("list");
        setMobilePanel("articles");
        localStorage.removeItem("kb:lastArticleId");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveArticle = async (
    id: string,
    title: string,
    content: string
  ) => {
    // Optimistically update local state and cache
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, title, content, updated_at: new Date().toISOString() }
          : a
      )
    );

    if (!isOnline) {
      // Queue for later sync
      await queuePendingUpdate({ id, title, content, timestamp: Date.now() });
      await updateCachedArticle({
        ...(articles.find((a) => a.id === id) as KBArticle),
        title,
        content,
        updated_at: new Date().toISOString(),
      });
      setHasPending(true);
      return;
    }

    try {
      const updated = await updateArticle(id, title, content);
      setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
      await updateCachedArticle(updated);
    } catch {
      // Network blip — queue it
      await queuePendingUpdate({ id, title, content, timestamp: Date.now() });
      setHasPending(true);
    }
  };

  const handleDropOnFolder = async (articleId: string, folderId: string | null) => {
    const article = articles.find((a) => a.id === articleId);
    if (!article || article.folder_id === folderId) return;
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, folder_id: folderId } : a))
    );
    try {
      await moveArticle(articleId, folderId);
    } catch (e) {
      console.error(e);
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, folder_id: article.folder_id } : a))
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading && folders.length === 0 && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <svg
          className="w-5 h-5 animate-spin mr-2"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-sm">Cargando base de conocimiento...</span>
      </div>
    );
  }

  return (
    <>
      {/* Page header — hidden on mobile when editing */}
      <div className={cn(
        "px-6 py-5 border-b border-gray-200 bg-white shrink-0",
        mobilePanel === "editor" ? "hidden md:block" : "block"
      )}>
        <h1 className="font-heading text-2xl text-gray-900 leading-none mb-1">
          Knowledge Base
        </h1>
        <p className="text-sm text-gray-500">
          Documentación y notas del equipo. Disponible sin conexión.
        </p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">

      {newFolderParentId !== undefined && (
        <NewFolderDialog
          onConfirm={handleNewFolder}
          onCancel={() => setNewFolderParentId(undefined)}
        />
      )}

      {renaming && (
        <RenameDialog
          current={renaming.name}
          title="Renombrar carpeta"
          onConfirm={handleRenameFolder}
          onCancel={() => setRenaming(null)}
        />
      )}

      {renamingArticle && (
        <RenameDialog
          current={renamingArticle.title}
          title="Renombrar nota"
          onConfirm={handleRenameArticle}
          onCancel={() => setRenamingArticle(null)}
        />
      )}

      <div className="flex h-full">
        {/* ── Left sidebar: Folder tree ── */}
        <aside className={cn(
          "shrink-0 border-r border-gray-200 bg-white flex-col w-full md:w-56",
          mobilePanel === "folders" ? "flex" : "hidden",
          "md:flex"
        )}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Carpetas
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => isOnline && setNewFolderParentId(null)}
              disabled={!isOnline}
              title="Nueva carpeta"
              className="hover:text-brand-500 hover:bg-brand-50 rounded-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </Button>
          </div>

          {/* Folder list */}
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {/* "Sin carpeta" entry */}
            <button
              onClick={() => { setSelectedFolderId(null); setMobilePanel("articles"); }}
              onDragEnter={(e) => { e.preventDefault(); unfiledDragCounter.current++; setIsDragOverUnfiled(true); }}
              onDragLeave={() => { if (--unfiledDragCounter.current === 0) setIsDragOverUnfiled(false); }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => {
                e.preventDefault();
                unfiledDragCounter.current = 0;
                setIsDragOverUnfiled(false);
                const articleId = e.dataTransfer.getData("text/plain");
                if (articleId) handleDropOnFolder(articleId, null);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left cursor-pointer",
                selectedFolderId === null
                  ? "bg-brand-50 text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                isDragOverUnfiled && draggingArticleId && "ring-2 ring-brand-400 bg-brand-50 text-gray-900"
              )}
            >
              <svg
                className={cn(
                  "w-4 h-4 shrink-0",
                  selectedFolderId === null ? "text-brand-500" : "text-gray-300"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
              <span className="flex-1 truncate">Sin carpeta</span>
              {unfiled.length > 0 && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    selectedFolderId === null
                      ? "bg-brand-100 text-brand-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {unfiled.length}
                </span>
              )}
            </button>

            {folderTree.map((node) => (
              <FolderTreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedFolderId={selectedFolderId}
                expandedFolders={expandedFolders}
                articleCountByFolder={articleCountByFolder}
                isOnline={isOnline}
                isDraggingActive={draggingArticleId !== null}
                onSelectFolder={(fid) => { setSelectedFolderId(fid); setView("list"); setMobilePanel("articles"); }}
                onToggleExpand={(fid) =>
                  setExpandedFolders((prev) => {
                    const next = new Set(prev);
                    if (next.has(fid)) next.delete(fid); else next.add(fid);
                    return next;
                  })
                }
                onRename={(folder) => setRenaming(folder)}
                onDelete={handleDeleteFolder}
                onDropArticle={handleDropOnFolder}
              />
            ))}

            {folders.length === 0 && (
              <p className="px-3 py-4 text-xs text-gray-400 text-center">
                Sin carpetas aún
              </p>
            )}
          </nav>
        </aside>

        {/* ── Right panel ── */}
        <div className={cn(
          "flex-col min-w-0 bg-gray-50 flex-1",
          mobilePanel !== "folders" ? "flex" : "hidden",
          "md:flex"
        )}>
          {view === "list" ? (
            <>
              {/* Article list header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setMobilePanel("folders")}
                    className="md:hidden mr-1 rounded-md"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </Button>
                  <h2 className="font-heading text-gray-900 text-sm">
                    {selectedFolderId
                      ? folders.find((f) => f.id === selectedFolderId)?.name ??
                        "Carpeta"
                      : "Sin carpeta"}
                  </h2>
                  <span className="text-xs text-gray-400">
                    {selectedFolderArticles.length} nota
                    {selectedFolderArticles.length !== 1 ? "s" : ""}
                  </span>
                  <OfflineBadge
                    isOnline={isOnline}
                    lastSynced={lastSynced}
                    hasPending={hasPending}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => isOnline && setNewFolderParentId(selectedFolderId)} disabled={!isOnline}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    Agregar carpeta
                  </Button>
                  <Button size="sm" onClick={handleNewArticle} disabled={!isOnline}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nueva nota
                  </Button>
                </div>
              </div>

              {/* Article list */}
              <div className="flex-1 overflow-y-auto">
                {childFolders.length === 0 && selectedFolderArticles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Sin notas aquí
                    </p>
                    {isOnline && (
                      <p className="text-xs text-gray-400">
                        Crea una nota para empezar
                      </p>
                    )}
                    {!isOnline && (
                      <p className="text-xs text-amber-500">
                        Sin conexión — las notas se cargan desde caché
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {childFolders.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200">
                        {childFolders.map((folder) => (
                          <FolderRow
                            key={folder.id}
                            folder={folder}
                            articleCount={articleCountByFolder[folder.id] ?? 0}
                            isDraggingActive={draggingArticleId !== null}
                            onClick={() => { setSelectedFolderId(folder.id); setMobilePanel("articles"); }}
                            onDropArticle={handleDropOnFolder}
                          />
                        ))}
                      </div>
                    )}
                    {selectedFolderArticles.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200">
                        {selectedFolderArticles.map((article) => (
                          <ArticleRow
                            key={article.id}
                            article={article}
                            isSelected={selectedArticle?.id === article.id}
                            isOnline={isOnline}
                            isBeingDragged={draggingArticleId === article.id}
                            onClick={() => {
                              setSelectedArticle(article);
                              setView("editor");
                              setMobilePanel("editor");
                              localStorage.setItem("kb:lastArticleId", article.id);
                            }}
                            onDragStart={() => setDraggingArticleId(article.id)}
                            onDragEnd={() => setDraggingArticleId(null)}
                            onRename={() => setRenamingArticle(article)}
                            onDelete={() => handleDeleteArticle(article.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            selectedArticle && (
              <ArticleEditor
                article={selectedArticle}
                isOnline={isOnline}
                hasPending={hasPending}
                onBack={() => { setView("list"); setMobilePanel("articles"); localStorage.removeItem("kb:lastArticleId"); }}
                onSave={handleSaveArticle}
              />
            )
          )}
        </div>
      </div>

      </div>
    </>
  );
}
