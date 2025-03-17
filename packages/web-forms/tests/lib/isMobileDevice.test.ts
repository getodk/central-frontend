import { describe, expect, it, afterEach, beforeAll } from 'vitest';
import { isMobileDevice } from '@/lib/isMobileDevice.ts';

describe('isMobileDevice', () => {
	let originalUserAgent: string;
	let originalMaxTouchPoints: number;
	let originalOntouchstart;

	const mockDevice = (userAgent: string, touchPoints: number, hasTouchEvent: boolean) => {
		Object.defineProperty(navigator, 'userAgent', {
			value: userAgent,
			configurable: true,
		});

		Object.defineProperty(navigator, 'maxTouchPoints', {
			value: touchPoints,
			configurable: true,
		});

		Object.defineProperty(window, 'ontouchstart', {
			value: hasTouchEvent ? () => false : undefined,
			configurable: true,
		});
	};

	beforeAll(() => {
		originalUserAgent = navigator.userAgent;
		originalMaxTouchPoints = navigator.maxTouchPoints;
		originalOntouchstart = window.ontouchstart;
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'userAgent', {
			value: originalUserAgent,
			configurable: true,
		});

		Object.defineProperty(navigator, 'maxTouchPoints', {
			value: originalMaxTouchPoints,
			configurable: true,
		});

		Object.defineProperty(window, 'ontouchstart', {
			value: originalOntouchstart,
			configurable: true,
		});
	});

	it('detects iPhone (mobile)', () => {
		mockDevice(
			'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
			1,
			true
		);

		expect(isMobileDevice()).toBe(true);
	});

	it('detects iPad (tablet)', () => {
		mockDevice(
			'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
			1,
			true
		);

		expect(isMobileDevice()).toBe(true);
	});

	it('detects Android phone (mobile)', () => {
		mockDevice(
			'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
			1,
			true
		);

		expect(isMobileDevice()).toBe(true);
	});

	it('detects Android tablet (tablet)', () => {
		mockDevice(
			'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
			1,
			true
		);

		expect(isMobileDevice()).toBe(true);
	});

	it('detects Kindle Fire (tablet)', () => {
		mockDevice(
			'Mozilla/5.0 (Linux; Android 11; KFMAWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/96.2.7 Mobile Safari/537.36',
			2,
			true
		);

		expect(isMobileDevice()).toBe(true);
	});

	it('detects Windows Phone (mobile)', () => {
		mockDevice(
			'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko)',
			1,
			true
		);

		expect(isMobileDevice()).toBe(true);
	});

	it('rejects Windows desktop (no touch)', () => {
		mockDevice(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
			0,
			false
		);

		expect(isMobileDevice()).toBe(false);
	});

	it('detects Windows tablet (with touch)', () => {
		mockDevice(
			'Mozilla/5.0 (Windows NT 10.0; ARM; Touch) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			5,
			true
		);

		expect(isMobileDevice()).toBe(true);
	});

	it('rejects macOS desktop (no touch)', () => {
		mockDevice(
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
			0,
			false
		);

		expect(isMobileDevice()).toBe(false);
	});

	it('rejects Linux desktop (no touch)', () => {
		mockDevice(
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
			0,
			false
		);

		expect(isMobileDevice()).toBe(false);
	});

	it('handles empty User-Agent', () => {
		mockDevice('', 0, false);

		expect(isMobileDevice()).toBe(false);

		mockDevice('', 1, true);

		expect(isMobileDevice()).toBe(false);
	});

	it('handles generic tablet with touch', () => {
		mockDevice('Mozilla/5.0 (Tablet; rv:68.0) Gecko/68.0 Firefox/68.0', 2, true);

		expect(isMobileDevice()).toBe(true);
	});
});
