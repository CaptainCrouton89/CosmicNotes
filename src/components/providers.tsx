"use client";

import { ReduxProvider } from "@/lib/redux/provider";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { GlobalKeyboardShortcuts } from "./GlobalKeyboardShortcuts";
import { SearchDialog } from "./search-dialog";
import { useSearchDialog } from "@/hooks/use-search-dialog";

function SearchDialogWrapper() {
  const { isOpen, close } = useSearchDialog();
  return <SearchDialog open={isOpen} onOpenChange={close} />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <Toaster />
      <GlobalKeyboardShortcuts />
      <SearchDialogWrapper />
      {children}
    </ReduxProvider>
  );
}
