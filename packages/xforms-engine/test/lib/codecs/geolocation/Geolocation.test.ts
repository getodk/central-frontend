import { describe, expect, it } from 'vitest';
import { Geolocation } from '../../../../src/lib/codecs/geolocation/Geolocation';

describe('Geolocation', () => {
	describe('toCoordinatesString', () => {
		it.each([
			{ input: { latitude: 1, longitude: 2, altitude: null, accuracy: null }, expected: '1.0 2.0' },
			{
				input: { latitude: 1, longitude: 2, altitude: 0, accuracy: null },
				expected: '1.0 2.0 0.0',
			},
			{
				input: { latitude: 1, longitude: 2, altitude: 0, accuracy: 0 },
				expected: '1.0 2.0 0.0 0.0',
			},
			{
				input: { latitude: 1.2, longitude: 3.456, altitude: 123456.78, accuracy: 3 },
				expected: '1.2 3.456 123456.78 3.0',
			},
		])('turns $input into $expected', ({ input, expected }) => {
			const actual = Geolocation.toCoordinatesString(input);
			expect(actual).to.equal(expected);
		});
	});

	describe('parseString', () => {
		it.each([
			{ input: '1 2', expected: { latitude: 1, longitude: 2, altitude: null, accuracy: null } },
			{ input: '1 2 0', expected: { latitude: 1, longitude: 2, altitude: 0, accuracy: null } },
			{ input: '1 2 0 0', expected: { latitude: 1, longitude: 2, altitude: 0, accuracy: 0 } },
			{
				input: '1.23 2 5.0 123456.780',
				expected: { latitude: 1.23, longitude: 2, altitude: 5, accuracy: 123456.78 },
			},
		])('turns $input into $expected', ({ input, expected }) => {
			const actual = Geolocation.parseString(input);
			expect(actual?.latitude).to.equal(expected.latitude);
			expect(actual?.longitude).to.equal(expected.longitude);
			expect(actual?.altitude).to.equal(expected.altitude);
			expect(actual?.accuracy).to.equal(expected.accuracy);
		});
	});
});
