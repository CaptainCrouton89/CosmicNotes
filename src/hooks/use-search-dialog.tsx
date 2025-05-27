import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setSearchDialogOpen, toggleSearchDialog } from "@/lib/redux/slices/uiSlice";

export function useSearchDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isSearchDialogOpen);

  return {
    isOpen,
    open: () => dispatch(setSearchDialogOpen(true)),
    close: () => dispatch(setSearchDialogOpen(false)),
    toggle: () => dispatch(toggleSearchDialog()),
  };
}