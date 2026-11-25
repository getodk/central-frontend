import { afterEach, beforeEach, vi } from 'vitest';
import { TEST_NOW } from './helpers.ts';

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(TEST_NOW) });
});

afterEach(() => {
  vi.useRealTimers();
});
