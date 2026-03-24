"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  email: string;
  displayName: string;
  initials: string;
  compact?: boolean;
}

export function UserMenu({ email, displayName, initials, compact = false }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (compact) {
    return (
      <div className="relative">
        <Button
          onClick={() => setOpen(!open)}
          variant="ghost"
          size="icon"
          className="bg-brand-100 border border-brand-200 hover:bg-brand-200 text-brand-700"
        >
          <span className="text-xs font-semibold font-heading">{initials}</span>
        </Button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-full right-0 mt-1.5 w-52 z-20 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-700 truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
              <div className="p-1">
                <Button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  variant="ghost"
                  className="w-full justify-start rounded-md text-sm text-gray-600 hover:text-gray-900"
                >
                  {signingOut ? (
                    <Spinner size="xs" className="text-gray-400" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  )}
                  {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setOpen(!open)}
        variant="ghost"
        className="w-full justify-start gap-3 px-2 h-auto py-2 rounded-md"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-brand-700 font-heading">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 truncate">{displayName}</p>
          <p className="text-xs text-gray-400 truncate">{email}</p>
        </div>
        <svg
          className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
            <div className="p-1">
              <Button
                variant="ghost"
                asChild
                className="w-full justify-start rounded-md text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setOpen(false)}
              >
              <Link href="/dashboard/settings">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
              </Link>
              </Button>
              <Button
                onClick={handleSignOut}
                disabled={signingOut}
                variant="ghost"
                className="w-full justify-start rounded-md text-sm text-gray-600 hover:text-gray-900"
              >
                {signingOut ? (
                  <Spinner size="xs" className="text-gray-400" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                )}
                {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
