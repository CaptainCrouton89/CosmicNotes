import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
export interface IRightHeaderProps {
  children: React.ReactNode;
}

export const RightHeader = memo(function RightHeader(props: IRightHeaderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const headerRightElement =
    mounted && typeof document !== "undefined"
      ? (document.querySelector(".header-right") as HTMLElement)
      : null;

  const portalContent =
    headerRightElement && createPortal(props.children, headerRightElement);

  if (!mounted) return null;
  return <div>{portalContent}</div>;
});
