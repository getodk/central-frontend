import 'vitest';

declare module 'vitest' {
	/**
	 * This interface matches Vitest's present internal `SyncExpectationResult`,
	 * but we explicitly export it so we can reference it as an interface derived
	 * from Vitest itself in any extensions to its assertion API.
	 */
	export interface SyncExpectationResult {
		pass: boolean;
		message: () => string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		actual?: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expected?: any;
	}
}
