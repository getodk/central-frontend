/**
 * Regular expression patterns for detecting mobile devices.
 */
const SMARTPHONE_PATTERNS: RegExp[] = [
	/android/,
	/iphone/,
	/windows phone/,
	/mobile/, // Generic mobile indicator
];

/**
 * Regular expression patterns for detecting tablet devices.
 */
const TABLET_PATTERNS: RegExp[] = [
	/tablet/,
	/ipad/,
	/android/,
	/silk/, // Kindle Fire tablets
	/(windows nt.*touch)/,
];

/**
 * Determines if the current device is mobile.
 *
 * This utility detects most commonly used smartphone and tablet devices based on
 * User-Agent patterns and touch support. It may not catch some edge cases, but these
 * can be addressed later if issues arise.
 *
 * @returns {boolean} True if the device is a mobile or tablet, false otherwise.
 */
export const isMobileDevice = (): boolean => {
	const userAgent = navigator.userAgent.toLowerCase();

	const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	const isPhone = SMARTPHONE_PATTERNS.some((pattern) => pattern.test(userAgent));
	const isTablet = TABLET_PATTERNS.some((pattern) => pattern.test(userAgent));

	return (isPhone || isTablet) && hasTouchSupport;
};
