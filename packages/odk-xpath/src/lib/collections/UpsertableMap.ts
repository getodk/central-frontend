const NULL_SENTINEL = Symbol('UPSERTABLE_MAP_NULL');
const UNDEFINED_SENTINEL = Symbol('UPSERTABLE_MAP_UNDEFINED');

// TODO: use sentinels for keys?
// TODO: base non-nullable type might be better?
const toSentinelValue = <V>(value: V): V => {
	if (value === null) {
		return NULL_SENTINEL as V;
	}

	if (value === undefined) {
		return UNDEFINED_SENTINEL as V;
	}

	return value;
};

const fromSentinelValue = <V>(value: V) => {
	if (value === NULL_SENTINEL) {
		return null as V;
	}

	if (value === UNDEFINED_SENTINEL) {
		return undefined as V;
	}

	return value;
};

export class UpsertableMap<K, V> extends Map<K, V> {
	constructor(entries?: Iterable<readonly [K, V]> | null) {
		super(
			Array.from(entries ?? [])
				.map(([key, value]) => [key, value ?? toSentinelValue(value)])
		);
	}

	get(key: K): V | undefined {
		return fromSentinelValue(super.get(key));
	}

	set(key: K, value: V): this {
		return super.set(key, value ?? toSentinelValue(value));
	}

  upsert(
		key: K,
		produce: (key: K) => V
	): V {
		const current = super.get(key);

		if (current == null) {
			const value = produce(key);

			super.set(key, value ?? toSentinelValue(value));

			return value;
		}

		return current;
  }
}
