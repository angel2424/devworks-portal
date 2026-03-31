"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Parser ───────────────────────────────────────────────────────────────────

function toMinutes(raw: string): number | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\bhoras?\b/g, "h")
    .replace(/\bhour(s)?\b/g, "h")
    .replace(/\bhr(s)?\b/g, "h")
    .replace(/\bminutos?\b/g, "min")
    .replace(/\bminutes?\b/g, "min")
    .replace(/\bmins?\b/g, "min")
    .replace(/\s+/g, " ")
    .trim();

  // "1h 30min" / "1h30m" / "1h30"
  const hm = s.match(/^(\d+(?:\.\d+)?)\s*h\s*(\d+)\s*(?:min)?$/);
  if (hm) return parseFloat(hm[1]) * 60 + parseInt(hm[2]);

  // "1:30"
  const colon = s.match(/^(\d+):(\d{1,2})$/);
  if (colon) return parseInt(colon[1]) * 60 + parseInt(colon[2]);

  // "1.5h" / "2 h"
  const h = s.match(/^(\d+(?:\.\d+)?)\s*h$/);
  if (h) return parseFloat(h[1]) * 60;

  // "30min" / "20 min"
  const m = s.match(/^(\d+)\s*min$/);
  if (m) return parseInt(m[1]);

  // bare number → treat as minutes
  const n = s.match(/^(\d+)$/);
  if (n) return parseInt(n[1]);

  return null;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function parseDuration(raw: string): string | null {
  if (!raw.trim()) return null;
  const mins = toMinutes(raw);
  return mins !== null ? formatMinutes(mins) : raw.trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DurationInputProps {
  value: string | null;
  onChange: (formatted: string | null) => void;
  placeholder?: string;
  /** "inline" = click-to-edit chip style; "field" = always-visible text input */
  variant?: "inline" | "field";
  className?: string;
  disabled?: boolean;
}

export function DurationInput({
  value,
  onChange,
  placeholder = "Duración",
  variant = "inline",
  className,
  disabled = false,
}: DurationInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (disabled) return;
    setDraft(value ?? "");
    setEditing(true);
    // Focus happens via autoFocus
  }

  function commit() {
    setEditing(false);
    const result = draft.trim() ? parseDuration(draft) : null;
    if (result !== value) onChange(result);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setEditing(false); }
  }

  // ── Field variant (always shows as text input) ──────────────────────────────
  if (variant === "field") {
    if (editing) {
      return (
        <div className={cn("relative", className)}>
          <ClockIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder="20min, 1h, 1h30…"
            className="w-full pl-7 pr-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 bg-white border border-brand-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
          />
        </div>
      );
    }

    return (
      <div className={cn("relative", className)}>
        <ClockIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        <button
          type="button"
          onClick={startEdit}
          disabled={disabled}
          className="w-full pl-7 pr-3 py-1.5 text-xs text-left bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {value ? (
            <span className="text-gray-700">{value}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </button>
      </div>
    );
  }

  // ── Inline variant (chip → input on click) ──────────────────────────────────
  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder="20min, 1h…"
        className={cn(
          "w-24 text-xs text-gray-700 placeholder:text-gray-300 bg-transparent border-b border-brand-400 focus:outline-none py-0.5",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      title="Editar duración"
      className={cn(
        "flex items-center gap-1 text-xs transition-colors group/dur",
        value
          ? "text-gray-400 hover:text-gray-600"
          : "text-gray-300 hover:text-gray-400",
        disabled && "cursor-default opacity-50",
        className
      )}
    >
      <ClockIcon className="w-3 h-3 shrink-0" />
      {value ?? <span className="italic">{placeholder}</span>}
    </button>
  );
}

// ─── Clock SVG ────────────────────────────────────────────────────────────────

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
