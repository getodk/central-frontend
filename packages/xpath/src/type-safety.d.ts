export const assertType: (<T extends true>(test?: T) => void) | undefined;

// TODO: this fails in various ways, investigate
export type Exact<Expected, Actual> =
	Exclude<Expected, Actual> extends Exclude<Actual, Expected>
		? true
		: {
				Expected: Exclude<Expected, Actual>;
				Actual: Exclude<Actual, Expected>;
			};
