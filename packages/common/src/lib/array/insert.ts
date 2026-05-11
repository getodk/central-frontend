export const insertAtIndex = <T>(
	currentValues: readonly T[],
	insertionIndex: number,
	newValues: readonly T[]
): readonly T[] => {
	const { length } = currentValues;

	if (insertionIndex > length) {
		throw new Error(
			'Failed to insert value: specified insertion index is greater than the current array length, which would introduce empty array slots'
		);
	}

	if (insertionIndex === length) {
		return currentValues.concat(newValues);
	}

	return [
		...currentValues.slice(0, insertionIndex),
		...newValues,
		...currentValues.slice(insertionIndex),
	];
};
