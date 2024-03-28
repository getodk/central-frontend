export type PropertyKeys<T> = ReadonlyArray<string & keyof T>;

export const getPropertyKeys = <T extends object>(object: T): PropertyKeys<T> => {
	return Object.keys(object) as Array<string & keyof T>;
};

export type PropertyDescriptorEntry<T> = readonly [string & keyof T, PropertyDescriptor];

export type PropertyDescriptors<T> = Array<PropertyDescriptorEntry<T>>;

export const getPropertyDescriptors = <T extends object>(object: T): PropertyDescriptors<T> => {
	const keys = getPropertyKeys(object);

	return keys.map((key) => {
		const descriptor = Object.getOwnPropertyDescriptor(object, key);

		if (descriptor == null) {
			throw new Error(`Could not get property descriptor for key ${key}`);
		}

		return [key, descriptor];
	});
};
