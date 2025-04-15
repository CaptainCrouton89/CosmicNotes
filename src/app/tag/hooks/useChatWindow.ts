import {
  setChatVisibility,
  toggleChatVisibility,
} from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useChatWindow = () => {
  const dispatch = useDispatch();
  const isChatVisible = useSelector(
    (state: RootState) => state.ui.isChatVisible
  );

  const toggleChat = () => {
    dispatch(toggleChatVisibility());
  };

  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1300;

      // Only update chat visibility on initial load
      if (!sessionStorage.getItem("initialUiStateSet")) {
        dispatch(setChatVisibility(!isMobileView));
        sessionStorage.setItem("initialUiStateSet", "true");
      }
    };

    // Check on initial render
    checkScreenSize();

    // Setup listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup listener
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [dispatch]);

  return { toggleChat, isChatVisible };
};
