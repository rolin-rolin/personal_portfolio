"use client";

import { useEffect, useRef } from "react";

export function useEvent(
  type: string,
  handler: (e: Event) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    function listener(e: Event) {
      handlerRef.current(e);
    }
    window.addEventListener(type, listener);
    return () => window.removeEventListener(type, listener);
  }, [type]);
}
