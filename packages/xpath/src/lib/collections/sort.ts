const MAX_INT_32 = 2_147_483_647;
const SEED_MODULO_OPERAND = MAX_INT_32;
const MIN_STD = 16_807;

interface PseudoRandomNumberGenerator {
	random(): number;
}

type Int = number;

class UnseededPseudoRandomNumberGenerator implements PseudoRandomNumberGenerator {
	random() {
		return Math.random();
	}
}

class SeededPseudoRandomNumberGenerator implements PseudoRandomNumberGenerator {
	protected seed: number;

	constructor(seed: Int) {
		let initialSeed = seed % SEED_MODULO_OPERAND;

		if (initialSeed <= 0) {
			initialSeed += MAX_INT_32 - 1;
		}

		this.seed = initialSeed;
	}

	random() {
		const { seed: previousSeed } = this;
		const seed = (previousSeed * MIN_STD) % SEED_MODULO_OPERAND;
		const result = (seed - 1) / (MAX_INT_32 - 1);

		this.seed = seed;

		return result;
	}
}

const isInt = (value: number): value is Int => value % 1 === 0;

export const seededRandomize = <T>(values: readonly T[], seed?: number): T[] => {
	let generator: PseudoRandomNumberGenerator;

	if (seed == null) {
		generator = new UnseededPseudoRandomNumberGenerator();
	} else if (!isInt(seed)) {
		throw 'todo not an int';
	} else {
		generator = new SeededPseudoRandomNumberGenerator(seed);
	}

	const { length } = values;

	const results: T[] = [];

	for (let i = 0; i < length; i += 1) {
		const j = Math.floor(generator.random() * (i + 1));

		if (j !== i) {
			// @ts-expect-error - it would be nice to implement this so index access
			// is obviously safe
			results[i] = results[j];
		}

		// @ts-expect-error - it would be nice to implement this so index access is
		// obviously safe
		results[j] = values[i];
	}

	return results;
};
