import { afterEach, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { getDefaultDateTimeLocale } from './helpers.ts';

beforeEach(() => {
	const dateOnTimezone = getDefaultDateTimeLocale();
	vi.useFakeTimers({
		now: new Date(dateOnTimezone).getTime(),
	});
});

afterEach(() => {
	vi.useRealTimers();
});
