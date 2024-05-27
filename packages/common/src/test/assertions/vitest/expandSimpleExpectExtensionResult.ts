import type { SyncExpectationResult } from 'vitest';
import type {
	ErrorLike,
	ExpectExtensionMethod,
	SimpleAssertionResult,
} from './shared-extension-types.ts';

const isErrorLike = (result: SimpleAssertionResult): result is ErrorLike => {
	return typeof result === 'object' && typeof result.message === 'string';
};

/**
 * Where Vitest assertion extends may be defined to return a
 * {@link SimpleAssertionResult}, expands that result value to the complete
 * interface expected by Vitest for reporting assertion results.
 */
export const expandSimpleExpectExtensionResult = <Actual, Expected>(
	simpleMethod: ExpectExtensionMethod<Actual, Expected, SimpleAssertionResult>
): ExpectExtensionMethod<Actual, Expected, SyncExpectationResult> => {
	return (actual, expected) => {
		const simpleResult = simpleMethod(actual, expected);

		const pass = simpleResult === true;

		if (pass) {
			return {
				pass,
				message: () => {
					throw new Error('Unsupported `SimpleAssertionResult` runtime value');
				},
			};
		}

		let message: () => string;

		if (isErrorLike(simpleResult)) {
			message = () => simpleResult.message;
		} else {
			message = () => simpleResult;
		}

		return {
			pass,
			message,
		};
	};
};
