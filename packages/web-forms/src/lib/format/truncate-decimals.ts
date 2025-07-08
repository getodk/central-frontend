interface TruncateDecimalsOptions {
	readonly decimals: number;
}

export const truncateDecimals = (num: number, options: TruncateDecimalsOptions): string => {
	const { decimals } = options;

	if (!Number.isFinite(decimals) || decimals < 0) {
		throw new Error(
			`Truncation failed: expected a finite, non-negative decimal option, got: ${decimals}`
		);
	}

	if (!Number.isFinite(num)) {
		return '';
	}

	if (Number.isInteger(num)) {
		return num.toString();
	}

	const factor = Math.pow(10, decimals);
	const withDecimals = Math.floor(Math.abs(num) * factor) / factor;
	const sign = Math.sign(num);

	return String(withDecimals * sign);
};
