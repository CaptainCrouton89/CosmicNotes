import HomeContent from "@/components/home-content/HomeContent";
import { createClient } from "@/lib/supabase/server";
import "@mdxeditor/editor/style.css";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent initialSearchParams={searchParams} />
    </Suspense>
  );
}
