import { identity } from '@getodk/common/lib/identity.ts';
import { ValueCodec } from './ValueCodec.ts';

export class StringValueCodec extends ValueCodec<'string', string, string> {
	constructor() {
		super('string', identity, identity, () => identity);
	}
}
