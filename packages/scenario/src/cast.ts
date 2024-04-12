interface MaybeStringable {
	toString?(): string;
}

const STRINGABLE_BRAND = Symbol('STRINGABLE');

interface Stringable {
	// ... otherwise `isStringable` doesn't actually narrow the type...
	[STRINGABLE_BRAND]?: true;

	toString(): string;
}

const isStringable = (value: unknown): value is Stringable => {
	return typeof (value as MaybeStringable).toString === 'function';
};

export const castToString = (value: unknown): string => {
	switch (typeof value) {
		case 'string':
		case 'number':
		case 'bigint':
			return String(value);

		case 'boolean':
			return value ? '1' : '0';

		case 'undefined':
		case 'object':
			if (value == null) {
				return '';
			}

			if (isStringable(value)) {
				return value.toString();
			}

			break;
	}

	throw new Error('Could not cast answer to string');
};
