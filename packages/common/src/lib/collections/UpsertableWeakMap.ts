// If updated, UpsertableMap should probably be updated as well
export class UpsertableWeakMap<K extends object, V> extends WeakMap<K, V> {
	upsert(key: K, produce: (key: K) => V): V {
		if (this.has(key)) {
			return this.get(key) as V;
		}

		const value = produce(key);

		this.set(key, value);

		return value;
	}
}
