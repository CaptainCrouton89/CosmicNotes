import {
  setChatVisibility,
  toggleChatVisibility,
} from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useChatWindow = () => {
  const dispatch = useDispatch();
  const isChatVisible = useSelector(
    (state: RootState) => state.ui.isChatVisible
  );
  const [hasMounted, setHasMounted] = useState(false);

  const toggleChat = () => {
    dispatch(toggleChatVisibility());
  };

  useEffect(() => {
    setHasMounted(true);

    // Only run this logic once the component is mounted client-side
    const checkScreenSize = () => {
      // Only update chat visibility on initial client-side load
      if (hasMounted && !sessionStorage.getItem("initialUiStateSet")) {
        const isMobileView = window.innerWidth < 1300;
        dispatch(setChatVisibility(!isMobileView));
        sessionStorage.setItem("initialUiStateSet", "true");
      }
    };

    // Check on initial client-side render
    checkScreenSize();

    // Setup listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup listener
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [dispatch, hasMounted]);

  return { toggleChat, isChatVisible };
};
