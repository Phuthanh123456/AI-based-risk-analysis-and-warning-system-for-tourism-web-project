import { useEffect, useState } from "react";

export function useExpandedViewer(dialog) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const collapse = () => setExpanded(false);
    const sync = () => { if (!document.fullscreenElement) collapse(); };
    element?.addEventListener("close", collapse);
    document.addEventListener("fullscreenchange", sync);
    return () => {
      element?.removeEventListener("close", collapse);
      document.removeEventListener("fullscreenchange", sync);
    };
  }, [dialog]);

  function toggle() {
    if (expanded) {
      setExpanded(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      return;
    }
    setExpanded(true);
    // Mobile browsers and embedded pages may only allow expansion within the viewport.
    const surface = dialog.current?.firstElementChild;
    if (document.fullscreenEnabled && surface?.requestFullscreen) surface.requestFullscreen().catch(() => {});
  }
  return { expanded, toggle };
}
