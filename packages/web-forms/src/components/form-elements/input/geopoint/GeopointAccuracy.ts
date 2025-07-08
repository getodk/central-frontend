import type { GeopointAccuracyThresholdOptions } from './GeopointAccuracyThresholdOptions.ts';
import type { GeopointValueObject } from './GeopointValueObject.ts';

/**
 * Expresses quality of a {@link GeopointValueObject.accuracy | geopoint value's accuracy},
 * relative to specified {@link GeopointAccuracyThresholdOptions | thresholds}:
 *
 * @property {string} GOOD - if accuracy is <= accuracyThreshold
 * @property {string} ACCEPTABLE - if accuracy is > accuracyThreshold and <= unacceptableAccuracyThreshold
 * @property {string} POOR - if accuracy > unacceptableAccuracyThreshold
 * @property {string} UNKNOWN - if accuracy is null or undefined
 */
const GEOPOINT_ACCURACY_QUALITY = {
	ACCEPTABLE: 'ACCEPTABLE',
	GOOD: 'GOOD',
	POOR: 'POOR',
	UNKNOWN: 'UNKNOWN',
} as const;

type GeopointAccuracyQualityEnum = typeof GEOPOINT_ACCURACY_QUALITY;

export type GeopointAccuracyQuality =
	GeopointAccuracyQualityEnum[keyof GeopointAccuracyQualityEnum];

const computeAccuracyQuality = (
	value: number | null,
	options: GeopointAccuracyThresholdOptions
): GeopointAccuracyQuality => {
	if (value == null) {
		return GEOPOINT_ACCURACY_QUALITY.UNKNOWN;
	}

	const { accuracyThreshold, unacceptableAccuracyThreshold } = options;

	if (value > unacceptableAccuracyThreshold) {
		return GEOPOINT_ACCURACY_QUALITY.POOR;
	}

	if (value > accuracyThreshold) {
		return GEOPOINT_ACCURACY_QUALITY.ACCEPTABLE;
	}

	return GEOPOINT_ACCURACY_QUALITY.GOOD;
};

type GeopointAccuracyQualityLabelMapping = Readonly<Record<GeopointAccuracyQuality, string>>;

// TODO: translations
const GEOPOINT_ACCURACY_QUALITY_LABEL: GeopointAccuracyQualityLabelMapping = {
	[GEOPOINT_ACCURACY_QUALITY.GOOD]: 'Good accuracy',
	[GEOPOINT_ACCURACY_QUALITY.ACCEPTABLE]: 'Good accuracy',
	[GEOPOINT_ACCURACY_QUALITY.POOR]: 'Poor accuracy',
	[GEOPOINT_ACCURACY_QUALITY.UNKNOWN]: 'Unknown accuracy',
};

export class GeopointAccuracy {
	static readonly GOOD = GEOPOINT_ACCURACY_QUALITY.GOOD;
	static readonly ACCEPTABLE = GEOPOINT_ACCURACY_QUALITY.ACCEPTABLE;
	static readonly POOR = GEOPOINT_ACCURACY_QUALITY.POOR;
	static readonly UNKNOWN = GEOPOINT_ACCURACY_QUALITY.UNKNOWN;

	readonly value: number | null;
	readonly quality: GeopointAccuracyQuality;
	readonly label: string;

	constructor(source: GeopointValueObject | null, options: GeopointAccuracyThresholdOptions) {
		const value = source?.accuracy ?? null;
		const quality = computeAccuracyQuality(value, options);

		this.value = value;
		this.quality = quality;
		this.label = GEOPOINT_ACCURACY_QUALITY_LABEL[quality];
	}
}
