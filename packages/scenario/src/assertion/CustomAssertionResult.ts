export interface CustomAssertionResult {
	readonly pass: boolean;
	readonly message: () => string;
}
