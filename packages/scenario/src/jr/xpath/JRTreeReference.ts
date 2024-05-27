/**
 * @todo Hopefully we can keep this interface extremely minimal. It currently
 * exists only to allow tests calling into it to type check.
 */
export class JRTreeReference {
	constructor(readonly xpathReference: string) {}
}
