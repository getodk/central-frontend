export const parseToInteger = (value: string | null): number | null => {
	if (value === null) {
		return null;
	}

	const parsed = Number(value);
	if (typeof value !== 'string' || value.trim() === '' || !Number.isInteger(parsed)) {
		throw new Error(`Expected an integer, but got: ${value}`);
	}

	return parsed;
};

export const parseToFloat = (value: string | null): number | null => {
	if (value === null) {
		return null;
	}

	const parsed = Number(value);
	if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(parsed)) {
		throw new Error(`Expected a float, but got: ${value}`);
	}

	return parsed;
};
