import { browserTracingIntegration, init, setTag } from '@sentry/vue';

const initSentry = (app, source, dsn) => {
  if (!dsn) {
    return;
  }

  init({
    app,
    dsn,
    integrations: [browserTracingIntegration()],
    // Captures performance timing for 1 in 5 page loads.
    // Could be extracted to VITE_SENTRY_TRACES_SAMPLE_RATE in the future.
    tracesSampleRate: 0.2,
    // Disable trace headers: they break CORS on requests that redirect to S3.
    tracePropagationTargets: [],
  });

  setTag('source', source);
};

export default initSentry;
