import { useEffect, useState, useRef } from 'react';
import { tokenCache } from './captcha-preload';
import { computeScore, levelFromScore, typeFromLevel, type RiskLevel, type CaptchaType } from './captcha-scoring';

interface UseCaptchaTokenResult {
  token: string | null;
  level: RiskLevel;
  type: CaptchaType;
  loading: boolean;
  error: string | null;
}

/**
 * Hook that:
 * 1. Computes risk score instantly (no network)
 * 2. Gets cached token (or fetches if cache miss)
 * 3. Returns token + metadata with minimal latency
 *
 * Typical latency: <50ms if cache hit, ~150ms if cache miss (first load)
 */
export function useCaptchaToken(): UseCaptchaTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mouseCountRef = useRef(0);
  const keyCountRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const [level, setLevel] = useState<RiskLevel>('easy');
  const [type, setType] = useState<CaptchaType>('math');

  useEffect(() => {
    const startedAt = Date.now();
    startTimeRef.current = startedAt;
    // Track user interaction
    const onMouse = () => mouseCountRef.current++;
    const onKey = () => keyCountRef.current++;
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', onMouse, { passive: true });
      window.addEventListener('keydown', onKey, { passive: true });
    }

    // Compute score instantly
    const signals = {
      webdriver: Boolean((navigator as { webdriver?: boolean }).webdriver),
      mouseEvents: mouseCountRef.current,
      keyEvents: keyCountRef.current,
      timeOnPage: Date.now() - startedAt,
      isMobile: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
      screenW: typeof window !== 'undefined' ? window.screen.width : 0,
      screenH: typeof window !== 'undefined' ? window.screen.height : 0,
      plugins: typeof navigator !== 'undefined' ? navigator.plugins?.length ?? 0 : 0,
      cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled ?? true : true,
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 0 : 0,
      languages: typeof navigator !== 'undefined' ? navigator.languages?.length ?? 0 : 0,
    };

    const score = computeScore(signals, navigator.userAgent);
    const riskLevel = levelFromScore(score);
    const captchaType = typeFromLevel(riskLevel);

    setLevel(riskLevel);
    setType(captchaType);

    // Get token from cache (fast path) or fetch (slow path)
    tokenCache
      .getToken(captchaType)
      .then((t) => {
        setToken(t);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('keydown', onKey);
      }
    };
  }, []);

  return { token, level, type, loading, error };
}
