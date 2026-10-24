/**
 * advisorReports.ts — "Report this answer" for Field Intelligence.
 *
 * Google Play's Generative AI policy requires apps that generate content to let
 * users report or flag an answer *inside the app*. GridDown has no servers, so a
 * report is stored on the phone and the user can choose to email it to support.
 * Nothing leaves the device unless they tap Send.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReportReason = 'inaccurate' | 'unsafe' | 'offensive' | 'other';

export const REPORT_REASONS: ReadonlyArray<{ id: ReportReason; label: string; hint: string }> = [
  { id: 'inaccurate', label: 'Inaccurate', hint: 'Wrong facts, numbers, or steps' },
  { id: 'unsafe', label: 'Unsafe advice', hint: 'Following it could hurt someone' },
  { id: 'offensive', label: 'Offensive or inappropriate', hint: 'Hateful, explicit, or disturbing' },
  { id: 'other', label: 'Something else', hint: 'Off-topic, nonsense, or broken' },
];

export interface AdvisorReport {
  id: string;
  createdAt: number;
  reason: ReportReason;
  /** The user's question that produced the answer. */
  question: string;
  /** The answer being reported, as shown. */
  answer: string;
  /** Advisor mode (instructor / scenario / gear / planner). */
  mode: string;
  /** Model id that produced it, or null for the scaffold/demo path. */
  modelId: string | null;
  /** Titles of the "From your guides" sources shown with the answer. */
  sources: string[];
  appVersion: string;
}

export const REPORTS_KEY = 'griddown_advisor_reports';
/** Keep the newest N so a stuck user can't fill storage by tapping Report. */
export const MAX_REPORTS = 50;
export const SUPPORT_EMAIL = 'support@bannedproduct.com';
/** mailto: URLs get unreliable past a few KB on both platforms. */
const MAIL_BODY_LIMIT = 1800;

export async function listReports(): Promise<AdvisorReport[]> {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdvisorReport[]) : [];
  } catch {
    return [];
  }
}

/** Store a report locally (newest first, capped). Resolves with the stored record. */
export async function saveReport(
  input: Omit<AdvisorReport, 'id' | 'createdAt'>,
  now: number = Date.now(),
): Promise<AdvisorReport> {
  const report: AdvisorReport = {
    ...input,
    question: input.question.slice(0, 2000),
    answer: input.answer.slice(0, 6000),
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
  };
  const existing = await listReports();
  const next = [report, ...existing].slice(0, MAX_REPORTS);
  try {
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — the user still gets the email option */
  }
  return report;
}

export async function clearReports(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REPORTS_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function reasonLabel(reason: ReportReason): string {
  return REPORT_REASONS.find((r) => r.id === reason)?.label ?? reason;
}

/** Plain-text body for the support email (also what a user sees before sending). */
export function formatReportBody(r: AdvisorReport): string {
  const when = new Date(r.createdAt).toISOString();
  const lines = [
    `GridDown Field Intelligence report`,
    `Reason: ${reasonLabel(r.reason)}`,
    `App: ${r.appVersion} · mode: ${r.mode} · model: ${r.modelId ?? 'none'}`,
    `When: ${when}`,
    r.sources.length ? `Sources shown: ${r.sources.join(' · ')}` : `Sources shown: none`,
    ``,
    `Question:`,
    r.question,
    ``,
    `Answer:`,
    r.answer,
    ``,
    `(Add anything else you want us to know above this line. Nothing is sent until you press Send.)`,
  ];
  const body = lines.join('\n');
  return body.length > MAIL_BODY_LIMIT ? `${body.slice(0, MAIL_BODY_LIMIT - 24)}\n…[answer truncated]` : body;
}

/** mailto: URL that opens the user's mail app with the report pre-filled. */
export function buildReportMailto(r: AdvisorReport, to: string = SUPPORT_EMAIL): string {
  const subject = `GridDown AI answer report — ${reasonLabel(r.reason)}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formatReportBody(r))}`;
}
