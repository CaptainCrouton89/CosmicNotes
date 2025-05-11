import { createClient } from "@/lib/supabase/server"; // Adjusted path
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/"; // Default redirect to homepage

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // Redirect to the 'next' URL which should be the originally intended destination
      // or the root page if not specified.
      return redirect(next);
    }
  }

  // If token is invalid or missing, redirect to an error page or login with an error
  // For simplicity, redirecting to login with an error message
  console.error("Email confirmation error:", token_hash, type);
  return redirect(
    "/login?error=Email_confirmation_failed_Invalid_or_missing_token"
  );
}
