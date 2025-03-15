/**
 * This error class is intended as a common point of reference for all of the
 * related interfaces and implementation where we've deferred two concerns:
 *
 * 1. Support for attributes on instance nodes (which may be bound in a form's
 *    model and/or may be expected to preserve model-defined defaults)
 * 2. Present lack of logic to treat a `jr:template` attribute as a special
 *    case: whereas in the general case we would expect to pass through a
 *    form/model-defined attribute, we expect to specifically **omit**
 *    `jr:template` from repeat instances derived from any of form's
 *    explicitly-defined repeat templates
 *
 * Addressing #1 is (now) a prerequisite to addressing #2, and it is also a
 * prerequisite for #2's unaddressed status to _become meaningfully observable
 * and problematic_.
 *
 * By introducing this error at a point where a change in #1's status is likely
 * to be implicated, we're also likely to be reminded to address #2 in tandem.
 */
export class TemplatedNodeAttributeSerializationError extends Error {
	constructor() {
		super('Template attribute omission not implemented');
	}
}
