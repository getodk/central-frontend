type UnknownObject = Record<PropertyKey, unknown>;

type AssertUnknownObject = (value: unknown) => asserts value is UnknownObject;

export const assertUnknownObject: AssertUnknownObject = (value) => {
	if (typeof value !== 'object' || value == null) {
		throw new Error('Not an object');
	}
};
