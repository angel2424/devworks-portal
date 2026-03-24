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

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setChecking(false);
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type         = params.get("type");

    if (!accessToken) {
      setChecking(false);
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" })
      .then(({ data, error }) => {
        if (error || !data.session) {
          setChecking(false);
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);

        if (type === "invite" || type === "recovery") {
          router.replace("/auth/update-password");
        } else {
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
    router.push("/dashboard");
  }

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
      <div className="w-full max-w-md ">

        {/* Logotype */}
        <img src="https://storage.googleapis.com/dw-agency/dw-gray-logo.svg" alt="DevWorks Studio | Piedras Negras" className="w-30 h-6 object-contain mb-3 mx-auto" />

        <div className="mb-12 text-center">
          <h1 className="font-heading text-2xl text-gray-900 mb-1">
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
              className="block text-sm font-normal text-gray-500 mb-3"
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
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="password"
                className="block text-sm font-normal text-gray-500"
              >
                Contraseña
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-brand-600 hover:text-brand-400 transition-colors"
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
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
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
            className="py-3 px-12 mx-auto bg-brand-500 hover:bg-brand-600 text-white text-base font-medium rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Spinner size="sm" />}
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-400 text-center">
          ¿No tienes acceso? Solicita una invitación al equipo.
        </p>
      </div>
    </div>
  );
}
