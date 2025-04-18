"use client";

import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";

/**
 * Component that registers global keyboard shortcuts.
 * This is a "headless" component that doesn't render anything but sets up event listeners.
 */
export function GlobalKeyboardShortcuts() {
  // Register all global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  // This component doesn't render anything
  return null;
}
