"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export function UpdatePasswordForm() {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [status, setStatus]       = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError]         = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setStatus("loading");

    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("No pudimos actualizar tu contraseña. Intenta de nuevo.");
      setStatus("error");
      return;
    }

    setStatus("done");

    // Redirect based on role after a short pause so the user sees the success state
    setTimeout(() => {
      const role = data.user?.user_metadata?.role ?? "client";
      router.push(role === "team" ? "/dashboard" : "/portal");
    }, 1500);
  }

  if (status === "done") {
    return (
      <div>
        <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-6">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
          Contraseña actualizada
        </h1>
        <p className="text-sm text-gray-500">Redirigiendo a tu espacio de trabajo…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
          Establece tu contraseña
        </h1>
        <p className="text-sm text-gray-500">
          Elige una contraseña segura para tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
          >
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>

        {/* Password strength hint */}
        {password.length > 0 && (
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => {
              const strength = Math.min(
                4,
                Math.floor(password.length / 3) +
                  (/[A-Z]/.test(password) ? 1 : 0) +
                  (/[0-9]/.test(password) ? 1 : 0) +
                  (/[^A-Za-z0-9]/.test(password) ? 1 : 0)
              );
              return (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= strength
                      ? strength <= 1
                        ? "bg-red-400"
                        : strength <= 2
                        ? "bg-yellow-400"
                        : strength <= 3
                        ? "bg-brand-400"
                        : "bg-green-400"
                      : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-full mt-2"
        >
          {status === "loading" && <Spinner size="sm" />}
          {status === "loading" ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}
