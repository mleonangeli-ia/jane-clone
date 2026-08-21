"use client";

import { useEffect } from "react";
import { tokenCache } from "@/lib/captcha-preload";

/**
 * Initialize CAPTCHA token preloading when app mounts.
 * Place this in your root layout to start background token generation immediately.
 *
 * Result: tokens are warm and ready before user needs them.
 */
export function CaptchaPreloader() {
  useEffect(() => {
    // Start preloading tokens in background (non-blocking)
    tokenCache.startPreload();

    // Optional: refill periodically to keep cache fresh
    const interval = setInterval(() => {
      tokenCache.startPreload();
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => {
      clearInterval(interval);
      tokenCache.stopPreload();
    };
  }, []);

  return null; // This component doesn't render anything
}
