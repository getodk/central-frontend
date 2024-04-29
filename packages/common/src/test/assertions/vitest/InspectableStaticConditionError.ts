import type { JSONValue } from '../../../../types/JSONValue.ts';
import type { Inspectable } from './shared-extension-types.ts';

interface InspectableStaticConditionErrorOptions {
	readonly details?: string;
}

export class InspectableStaticConditionError extends Error {
	constructor(
		actual: Inspectable,
		expectedCondition: JSONValue,
		options: InspectableStaticConditionErrorOptions = {}
	) {
		const { details } = options;

		const messageParts = [
			'Expected',
			JSON.stringify(actual.inspectValue()),
			'to equal',
			JSON.stringify(expectedCondition),
			details,
		].filter((value): value is string => typeof value === 'string');

		super(messageParts.join(' '));
	}
}
