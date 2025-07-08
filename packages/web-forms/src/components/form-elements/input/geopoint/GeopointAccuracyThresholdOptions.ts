/**
 * Default accuracy in meters that can usually be reached by modern devices given enough time.
 */
const ACCURACY_THRESHOLD_DEFAULT = 5;

/**
 * Default unacceptable accuracy in meters, about the length of a city block.
 */
const UNACCEPTABLE_ACCURACY_THRESHOLD_DEFAULT = 100;

interface BaseGeopointAccuracyThresholdOptions {
	/**
	 * @default ACCURACY_THRESHOLD_DEFAULT
	 */
	readonly accuracyThreshold: number | null;

	/**
	 * @default UNACCEPTABLE_ACCURACY_THRESHOLD_DEFAULT
	 */
	readonly unacceptableAccuracyThreshold: number | null;
}

export class GeopointAccuracyThresholdOptions {
	readonly accuracyThreshold: number;
	readonly unacceptableAccuracyThreshold: number;

	constructor(options: BaseGeopointAccuracyThresholdOptions) {
		this.accuracyThreshold = options.accuracyThreshold ?? ACCURACY_THRESHOLD_DEFAULT;
		this.unacceptableAccuracyThreshold =
			options.unacceptableAccuracyThreshold ?? UNACCEPTABLE_ACCURACY_THRESHOLD_DEFAULT;
	}
}
