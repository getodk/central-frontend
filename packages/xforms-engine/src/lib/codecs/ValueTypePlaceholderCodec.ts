import { identity } from '@getodk/common/lib/identity.ts';
import type { ValueType } from '../../client/ValueType.ts';
import { ValueCodec } from './ValueCodec.ts';

/**
 * Provides fallback functionality where a {@link ValueCodec} is expected, for
 * those {@link ValueType | value types} which are still pending implementation.
 * This allows consistent use of the {@link ValueCodec} interface while
 * maintaining the current behavior of treating those unimplemented value types
 * as string values.
 */
export class ValueTypePlaceholderCodec<V extends ValueType> extends ValueCodec<V, string, string> {
	constructor(valueType: V) {
		super(valueType, identity, identity, {
			decodeInstanceValueFactory: () => identity,
			runtimeValueStateFactory: () => identity,
		});
	}
}
