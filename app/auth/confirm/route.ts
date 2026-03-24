import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Invites and recovery always go to set-password; other types use next or root.
  const defaultNext = type === "invite" || type === "recovery"
    ? "/auth/update-password"
    : "/";
  const next = searchParams.get("next") ?? defaultNext;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error?.message ?? "Token inválido")}`);
    }
  }

  redirect(`/auth/error?error=${encodeURIComponent("Enlace inválido o expirado")}`);
}
