import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
export interface ILeftHeaderProps {
  children: React.ReactNode;
}

export function LeftHeader(props: ILeftHeaderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const headerLeftElement =
    mounted && typeof document !== "undefined"
      ? (document.querySelector(".header-left") as HTMLElement)
      : null;

  const portalContent =
    headerLeftElement && createPortal(props.children, headerLeftElement);

  if (!mounted) return null;
  return <div>{portalContent}</div>;
}
