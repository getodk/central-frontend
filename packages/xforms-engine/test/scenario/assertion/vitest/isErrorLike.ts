import type { ErrorLike, SimpleAssertionResult } from './shared-extension-types.ts';

export const isErrorLike = (result: SimpleAssertionResult): result is ErrorLike => {
	return typeof result === 'object' && typeof result.message === 'string';
};
