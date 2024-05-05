import type { JSONValue } from '../../../../types/JSONValue.ts';
import { UnreachableError } from '../../../lib/error/UnreachableError.ts';
import type { Inspectable } from './shared-extension-types.ts';

type SerializableInspectable = JSONValue | string;

const serializeInspectable = (value: SerializableInspectable): string => {
	return JSON.stringify(value);
};

export const inspect = (value: Inspectable): string => {
	switch (typeof value) {
		case 'bigint':
			return `${value}n`;

		case 'boolean':
		case 'number':
		case 'symbol':
		case 'undefined':
			return String(value);

		case 'string':
			return serializeInspectable(value);

		case 'object': {
			if (value == null) {
				return serializeInspectable(value);
			}

			if (typeof value.inspectValue === 'function') {
				return JSON.stringify(value.inspectValue());
			}

			throw new Error('Cannot serialize object: no `inspectValue` method');
		}

		case 'function':
			throw new Error('Cannot inspect function');

		default:
			throw new UnreachableError(value);
	}
};
