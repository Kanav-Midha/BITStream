"use client";

import { useEffect, useState } from "react";

interface CurtainEntryProps {
  enabled: boolean;
}

export function CurtainEntry({ enabled }: CurtainEntryProps) {
  const [visible, setVisible] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("entry");
      window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }, 760);

    return () => window.clearTimeout(hideTimer);
  }, [enabled]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden curtain-entry">
      <div className="curtain-glow" />
      <div className="curtain-panel curtain-panel-left" />
      <div className="curtain-panel curtain-panel-right" />
    </div>
  );
}
