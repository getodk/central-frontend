// Deprecated. Import `trigger` directly from './event' instead.
export { trigger } from './event';

export const MAXIMUM_TEST_DURATION = { seconds: 10 };

export class MockLogger {
  log() {}
  error() {}
}
