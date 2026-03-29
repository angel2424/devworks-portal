import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a string into Mexican phone number format: (XXX) XXX-XXXX
 * Strips non-digits, removes the +52 country prefix if present, then masks.
 * Safe to call on every onChange — returns the partially-formatted value while typing.
 */
export function formatMexPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  // Drop +52 / 52 country prefix when the user pastes a full international number
  if (digits.length > 10 && digits.startsWith("52")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
