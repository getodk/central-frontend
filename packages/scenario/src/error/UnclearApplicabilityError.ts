export class UnclearApplicabilityError extends Error {
	constructor(subject: string) {
		super(
			`It is not yet clear if/how ${subject} functionality will be applicable in the web forms project`
		);
	}
}
