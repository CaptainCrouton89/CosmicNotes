import { useRouter } from "next/navigation";
import { useSearchDialog } from "./use-search-dialog";
import { useKeyboardShortcut } from "./useKeyboardShortcut";

/**
 * Hook to register global keyboard shortcuts that should be available across the application
 */
export function useGlobalKeyboardShortcuts() {
  const router = useRouter();
  const searchDialog = useSearchDialog();

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
    {
      combo: {
        key: "n",
        metaKey: true, // For macOS
        ctrlKey: true, // For Windows/Linux
      },
      callback: () => {
        // Navigate to the home page (create new note)
        router.push("/");
      },
    },
    {
      combo: {
        key: "f",
        metaKey: true, // For macOS
        ctrlKey: true, // For Windows/Linux
        preventDefault: true, // Prevent default browser search
      },
      callback: () => {
        // Open search dialog
        searchDialog.open();
      },
    },
    // Add more global shortcuts here as needed
  ]);
}
