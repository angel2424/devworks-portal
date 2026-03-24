import { ForgotPasswordForm } from "@/components/auth/forgot-password/form";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        {/* Logotype */}
        <div className="mb-12">
          <span className="font-heading text-2xl font-semibold tracking-tight text-gray-900">
            DevWorks<span className="text-brand-500">.</span>
          </span>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
