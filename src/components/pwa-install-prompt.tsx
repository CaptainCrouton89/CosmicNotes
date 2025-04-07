"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      // Hide the app's install promotion
      setInstallPrompt(null);
      setIsAppInstalled(true);
      toast.success("Cosmic Notes has been installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      toast.success("Thank you for installing Cosmic Notes!");
    } else {
      toast.info("You can install Cosmic Notes later from the browser menu.");
    }

    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
  };

  // Don't show install button if the app is already installed or there's no install prompt
  if (isAppInstalled || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm z-50">
      <h3 className="font-medium text-lg mb-2">Install Cosmic Notes</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Install Cosmic Notes on your device for quick access to your notes even
        when offline.
      </p>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setInstallPrompt(null)}>
          Not now
        </Button>
        <Button onClick={handleInstallClick}>Install</Button>
      </div>
    </div>
  );
}
