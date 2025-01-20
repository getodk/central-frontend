import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { SelectDefinition } from '../../../client/SelectNode.ts';
import { sharedValueCodecs } from '../getSharedValueCodec.ts';
import { MultipleValueSelectCodec } from './MultipleValueSelectCodec.ts';
import { SingleValueSelectCodec } from './SingleValueSelectCodec.ts';

const multipleValueSelectCodec = new MultipleValueSelectCodec(sharedValueCodecs.string);

const singleValueSelectCodec = new SingleValueSelectCodec(sharedValueCodecs.string);

// prettier-ignore
export type SelectCodec =
	| MultipleValueSelectCodec
	| SingleValueSelectCodec;

export const getSelectCodec = (definition: SelectDefinition<'string'>): SelectCodec => {
	switch (definition.bodyElement.type) {
		case 'select':
			return multipleValueSelectCodec;

		case 'select1':
			return singleValueSelectCodec;

		default:
			throw new UnreachableError(definition.bodyElement.type);
	}
};
