type AssertInstanceType = <T, U extends T>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Constructor: abstract new (...args: any[]) => U,
	instance: T
) => asserts instance is U;

export const assertInstanceType: AssertInstanceType = (Constructor, instance) => {
	if (!(instance instanceof Constructor)) {
		throw new Error('Instance of unexpected type');
	}
};
