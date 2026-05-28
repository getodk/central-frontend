export type AssertVoidExpectedArgument = (
	args: readonly unknown[]
) => asserts args is readonly [expected?: undefined];

export const assertVoidExpectedArgument: AssertVoidExpectedArgument = (args) => {
	// This accounts for awkwardness around the generic assertion types, where the
	// expected argument (as optional first item in a `...rest` array) may be
	// present but undefined, to allow for a common call site shape.
	if (args.length === 1 && args[0] === undefined) {
		return;
	}

	if (args.length > 0) {
		throw new Error('Assertion does not accept any `expected` arguments');
	}
};
