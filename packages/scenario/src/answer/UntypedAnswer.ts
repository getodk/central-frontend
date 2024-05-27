import { ComparableAnswer } from './ComparableAnswer.ts';

interface MaybeStringable {
	toString?(): string;
}

const STRINGABLE_BRAND = Symbol('STRINGABLE');

interface Stringable {
	// ... otherwise `isStringable` doesn't actually narrow the type...
	[STRINGABLE_BRAND]?: true;

	toString(): string;
}

const isExplicitlyCastableToString = (value: unknown): value is Stringable => {
	return typeof (value as MaybeStringable).toString === 'function';
};

/**
 * @todo This was previously implemented as a `castToString` function. Its call
 * site suggested that this casting didn't belong in the test interface, instead
 * perhaps belonging in the engine. That seems less likely now, as the client
 * interface has intentionally evolved to associate specific runtime value
 * encodings with a given node type; these runtime encoding types are not now,
 * nor planned to be, mapped to JavaRosa's equivalents (if/when those exist). So
 * it seems likely this is actually a more stable way to handle bridging the
 * `Scenario` interface (presently its `answer` method, possibly more to come?)
 * than trying to convolute such casting into the design of the engine's client
 * interface directly. This is only presented as a `@todo` to draw attention in
 * review. If we agree on this reasoning, we can likely revise this comment to
 * remove reference to the previous reasoning and remove that `@todo` tag.
 */
export class UntypedAnswer extends ComparableAnswer {
	constructor(readonly unknownValue: unknown) {
		super();
	}

	get stringValue(): string {
		const { unknownValue: unknownValue } = this;

		if (unknownValue instanceof ComparableAnswer) {
			return unknownValue.stringValue;
		}

		switch (typeof unknownValue) {
			case 'string':
			case 'number':
			case 'bigint':
				return String(unknownValue);

			case 'boolean':
				return unknownValue ? '1' : '0';

			case 'undefined':
			case 'object':
				if (unknownValue == null) {
					return '';
				}

				if (isExplicitlyCastableToString(unknownValue)) {
					return unknownValue.toString();
				}

				break;
		}

		throw new Error('Could not cast answer to string');
	}
}
