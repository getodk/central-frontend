// Deprecated. Access these directly from './event' instead.
export { trigger, fillForm } from './event';

export const MAXIMUM_TEST_DURATION = { seconds: 10 };

export class MockLogger {
  log() {}
  error() {}
}
