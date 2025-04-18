"use client";

import { ReduxProvider } from "@/lib/redux/provider";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { GlobalKeyboardShortcuts } from "./GlobalKeyboardShortcuts";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <Toaster />
      <GlobalKeyboardShortcuts />
      {children}
    </ReduxProvider>
  );
}
