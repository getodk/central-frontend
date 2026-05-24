export class ImplementationPendingError extends Error {
	constructor(featureOrSubject: string) {
		super(`Feature or subject is pending implementation: ${featureOrSubject}`);
	}
}
