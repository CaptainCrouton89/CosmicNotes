"use server";

import { createClient } from "@/lib/supabase/server"; // Adjusted path
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    // You might want to redirect to the login page with an error message
    // For now, just redirecting to login, a more robust error handling can be added.
    return redirect("/login?error=" + encodeURIComponent(error.message));
  }

  // Redirect to a protected page or dashboard after successful login
  return redirect("/");
}

export async function signup(formData: FormData) {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // emailRedirectTo should be the URL to your auth confirmation page
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    // Redirect to login page with an error message
    return redirect("/login?error=" + encodeURIComponent(error.message));
  }

  // Optionally, you can redirect to a page informing the user to check their email
  // For now, redirecting to login page with a success message (or a specific pending confirmation page)
  return redirect("/login?message=Check_email_to_continue_signing_up");
}
