import { formatODKValue } from '@/components/common/map/map-helpers.ts';
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
});
