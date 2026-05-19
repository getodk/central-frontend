// If updated, UpsertableWeakMap should probably be updated as well
export class UpsertableMap<K, V> extends Map<K, V> {
	upsert(key: K, produce: (key: K) => V): V {
		if (this.has(key)) {
			return this.get(key) as V;
		}

		const value = produce(key);

		this.set(key, value);

		return value;
	}
}
