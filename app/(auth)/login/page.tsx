"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true); // true while we inspect the URL hash
  const router = useRouter();

  // Handle Supabase implicit-flow redirects (invite / recovery / magic link).
  // Supabase appends #access_token=...&type=invite to the Site URL when it can't
  // use the PKCE token_hash flow (e.g. the email template hasn't been customized).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setChecking(false);
      return;
    }

    const params = new URLSearchParams(hash.slice(1)); // strip the leading "#"
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type         = params.get("type");

    if (!accessToken) {
      setChecking(false);
      return;
    }

    // Set the session from the tokens in the hash, then redirect.
    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" })
      .then(({ data, error }) => {
        if (error || !data.session) {
          setChecking(false);
          return;
        }
        // Clear the hash so tokens don't stay in the URL
        window.history.replaceState(null, "", window.location.pathname);

        if (type === "invite" || type === "recovery") {
          // Invite or password reset → set password first
          router.replace("/auth/update-password");
        } else {
          // Already authenticated → dashboard layout handles role redirect
          router.replace("/dashboard");
        }
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Always send to /dashboard — the server layout checks the role from
    // the profiles table and redirects to /portal if the user isn't team.
    router.push("/dashboard");
  }

  // Show a neutral loading state while we process the hash
  if (checking) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-brand-300 border-t-brand-500 animate-spin" />
          <p className="text-xs text-gray-400">Verificando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">

        {/* Logotype */}
        <div className="mb-12">
          <span className="font-heading text-2xl font-semibold tracking-tight text-gray-900">
            DevWorks<span className="text-brand-500">.</span>
          </span>
        </div>

        <div className="mb-8">
          <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
            Iniciar sesión
          </h1>
          <p className="text-sm text-gray-500">
            Ingresa tus credenciales para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                Contraseña
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" />}
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-400 text-center">
          ¿No tienes acceso? Solicita una invitación al equipo.
        </p>
      </div>
    </div>
  );
}
