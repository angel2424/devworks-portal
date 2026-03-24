import { Suspense } from "react";
import Link from "next/link";

async function ErrorDetail({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <p className="text-sm text-gray-500">
      {params?.error ?? "Ocurrió un error inesperado."}
    </p>
  );
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        {/* Logotype */}
        <div className="mb-12">
          <span className="font-heading text-2xl font-semibold tracking-tight text-gray-900">
            DevWorks<span className="text-brand-500">.</span>
          </span>
        </div>

        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-6">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
          Algo salió mal
        </h1>
        <div className="mb-8">
          <Suspense fallback={<p className="text-sm text-gray-500">Cargando…</p>}>
            <ErrorDetail searchParams={searchParams} />
          </Suspense>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          ← Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
