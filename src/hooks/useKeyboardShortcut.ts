import { useCallback, useEffect } from "react";

type KeyCombo = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
};

type KeyShortcut = {
  combo: KeyCombo;
  callback: () => void;
  condition?: boolean;
};

/**
 * A hook for registering keyboard shortcuts
 *
 * @param shortcuts An array of keyboard shortcuts to register
 */
export function useKeyboardShortcut(shortcuts: KeyShortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { combo, callback, condition = true } = shortcut;
        // If condition is false, skip this shortcut
        if (!condition || !e.key) continue;

        // Check if the key combo matches
        const keyMatches = e.key.toLowerCase() === combo.key.toLowerCase();
        const commandMatches =
          combo.metaKey === undefined ||
          e.metaKey === combo.metaKey ||
          combo.ctrlKey === undefined ||
          e.ctrlKey === combo.ctrlKey;
        const altMatches =
          combo.altKey === undefined || e.altKey === combo.altKey;
        const shiftMatches =
          combo.shiftKey === undefined || e.shiftKey === combo.shiftKey;

        if (keyMatches && commandMatches && altMatches && shiftMatches) {
          if (combo.preventDefault !== false) {
            e.preventDefault();
          }
          callback();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
