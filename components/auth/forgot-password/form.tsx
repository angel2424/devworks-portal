"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export function ForgotPasswordForm() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setError("No pudimos enviar el correo. Intenta de nuevo.");
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div>
        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center mb-6">
          <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
          Revisa tu correo
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Si existe una cuenta con{" "}
          <span className="font-medium text-gray-700">{email}</span>, recibirás
          un enlace para restablecer tu contraseña.
        </p>
        <Link
          href="/login"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          ← Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
          Restablecer contraseña
        </h1>
        <p className="text-sm text-gray-500">
          Ingresa tu correo y te enviamos un enlace para crear una nueva contraseña.
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
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>

        {status === "error" && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === "loading" && <Spinner size="sm" />}
          {status === "loading" ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          ← Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
