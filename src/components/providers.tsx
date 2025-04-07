"use client";

import { ReduxProvider } from "@/lib/redux/provider";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <Toaster />
      {children}
    </ReduxProvider>
  );
}
