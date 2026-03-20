"use client";

import { useState, useEffect } from "react";

export function useMobileDetect() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(/Mobi|Android/i.test(navigator.userAgent));
  }, []);

  return {
    isMobile: () => mobile,
  };
}
