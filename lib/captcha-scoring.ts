/**
 * Client-side risk scoring — no HTTP needed.
 * Runs instantly on mount, no network latency.
 */

export interface ClientSignals {
  webdriver: boolean;
  mouseEvents: number;
  keyEvents: number;
  timeOnPage: number;
  isMobile: boolean;
  screenW: number;
  screenH: number;
  plugins: number;
  cookiesEnabled: boolean;
  hardwareConcurrency: number;
  languages: number;
}

/**
 * Compute risk score from browser signals.
 * Returns 0-100. Lower = human-like, higher = bot-like.
 * Scoring thresholds: 0-24 (easy/math), 25-54 (medium/puzzle), 55+ (hard/text).
 */
export function computeScore(signals: ClientSignals, userAgent: string): number {
  let score = 0;

  // Browser automation detection (highest signals)
  if (signals.webdriver) score += 70;
  if (/HeadlessChrome|Chrome\/(?:9\d|10\d)\.0\.0\.0/.test(userAgent)) score += 55;
  if (/puppeteer|selenium|phantomjs/i.test(userAgent)) score += 55;
  if (!userAgent || userAgent.length === 0) score += 40;

  // Device/environment signals
  if (!signals.isMobile && signals.mouseEvents === 0) score += 20;
  if (!signals.isMobile && signals.keyEvents === 0) score += 15;
  if (signals.screenW <= 800 && signals.screenH <= 600) score += 25;
  if (signals.hardwareConcurrency === 0) score += 12;
  if (signals.languages === 0) score += 15;
  if (!signals.cookiesEnabled) score += 20;
  if (signals.plugins === 0 && !signals.isMobile) score += 10;

  // Timing signals
  if (signals.timeOnPage < 800) score += 15;

  return Math.min(100, Math.max(0, score));
}

export type RiskLevel = "easy" | "medium" | "hard";
export type CaptchaType = "math" | "puzzle" | "text";

export function levelFromScore(score: number): RiskLevel {
  if (score < 25) return "easy";
  if (score < 55) return "medium";
  return "hard";
}

export function typeFromLevel(level: RiskLevel): CaptchaType {
  if (level === "easy") return "math";
  if (level === "medium") return "puzzle";
  return "text";
}

export function getScoreLabel(level: RiskLevel): string {
  if (level === "easy") return "Verificación rápida";
  if (level === "medium") return "Verificación estándar";
  return "Verificación avanzada";
}

export function getScoreColor(level: RiskLevel): string {
  if (level === "easy") return "text-emerald-600";
  if (level === "medium") return "text-amber-600";
  return "text-red-600";
}
