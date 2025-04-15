"use client";

import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { RootState } from "@/lib/redux/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const isChatVisible = useSelector(
    (state: RootState) => state.ui.isChatVisible
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { header, headerMeta } = useSelector((state: RootState) => state.ui);

  // Default padding class (use this for SSR)
  const defaultPaddingClass = "px-2 md:px-4 lg:px-10";
  const chatPaddingClass = "pl-0 md:pl-2 lg:pl-6";

  return (
    <div className="flex min-h-screen flex-1 ">
      <AppSidebar />
      <div className="flex flex-col flex-1 h-screen">
        <header className="border-b pl-3 flex justify-between">
          <div className="container flex h-14 items-center flex-1">
            <SidebarTrigger />
            <div className="font-semibold ml-2">{header}</div>
          </div>
          <div className="container flex h-14 items-center flex-1 justify-end pr-4 xl:pr-8 text-sm text-muted-foreground header-right" />
        </header>
        <main className="flex-1 overflow-auto min-h-0">
          <div
            className={`container h-full flex flex-col ${
              mounted && isChatVisible ? chatPaddingClass : defaultPaddingClass
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
