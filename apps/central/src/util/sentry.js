import { attachErrorHandler, browserTracingIntegration, init, setTag } from '@sentry/vue';

const initSentry = (app, source) => {
  const dsn = import.meta.env.ODK_CENTRAL_FRONTEND_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  init({
    dsn,
    integrations: [browserTracingIntegration()],
    // Captures performance timing for 1 in 5 page loads.
    // Could be extracted to VITE_SENTRY_TRACES_SAMPLE_RATE in the future.
    tracesSampleRate: 0.2,
  });

  setTag('source', source);
  attachErrorHandler(app, { logErrors: true });
};

export default initSentry;
