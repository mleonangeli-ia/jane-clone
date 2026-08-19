/**
 * Risk scorer — runs server-side to prevent tampering.
 * Receives browser signals collected client-side, adds server signals (UA),
 * and returns a risk level that determines which CAPTCHA to show.
 */

export interface ClientSignals {
  webdriver: boolean;
  mouseEvents: number;
  keyEvents: number;
  timeOnPage: number;   // ms since page load
  isMobile: boolean;
  screenW: number;
  screenH: number;
  plugins: number;
  cookiesEnabled: boolean;
  hardwareConcurrency: number;
  languages: number;
}

export type RiskLevel   = 'easy' | 'medium' | 'hard';
export type CaptchaType = 'math' | 'puzzle' | 'text';

/** Returns a 0–100 risk score. Higher = more likely bot. */
export function computeScore(signals: ClientSignals, userAgent: string): number {
  let score = 0;

  // ── Hard bot evidence ──────────────────────────────────────────────────────
  if (signals.webdriver)                          score += 70; // navigator.webdriver = true
  if (!signals.cookiesEnabled)                    score += 20; // bots often disable cookies
  if (signals.screenW === 0 || signals.screenH === 0) score += 20; // headless: no screen

  // ── Known headless default resolutions ────────────────────────────────────
  if (signals.screenW === 800 && signals.screenH === 600)  score += 25;
  if (signals.screenW === 1024 && signals.screenH === 768) score += 12;

  // ── Behavioral (600ms collection window — keep weights moderate) ──────────
  if (!signals.isMobile && signals.mouseEvents === 0) score += 20; // desktop with no mouse
  if (signals.keyEvents === 0)                        score += 5;  // no keystrokes yet (minor)
  if (signals.timeOnPage < 800)                       score += 15; // too fast even for bots

  // ── Environment anomalies ─────────────────────────────────────────────────
  if (signals.hardwareConcurrency === 0) score += 12; // headless: no CPU info
  if (signals.languages === 0)           score += 15; // no language preference
  if (!signals.isMobile && signals.plugins === 0) score += 8; // no plugins (minor signal)

  // ── Server-side User-Agent check ──────────────────────────────────────────
  const ua = (userAgent || '').toLowerCase();
  if (!userAgent) {
    score += 40; // missing UA
  } else {
    const BOT_MARKERS = ['headless', 'phantomjs', 'selenium', 'puppeteer', 'playwright', 'webdriver', 'scrapy', 'httpclient'];
    if (BOT_MARKERS.some(m => ua.includes(m))) score += 55;
  }

  return Math.min(100, Math.max(0, score));
}

export function levelFromScore(score: number): RiskLevel {
  if (score < 25) return 'easy';
  if (score < 55) return 'medium';
  return 'hard';
}

export function typeFromLevel(level: RiskLevel): CaptchaType {
  const map: Record<RiskLevel, CaptchaType> = { easy: 'math', medium: 'puzzle', hard: 'text' };
  return map[level];
}

/** Human-readable label for the UI. */
export function levelLabel(level: RiskLevel): string {
  return { easy: '🟢 Rápida', medium: '🟡 Estándar', hard: '🔴 Avanzada' }[level];
}
