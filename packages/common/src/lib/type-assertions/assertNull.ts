export type AssertNull = (value: unknown) => asserts value is null;

export const assertNull: AssertNull = (value) => {
	if (value !== null) {
		throw new Error('Not null');
	}
};
