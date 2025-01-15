import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import { ValueCodec } from './ValueCodec.ts';

export type TriggerValueType = 'string';

export type TriggerRuntimeValue = boolean;

export type TriggerInputValue = boolean | '' | null;

type BaseTriggerInstanceValueMapping = Readonly<Record<string, string>>;

const TRIGGER_INSTANCE_VALUES = {
	true: 'OK',
	false: '',
} as const satisfies BaseTriggerInstanceValueMapping;

type TriggerInstanceValueMapping = typeof TRIGGER_INSTANCE_VALUES;

type TriggerInstanceValue = TriggerInstanceValueMapping[keyof TriggerInstanceValueMapping];

const encodeTriggerValue = (value: TriggerInputValue): TriggerInstanceValue => {
	switch (value) {
		case true:
			return TRIGGER_INSTANCE_VALUES.true;

		case false:
		case '':
		case null:
			return TRIGGER_INSTANCE_VALUES.false;

		default:
			throw new UnreachableError(value);
	}
};

const decodeTriggerValue = (value: string): TriggerRuntimeValue => {
	if (value === 'OK') {
		return true;
	}

	if (value === '') {
		return false;
	}

	if (value.toLowerCase() === 'ok') {
		// eslint-disable-next-line no-console
		console.warn('Treating trigger value as case-insensitive:', value);

		return true;
	}

	throw new ErrorProductionDesignPendingError(`Unexpected trigger value: ${value}`);
};

export class TriggerCodec extends ValueCodec<
	TriggerValueType,
	TriggerRuntimeValue,
	TriggerInputValue
> {
	constructor() {
		super('string', encodeTriggerValue, decodeTriggerValue);
	}
}
