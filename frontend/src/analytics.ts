type AnalyticsParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: AnalyticsParams
    ) => void;
  }
}

export function trackEvent(
  eventName: string,
  params: AnalyticsParams = {}
): void {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params);
}