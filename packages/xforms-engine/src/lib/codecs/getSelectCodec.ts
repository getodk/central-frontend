import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { SelectDefinition } from '../../client/SelectNode.ts';
import { sharedValueCodecs } from './getSharedValueCodec.ts';
import { MultipleValueItemCodec } from './items/MultipleValueItemCodec.ts';
import { SingleValueItemCodec } from './items/SingleValueItemCodec.ts';

const multipleValueSelectCodec = new MultipleValueItemCodec(sharedValueCodecs.string);

const singleValueSelectCodec = new SingleValueItemCodec(sharedValueCodecs.string);

// prettier-ignore
export type SelectCodec =
	| MultipleValueItemCodec
	| SingleValueItemCodec;

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
