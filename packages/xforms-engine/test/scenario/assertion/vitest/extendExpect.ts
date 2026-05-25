import type { ExpectStatic } from 'vitest';
import type { ExpectExtension, UntypedExpectExtensionFunction } from './shared-extension-types.ts';

/**
 * Provides a general mechanism to extend Vitest's `expect` assertions, with a
 * consistent interface for these overlapping concerns:
 *
 * 1. Assertion implementation, as a typed function of (actual, expected) =>
 *    result
 * 2. Parameter type validation, where Vitest cannot otherwise ensure that the
 *    assertion's parameter types are consistent with the values actually passed
 *    to a test's assertions
 * 3. Augmentation of Vitest's static `expect` types, where the signature is
 *    expected to be { methodName: (expected) => T }
 *
 * Each of these cases share a common set of concerns, each with slight
 * deviation from the others, which are easy to confuse without this
 * generalization (and such confusion is what prompted it to be written in the
 * first place).
 */
export const extendExpect = <const T extends Record<string, ExpectExtension>>(
	expect: ExpectStatic,
	extension: T
): T => {
	const extensionEntries = Object.entries(extension);
	const extensions = extensionEntries.map(
		([key, value]): readonly [string, UntypedExpectExtensionFunction] => {
			let extensionMethod: UntypedExpectExtensionFunction;

			if (typeof value === 'function') {
				extensionMethod = value;
			} else {
				extensionMethod = value.extensionMethod;
			}

			return [key, extensionMethod];
		}
	);

	expect.extend(Object.fromEntries(extensions));

	return extension;
};
