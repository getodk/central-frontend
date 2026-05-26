/**
 * @todo Before bailing on the port of `FormDefSerializationTest.java`, it
 * seemed quite likely there should be a `ComparableValue` abstraction below
 * `ComparableAnswer`: `null` is almost certainly not an "answer", but we might
 * find that there is a more general sense of comparable **and castable**
 * assertion values, of which "answer" may be a more specific case.
 */
export class ExpectedNullValue {
	constructor() {
		throw new Error('TODO: see `ExpectedNullValue` JSDoc');
	}
}

export const nullValue = () => null;
