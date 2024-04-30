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
				/**
				 * @todo It was previously assumed that it would never occur that an
				 * assertion would pass, and that Vitest would then produce a message
				 * for that. In hindsight, it makes sense that this case occurs in
				 * negated assertions (e.g.
				 * `expect(...).not.toPassSomeCustomAssertion`). It seems
				 * {@link SimpleAssertionResult} is not a good way to model the
				 * generalization, and that we may want a more uniform `AssertionResult`
				 * type which always includes both `pass` and `message` capabilities.
				 * This is should probably be addressed before we merge the big JR port
				 * PR, but is being temporarily put aside to focus on porting tests in
				 * bulk in anticipation of a scope change/hopefully-temporary
				 * interruption of momentum.
				 */
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
