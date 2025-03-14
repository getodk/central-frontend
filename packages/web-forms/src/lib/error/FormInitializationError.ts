import {
	isUnknownObject,
	type UnknownObject,
} from '@getodk/common/lib/runtime-types/shared-type-predicates.ts';
import type { createInstance } from '@getodk/xforms-engine';

interface ErrorLike {
	readonly message: string;
	readonly stack?: string | null;
}

interface ErrorLikeCause extends ErrorLike, UnknownObject {}

const isErrorLikeCause = (cause: unknown): cause is ErrorLikeCause => {
	if (!isUnknownObject(cause)) {
		return false;
	}

	const { message, stack } = cause;

	return typeof message === 'string' && (typeof stack === 'string' || stack == null);
};

/**
 * @todo translations
 */
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

interface FormInitializationErrorOptions {
	readonly message: string;
	readonly cause?: unknown;
	readonly unknownCauseDetail?: string | null;
	readonly stack?: string | null;
}

/**
 * Provides a minimal, uniform representation of most general, known form load
 * failure conditions.
 *
 * This is a stopgap measure, and it WILL change as we refine the story for
 * error production within the engine (and its upstream dependencies). The
 * primary intent is to model enough of the current failure outcomes to provide
 * more useful feedback to users of the current Web Forms Preview. A secondary
 * intent is to leave some breadcrumbs (i.e. this JSDoc block; a rough sketch of
 * failure modes known and/or encountered in this stopgap effort) for that
 * coming refinement.
 *
 * We handle these broad cases, each of which may be produced by a rejected
 * {@link Promise}, as returned by {@link createInstance}:
 *
 * 1. Promise is rejected with any {@link Error}, or subclass/inheritor thereof,
 *    as thrown by `@getodk/xforms-engine` or `@getodk/xpath`. These are
 *    knowable, but they're not stable, documented, or modeled in the type
 *    system. We defer any specialized handling of these cases to incoming
 *    improvements on those known gaps.
 *
 * 2. Promise is rejected with a string value thrown by `@getodk/xpath`. Sorry!
 *    We will address all of these soon!
 *
 * 3. Promise is rejected with an {@link Error} whose
 *    {@link Error.message | message} is an empty string. This is the default
 *    behavior of `new Error()` with no arguments (or of any {@link Error}
 *    subclass which calls `super()` with no arguments!). We know of one case
 *    where this occurs: Solid's "possible infinite loop" (i.e. cycle)
 *    detection, when Solid is bundled for production. Being a default behavior,
 *    unfortunately we cannot be confident that this is the cause. In the
 *    future, we may consider inspecting {@link Error.stack} for such purposes.
 *
 * 4. Promise is rejected by any upstream external dependency of either
 *    `@getodk/xforms-engine` or `@getodk/xpath`, or by platform API calls.
 *    These are much more difficult to model, document, or encode in the type
 *    system. We will likely make some meaningful effort on this front as well,
 *    but we accept it will never be exhaustive. Most importantly, we cannot
 *    truly know what types may be thrown (and then passed through as a
 *    {@link Promise} rejection by {@link createInstance}).
 *
 * As such where the type of {@link cause} is...
 *
 * - {@link Error}: we capture its minimal known details: message and stack.
 *   Additionally, if its message is a blank string, we fall back to
 *   {@link UNKNOWN_ERROR_MESSAGE}.
 *
 * - any other object with an {@link ErrorLikeCause} shape: we handle the object
 *   as if it were an instance of {@link Error}.
 *
 * - string: we capture that string as if it were an error message.
 *
 * - any other value: we treat the cause as an unknown error, with a message of
 *   {@link UNKNOWN_ERROR_MESSAGE}. Additionally, if the value can be serialized
 *   by {@link JSON.stringify}, we assign that serialization to
 *   {@link unknownCauseDetail}, in hopes it will provide further clarification
 *   of unknown failure conditions.
 *
 * @todo The name of this class may change soon! It may also move up the stack
 * to `@getodk/xforms-engine`.
 */
export class FormInitializationError extends Error {
	static fromError(cause: ErrorLike): FormInitializationError {
		return new this(cause);
	}

	static from(cause: unknown): FormInitializationError {
		if (cause instanceof Error || isErrorLikeCause(cause)) {
			return this.fromError(cause);
		}

		if (isUnknownObject(cause) && typeof cause.message === 'string') {
			return new this({
				message: cause.message,
				cause,
			});
		}

		if (typeof cause === 'string') {
			return new this({
				message: cause,
				cause,
			});
		}

		let unknownCauseDetail: string | null = null;

		try {
			unknownCauseDetail = JSON.stringify(cause, null, 2);
		} catch {
			// Ignore JSON serialization error
		}

		return new this({
			message: 'Unknown error',
			cause,
			unknownCauseDetail,
		});
	}

	readonly cause: unknown;
	readonly unknownCauseDetail: string | null;
	readonly stack?: string | undefined;

	private constructor(options: FormInitializationErrorOptions) {
		let message = options.message;

		// TODO: this occurs when Solid's production build detects a "potential
		// infinite loop" (i.e. either a form cycle, or potentially a serious bug in
		// the engine!).
		if (message === '') {
			message = 'Unknown error';
		}

		const { cause, unknownCauseDetail, stack } = options;

		super(message, { cause });

		this.cause = cause;
		this.unknownCauseDetail = unknownCauseDetail ?? null;

		if (stack != null) {
			this.stack = stack;
		}
	}
}
