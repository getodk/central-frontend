export const FormattedTextStub = new Proxy({} as Record<PropertyKey, unknown>, {
	get() {
		throw new TypeError('Not implemented');
	},
	set() {
		return false;
	},
});
