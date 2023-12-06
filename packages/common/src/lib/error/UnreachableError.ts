/**
 * May be used to signal that a (generally tagged) union type is exhausted,
 * e.g. by `switch` or some other means of narrowing and handling each of its
 * union members.
 */
export class UnreachableError extends Error {
	constructor(unrechable: never, additionalDetail?: string) {
		let message = `Unreachable value: ${JSON.stringify(unrechable)}`;

		if (additionalDetail != null) {
			message = `${message} (${additionalDetail})`;
		}

		super(message);
	}
}
