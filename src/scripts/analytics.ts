export const trackedAnalyticsEvents = [
  "resume_view",
  "resume_download",
  "contact_click",
  "email_click",
  "linkedin_click",
  "github_click",
  "impact_click",
  "project_click"
] as const;

export const analyticsClientScript = `
(() => {
  const trackedAnalyticsEvents = new Set(${JSON.stringify(trackedAnalyticsEvents)});
  const allowedParamNames = new Set(["location", "target"]);
  const snakeCaseEventName = /^[a-z]+(?:_[a-z]+)*$/;

  const cleanParams = (params) => {
    const cleaned = {};

    for (const [key, value] of Object.entries(params)) {
      if (
        allowedParamNames.has(key) &&
        typeof value === "string" &&
        value.length > 0
      ) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  };

  const trackAnalyticsEvent = (eventName, params = {}) => {
    if (
      typeof window.gtag !== "function" ||
      !trackedAnalyticsEvents.has(eventName) ||
      !snakeCaseEventName.test(eventName)
    ) {
      return;
    }

    window.gtag("event", eventName, cleanParams(params));
  };

  const paramsFromElement = (element) => ({
    location: element.dataset.analyticsLocation,
    target: element.dataset.analyticsTarget
  });

  const trackElement = (element) => {
    const eventName = element.dataset.analyticsEvent;

    if (eventName) {
      trackAnalyticsEvent(eventName, paramsFromElement(element));
    }

    const secondaryEventName = element.dataset.analyticsSecondaryEvent;

    if (secondaryEventName) {
      trackAnalyticsEvent(secondaryEventName, {
        location: element.dataset.analyticsLocation,
        target: element.dataset.analyticsSecondaryTarget
      });
    }
  };

  const trackPageEvent = () => {
    const body = document.body;

    if (!body || body.dataset.analyticsPageTracked === "true") {
      return;
    }

    const eventName = body.dataset.analyticsPageEvent;

    if (!eventName) {
      return;
    }

    body.dataset.analyticsPageTracked = "true";
    trackAnalyticsEvent(eventName, {
      location: body.dataset.analyticsPageLocation,
      target: body.dataset.analyticsPageTarget
    });
  };

  const handleTrackedClick = (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const trackedElement = event.target.closest("[data-analytics-event]");

    if (trackedElement instanceof HTMLElement) {
      trackElement(trackedElement);
    }
  };

  const setupAnalytics = () => {
    const root = document.documentElement;

    if (root.dataset.analyticsReady !== "true") {
      root.dataset.analyticsReady = "true";
      document.addEventListener("click", handleTrackedClick);
    }

    trackPageEvent();
  };

  window.portfolioAnalytics = { trackAnalyticsEvent };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupAnalytics, { once: true });
  } else {
    setupAnalytics();
  }

  document.addEventListener("astro:page-load", setupAnalytics);
})();
`;
