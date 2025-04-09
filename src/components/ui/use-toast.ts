import { useCallback, useState } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({
      title,
      description,
      duration = 3000,
      variant = "default",
    }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, title, description, duration, variant };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      setTimeout(() => {
        setToasts((prevToasts) =>
          prevToasts.filter((toast) => toast.id !== id)
        );
      }, duration);

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return { toast, dismiss, toasts };
}
