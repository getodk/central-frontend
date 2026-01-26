import { SINGLE_FEATURE_TYPES } from '@/components/common/map/getModeConfig.ts';
import {
	formatODKValue,
	getValidCoordinates,
	toODKCoordinateArray,
} from '@/components/common/map/map-helpers.ts';
import { COORDINATE_LAYOUT_XYZM } from '@/components/common/map/useMapViewControls.ts';
import Feature from 'ol/Feature';
import { LineString, Point, Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { describe, it, expect } from 'vitest';

describe('Map Helpers', () => {
	describe('formatODKValue', () => {
		it('returns empty string if no geometry', () => {
			const feature = new Feature();
			expect(formatODKValue(feature)).toBe('');
		});

		it('returns empty string if Point with no coordinates', () => {
			const geom = new Point([], COORDINATE_LAYOUT_XYZM);
			const feature = new Feature({ geometry: geom });
			expect(formatODKValue(feature)).toBe('');
		});

		it('formats Point with latitude and longitude only', () => {
			const lon = 2.2945;
			const lat = 48.8584;
			const coords = fromLonLat([lon, lat]);
			const geom = new Point(coords, COORDINATE_LAYOUT_XYZM);
			const feature = new Feature({ geometry: geom });
			expect(formatODKValue(feature)).toBe('48.85840000000002 2.2945');
		});

		it('formats Point with latitude, longitude, and altitude', () => {
			const lon = 2.2945;
			const lat = 48.8584;
			const alt = 170;
			const coords = fromLonLat([lon, lat, alt]);
			const geom = new Point(coords, COORDINATE_LAYOUT_XYZM);
			const feature = new Feature({ geometry: geom });
			expect(formatODKValue(feature)).toBe('48.85840000000002 2.2945 170');
		});

		it('formats Point with latitude, longitude, altitude, and accuracy', () => {
			const lon = 2.2945;
			const lat = 48.8584;
			const alt = 170;
			const acc = 5;
			const coords = fromLonLat([lon, lat, alt, acc]);
			const geom = new Point(coords, COORDINATE_LAYOUT_XYZM);
			const feature = new Feature({ geometry: geom });
			expect(formatODKValue(feature)).toBe('48.85840000000002 2.2945 170 5');
		});

		it('formats LineString', () => {
			const coords = [fromLonLat([0, 0]), fromLonLat([1, 1]), fromLonLat([2, 2])];
			const geom = new LineString(coords, COORDINATE_LAYOUT_XYZM);
			const feature = new Feature({ geometry: geom });
			expect(formatODKValue(feature)).toBe('0 0; 1 1; 2 2');
		});

		it('formats Polygon', () => {
			const coords = [
				[fromLonLat([0, 0]), fromLonLat([1, 0]), fromLonLat([1, 1]), fromLonLat([0, 0])],
			];
			const geom = new Polygon(coords, COORDINATE_LAYOUT_XYZM);
			const feature = new Feature({ geometry: geom });
			expect(formatODKValue(feature)).toBe('0 0; 0 1; 1 1; 0 0');
		});
	});

	describe('toODKCoordinateArray', () => {
		it('returns longitude and latitude only when altitude and accuracy were not provided', () => {
			const result = toODKCoordinateArray(2.2945, 48.8584, null, null);
			expect(result).toEqual([48.8584, 2.2945]);
		});

		it('returns coordinates with altitude', () => {
			const result = toODKCoordinateArray(2.2945, 48.8584, 170, null);
			expect(result).toEqual([48.8584, 2.2945, 170]);
		});

		it('returns coordinates with accuracy and defaults altitude to 0', () => {
			const result = toODKCoordinateArray(2.2945, 48.8584, null, 5);
			expect(result).toEqual([48.8584, 2.2945, 0, 5]);
		});

		it('returns coordinates with altitude and accuracy', () => {
			const result = toODKCoordinateArray(2.2945, 48.8584, 170, 5);
			expect(result).toEqual([48.8584, 2.2945, 170, 5]);
		});
	});

	describe('getValidCoordinates', () => {
		it('returns undefined for invalid geometry', () => {
			expect(getValidCoordinates(undefined, undefined)).toBeUndefined();
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates({ type: 'Point' }, undefined)).toBeUndefined();
			expect(getValidCoordinates({ type: 'Point', coordinates: [] }, undefined)).toBeUndefined();
		});

		it('returns projected coordinates for a valid Point', () => {
			const geometry = { type: 'Point', coordinates: [2.2945, 48.8584] };
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates(geometry, SINGLE_FEATURE_TYPES.POINT)).toEqual(
				fromLonLat([2.2945, 48.8584])
			);
		});

		it('returns projected coordinates for a valid LineString', () => {
			const geometry = {
				type: 'LineString',
				coordinates: [
					[2.2945, 48.8584],
					[2.3522, 48.8606],
				],
			};
			const expected = [fromLonLat([2.2945, 48.8584]), fromLonLat([2.3522, 48.8606])];
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates(geometry, SINGLE_FEATURE_TYPES.TRACE)).toEqual(expected);
		});

		it('returns undefined for LineString with length < 2', () => {
			const geometry = { type: 'LineString', coordinates: [[2.2945, 48.8584]] };
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates(geometry, SINGLE_FEATURE_TYPES.TRACE)).toBeUndefined();
		});

		it('returns undefined for closed LineString', () => {
			const geometry = {
				type: 'LineString',
				coordinates: [
					[2.2945, 48.8584],
					[2.3522, 48.8606],
					[2.2945, 48.8584],
				],
			};
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates(geometry, SINGLE_FEATURE_TYPES.TRACE)).toBeUndefined();
		});

		it('returns projected coordinates for a valid Polygon', () => {
			const geometry = {
				type: 'Polygon',
				coordinates: [
					[
						[2.2945, 48.8584],
						[2.3522, 48.8606],
						[2.3324, 48.8572],
						[2.2945, 48.8584],
					],
				],
			};
			const expected = [
				[
					fromLonLat([2.2945, 48.8584]),
					fromLonLat([2.3522, 48.8606]),
					fromLonLat([2.3324, 48.8572]),
					fromLonLat([2.2945, 48.8584]),
				],
			];
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates(geometry, SINGLE_FEATURE_TYPES.SHAPE)).toEqual(expected);
		});

		it('returns undefined for Polygon with length < 3', () => {
			const geometry = {
				type: 'Polygon',
				coordinates: [
					[
						[2.2945, 48.8584],
						[2.2945, 48.8584],
					],
				],
			};
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates(geometry, SINGLE_FEATURE_TYPES.SHAPE)).toBeUndefined();
		});

		it('returns undefined for open Polygon', () => {
			const geometry = {
				type: 'Polygon',
				coordinates: [
					[
						[2.2945, 48.8584],
						[2.3522, 48.8606],
						[2.3324, 48.8572],
					],
				],
			};
			// @ts-expect-error - skip type check for testing purposes
			expect(getValidCoordinates(geometry, SINGLE_FEATURE_TYPES.SHAPE)).toBeUndefined();
		});
	});
});
