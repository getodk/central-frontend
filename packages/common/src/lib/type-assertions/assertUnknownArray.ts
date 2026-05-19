type UnknownArray = readonly unknown[];

type AssertUnknownArray = (value: unknown) => asserts value is UnknownArray;

export const assertUnknownArray: AssertUnknownArray = (value) => {
	if (!Array.isArray(value)) {
		throw new Error('Not an array');
	}
};
