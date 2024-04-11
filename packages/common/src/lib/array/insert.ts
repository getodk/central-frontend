export const insertAtIndex = <T>(
	currentValues: readonly T[],
	insertionIndex: number,
	newValue: T
): readonly T[] => {
	const { length } = currentValues;

	if (insertionIndex > length) {
		throw new Error(
			'Failed to insert value: specified insertion index is greater than the current array length, which would introduce empty array slots'
		);
	}

	if (insertionIndex === length) {
		return currentValues.concat(newValue);
	}

	return [
		...currentValues.slice(0, insertionIndex),
		newValue,
		...currentValues.slice(insertionIndex),
	];
};
