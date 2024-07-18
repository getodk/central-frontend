type AssertTrue = (value: boolean) => asserts value is true;

export const assertTrue: AssertTrue = (value) => {
	if (value !== true) {
		throw new Error('Expected value to be true');
	}
};

type AssertNonNull = <T>(value: T) => asserts value is NonNullable<T>;

export const assertNonNull: AssertNonNull = (value) => {
	if (value == null) {
		throw new Error('Expected value');
	}
};
