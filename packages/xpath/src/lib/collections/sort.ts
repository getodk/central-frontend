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

class ParkMillerPRNG implements PseudoRandomNumberGenerator {
	protected seed: number;

	constructor(seed: Int | bigint) {
		let initialSeed: number;
		if (typeof seed === 'bigint') {
			// the result of the modulo operation is always smaller than Number.MAX_SAFE_INTEGER,
			// thus it's safe to convert to a Number.
			initialSeed = Number(BigInt(seed) % BigInt(SEED_MODULO_OPERAND));
		} else {
			initialSeed = seed % SEED_MODULO_OPERAND;
		}
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

class JavaRosaPRNG extends ParkMillerPRNG {
	// Per issue #49 (https://github.com/getodk/web-forms/issues/49) this is intended to be "bug-or-feature-compatible"
	// with JavaRosa's implementation; org.javarosa.core.model.ItemsetBinding.resolveRandomSeed takes the .longValue() of
	// the double produced by randomSeedPathExpr.eval() — see https://github.com/getodk/javarosa/blob/6ce13527c/src/main/java/org/javarosa/core/model/ItemsetBinding.java#L311:L317 .
	// That results in a 0L when the double is NaN, which happens (for instance) when there
	// is a string that does not look like a number (which is a problem in itself, as any non-numeric
	// looking string will then result in the same seed of 0 — see https://github.com/getodk/javarosa/issues/800).
	// We'll emulate Java's Double -> Long conversion here (for NaN and some other double values)
	// so that we produce the same randomization as JR.

	constructor(seed: Int | bigint) {
		let finalSeed: number | bigint;
		// In Java, a NaN double's .longValue is 0
		if (Number.isNaN(seed)) finalSeed = 0;
		// In Java, an Infinity double's .longValue() is 2**63 -1, which is larger than Number.MAX_SAFE_INTEGER, thus we'll need a BigInt.
		else if (seed === Infinity) finalSeed = 2n ** 63n - 1n;
		// Analogous with the above conversion, but for -Infinity
		else if (seed === -Infinity) finalSeed = -(2n ** 63n);
		// A Java Double's .longValue drops the fractional part.
		else if (typeof seed === 'number' && !Number.isInteger(seed)) finalSeed = Math.trunc(seed);
		else finalSeed = seed;
		super(finalSeed);
	}
}

export const seededRandomize = <T>(values: readonly T[], seed?: number | bigint): T[] => {
	let generator: PseudoRandomNumberGenerator;

	if (seed == null) {
		generator = new UnseededPseudoRandomNumberGenerator();
	} else {
		generator = new JavaRosaPRNG(seed);
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
