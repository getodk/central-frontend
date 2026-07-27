import type { App } from 'vue';
import { browserTracingIntegration, init, setTag } from '@sentry/vue';

const initSentry = (app: App, source: string, dsn: string | undefined) => {
  if (!dsn) {
    return;
  }

  init({
    app,
    dsn,
    integrations: [browserTracingIntegration()],
    // Captures performance timing for 1 in 5 page loads.
    tracesSampleRate: 0.2,
    // Attachment downloads redirect to S3, where Sentry headers cause CORS errors.
    tracePropagationTargets: [/^\/(?!.*\/attachments\/)/],
  });

  setTag('source', source);
};

export default initSentry;
