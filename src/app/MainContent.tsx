"use client";

import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setChatVisibility } from "@/lib/redux/slices/uiSlice";
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
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Set chat visibility to true on wider screens, false on mobile
    if (typeof window !== "undefined") {
      const isWideScreen = window.innerWidth >= 1024; // lg breakpoint
      dispatch(setChatVisibility(isWideScreen));

      // Optional: Add resize listener to adjust chat visibility on window resize
      const handleResize = () => {
        dispatch(setChatVisibility(window.innerWidth >= 1024));
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } else {
      dispatch(setChatVisibility(false));
    }
  }, [dispatch]);

  // Default padding class (use this for SSR)
  const defaultPaddingClass = "px-2 md:px-4 lg:px-10";
  const chatPaddingClass = "pl-0 md:pl-2 lg:pl-6";

  return (
    <div className="flex min-h-screen flex-1 ">
      <AppSidebar />
      <div className="flex flex-col flex-1 h-screen">
        <header className="border-b pl-3 flex justify-between">
          <div className="container flex h-14 items-center flex-3">
            <SidebarTrigger />
            <div className="container flex h-14 items-center flex-1 justify-left pl-4 header-left" />
          </div>
          <div className="container flex h-14 items-center flex-1 justify-end pr-4 xl:pr-8 text-sm text-muted-foreground header-right" />
        </header>
        <main className="flex-1 overflow-auto min-h-0">
          <div
            className={`h-full flex flex-col ${
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
