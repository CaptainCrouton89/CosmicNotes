import { useRouter } from "next/navigation";
import { useKeyboardShortcut } from "./useKeyboardShortcut";

/**
 * Hook to register global keyboard shortcuts that should be available across the application
 */
export function useGlobalKeyboardShortcuts() {
  const router = useRouter();

  // Register global keyboard shortcuts
  useKeyboardShortcut([
    {
      combo: {
        key: "k",
        metaKey: true, // For macOS
        ctrlKey: true, // For Windows/Linux
      },
      callback: () => {
        // Navigate to the home page (create new note)
        router.push("/");
      },
    },
    // Add more global shortcuts here as needed
  ]);
}
