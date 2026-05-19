import { describe, it, expect, vi } from 'vitest';
import {
	createFeatureCollectionAndProps,
	parseGeoJSONGeometry,
	getGeometryFromJSON,
	toGeoJsonCoordinateArray,
} from '@/components/common/map/geojson-parsers.ts';
import type { SelectItem } from '@getodk/xforms-engine';

describe('GeoJson Parsers', () => {
	describe('createFeatureCollectionAndProps', () => {
		const createSelectItem = (
			value: string,
			label: string | null,
			geometry: string,
			properties: Array<[string, string]> = []
		): SelectItem => {
			return {
				value,
				// @ts-expect-error light typing for test purposes
				label: { asString: label ?? '' },
				properties: [['geometry', geometry], ...properties],
			};
		};

		it('converts a single ODK point to a GeoJSON Point feature', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', [
					['marker-color', '#ff0000'],
				]),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060 100 5',
							'odk_marker-color': '#ff0000',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('converts an ODK trace to a GeoJSON LineString feature', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem('trace1', 'Trace 1', '40.7128 -74.0060;40.7129 -74.0061 0 25', [
					['stroke', '#0000ff'],
				]),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'LineString',
							coordinates: [
								[-74.006, 40.7128],
								[-74.0061, 40.7129, 0, 25],
							],
						},
						properties: {
							odk_label: 'Trace 1',
							odk_value: 'trace1',
							odk_geometry: '40.7128 -74.0060;40.7129 -74.0061 0 25',
							odk_stroke: '#0000ff',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('converts an ODK shape to a GeoJSON Polygon feature', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem(
					'shape1',
					'Shape 1',
					'40.7128 -74.0060 1300;40.7129 -74.0061 1400 6;40.7128 -74.0060',
					[['fill', '#00ff00']]
				),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Polygon',
							coordinates: [
								[
									[-74.006, 40.7128, 1300],
									[-74.0061, 40.7129, 1400, 6],
									[-74.006, 40.7128],
								],
							],
						},
						properties: {
							odk_label: 'Shape 1',
							odk_value: 'shape1',
							odk_geometry: '40.7128 -74.0060 1300;40.7129 -74.0061 1400 6;40.7128 -74.0060',
							odk_fill: '#00ff00',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('skips features with invalid ODK geometry and logs warning', () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const odkFeatures: SelectItem[] = [
				createSelectItem('invalid1', 'Invalid 1', 'invalid-geometry', []),
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', []),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060 100 5',
						},
					},
				],
			});

			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('Invalid geo point coordinates: invalid-geometry')
			);
			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('skips features with empty ODK geometry and logs warning', () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const odkFeatures: SelectItem[] = [
				createSelectItem('empty1', 'Empty 1', '', [['marker-color', '#ff0000']]),
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', []),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060 100 5',
						},
					},
				],
			});

			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('Missing or empty geometry for option: empty1')
			);
			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('handles undefined odkFeatures input', () => {
			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(undefined);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [],
			});
			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('handles empty odkFeatures array', () => {
			const odkFeatures: SelectItem[] = [];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [],
			});
			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('handles non-reserved properties in orderedExtraPropsMap', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', [
					['marker-color', '#ff0000'],
					['custom-prop', 'value1'],
					['another-prop', 'value2'],
				]),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060 100 5',
							'odk_marker-color': '#ff0000',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(
				new Map([
					[
						'point1',
						[
							['custom-prop', 'value1'],
							['another-prop', 'value2'],
						],
					],
				])
			);
		});

		it('removes reserved properties of Entities in orderedExtraPropsMap', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', [
					['__version', 'v34.29.7'],
					['clinic-name', 'New Hope Clinic'],
					['__trunkVersion', 'v1.1.1'],
					['__clinic-id', '123456'],
					['__branchId', 'id-abc'],
					['another-prop', 'value2'],
				]),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk___branchId: 'id-abc',
							odk___trunkVersion: 'v1.1.1',
							odk___version: 'v34.29.7',
							odk_geometry: '40.7128 -74.0060 100 5',
							odk_label: 'Point 1',
							odk_value: 'point1',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(
				new Map([
					[
						'point1',
						[
							['clinic-name', 'New Hope Clinic'],
							['__clinic-id', '123456'],
							['another-prop', 'value2'],
						],
					],
				])
			);
		});

		it('handles null label in ODK features', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem('point1', null, '40.7128 -74.0060 100 5', [['marker-color', '#ff0000']]),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: '',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060 100 5',
							'odk_marker-color': '#ff0000',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('handles invalid ODK coordinates (out of range)', () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const odkFeatures: SelectItem[] = [
				createSelectItem('invalid1', 'Invalid 1', '100 -200 100 5', []),
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', []),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060 100 5',
						},
					},
				],
			});

			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('Invalid geo point coordinates: 100 -200 100 5')
			);
			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('handles partial ODK point format (missing altitude/accuracy)', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060', [['marker-color', '#ff0000']]),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060',
							'odk_marker-color': '#ff0000',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('handles ODK point with extra whitespace', () => {
			const odkFeatures: SelectItem[] = [
				createSelectItem('point1', 'Point 1', '  40.7128   -74.0060  100  5  ', [
					['marker-color', '#ff0000'],
				]),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128   -74.0060  100  5',
							'odk_marker-color': '#ff0000',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(new Map());
		});

		it('converts multiple ODK features (Point, LineString, Polygon, invalid) to a GeoJSON FeatureCollection', () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const odkFeatures: SelectItem[] = [
				createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', [
					['marker-color', '#ff0000'],
					['custom-prop', 'value1'],
				]),
				createSelectItem('trace1', 'Trace 1', '40.7128 -74.0060;40.7129 -74.0061', [
					['stroke', '#0000ff'],
				]),
				createSelectItem(
					'shape1',
					'Shape 1',
					'40.7128 -74.0060 100 5;40.7129 -74.0061 0 0;40.7128 -74.0060 0 12',
					[
						['fill', '#00ff00'],
						['another-prop', 'value2'],
					]
				),
				createSelectItem('invalid1', 'Invalid 1', 'invalid-geometry', []),
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: 'Point 1',
							odk_value: 'point1',
							odk_geometry: '40.7128 -74.0060 100 5',
							'odk_marker-color': '#ff0000',
						},
					},
					{
						type: 'Feature',
						geometry: {
							type: 'LineString',
							coordinates: [
								[-74.006, 40.7128],
								[-74.0061, 40.7129],
							],
						},
						properties: {
							odk_label: 'Trace 1',
							odk_value: 'trace1',
							odk_geometry: '40.7128 -74.0060;40.7129 -74.0061',
							odk_stroke: '#0000ff',
						},
					},
					{
						type: 'Feature',
						geometry: {
							type: 'Polygon',
							coordinates: [
								[
									[-74.006, 40.7128, 100, 5],
									[-74.0061, 40.7129, 0, 0],
									[-74.006, 40.7128, 0, 12],
								],
							],
						},
						properties: {
							odk_label: 'Shape 1',
							odk_value: 'shape1',
							odk_geometry: '40.7128 -74.0060 100 5;40.7129 -74.0061 0 0;40.7128 -74.0060 0 12',
							odk_fill: '#00ff00',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(
				new Map([
					['point1', [['custom-prop', 'value1']]],
					['shape1', [['another-prop', 'value2']]],
				])
			);

			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('Invalid geo point coordinates: invalid-geometry')
			);
		});

		it('converts string ODK features to a GeoJSON FeatureCollection', () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const odkFeatures: string[] = [
				'40.7128 -74.0060 100 5',
				'40.7128 -74.0060 100 5;40.7129 -74.0061 100 5',
				'40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
				'', // invalid feature
				'40.7128', // invalid feature
				'abc', // invalid feature
			];

			const { featureCollection, orderedExtraPropsMap } =
				createFeatureCollectionAndProps(odkFeatures);

			expect(featureCollection).toEqual({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
						properties: {
							odk_label: '40.7128 -74.0060 100 5',
							odk_value: '40.7128 -74.0060 100 5',
							odk_geometry: '40.7128 -74.0060 100 5',
						},
					},
					{
						type: 'Feature',
						geometry: {
							type: 'LineString',
							coordinates: [
								[-74.006, 40.7128, 100, 5],
								[-74.0061, 40.7129, 100, 5],
							],
						},
						properties: {
							odk_label: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5',
							odk_value: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5',
							odk_geometry: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5',
						},
					},
					{
						type: 'Feature',
						geometry: {
							type: 'Polygon',
							coordinates: [
								[
									[-74.006, 40.7128, 100, 5],
									[-74.0061, 40.7129, 100, 5],
									[-74.006, 40.7128, 100, 5],
								],
							],
						},
						properties: {
							odk_label: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
							odk_value: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
							odk_geometry: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
						},
					},
				],
			});

			expect(orderedExtraPropsMap).toEqual(new Map());

			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith('Missing or empty geometry for option: ');
			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith('Invalid geo point coordinates: 40.7128');
			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith('Missing geo points for option: 40.7128');
			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith('Invalid geo point coordinates: abc');
			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith('Missing geo points for option: abc');
		});
	});

	describe('parseGeoJSONGeometry', () => {
		it('returns undefined for empty string', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => false);
			expect(parseGeoJSONGeometry('')).toBeUndefined();
			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('Invalid geo point coordinates: ')
			);
		});

		it('returns undefined for invalid coordinates', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => false);
			expect(parseGeoJSONGeometry('abc def')).toBeUndefined();
			// eslint-disable-next-line no-console
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('Invalid geo point coordinates: ')
			);
		});

		it('returns Point for single valid coordinate', () => {
			expect(parseGeoJSONGeometry('40.7128 -74.0060 100 5')).toEqual({
				type: 'Point',
				coordinates: [-74.006, 40.7128, 100, 5],
			});
		});

		it('returns LineString for multiple valid coordinates', () => {
			expect(parseGeoJSONGeometry('40.7128 -74.0060;40.7129 -74.0061')).toEqual({
				type: 'LineString',
				coordinates: [
					[-74.006, 40.7128],
					[-74.0061, 40.7129],
				],
			});
		});

		it('returns Polygon for multiple closed coordinates', () => {
			expect(parseGeoJSONGeometry('40.7128 -74.0060;40.7129 -74.0061;40.7128 -74.0060')).toEqual({
				type: 'Polygon',
				coordinates: [
					[
						[-74.006, 40.7128],
						[-74.0061, 40.7129],
						[-74.006, 40.7128],
					],
				],
			});
		});
	});

	describe('toGeoJsonCoordinateArray', () => {
		it('returns longitude and latitude only when altitude and accuracy were not provided', () => {
			const result = toGeoJsonCoordinateArray(2.2945, 48.8584, null, null);
			expect(result).toEqual([2.2945, 48.8584]);
		});

		it('returns coordinates with altitude', () => {
			const result = toGeoJsonCoordinateArray(2.2945, 48.8584, 170, null);
			expect(result).toEqual([2.2945, 48.8584, 170]);
		});

		it('returns coordinates with accuracy and defaults altitude to 0', () => {
			const result = toGeoJsonCoordinateArray(2.2945, 48.8584, null, 5);
			expect(result).toEqual([2.2945, 48.8584, 0, 5]);
		});

		it('returns coordinates with altitude and accuracy', () => {
			const result = toGeoJsonCoordinateArray(2.2945, 48.8584, 170, 5);
			expect(result).toEqual([2.2945, 48.8584, 170, 5]);
		});
	});

	describe('getGeometryFromJSON', () => {
		it('returns the geometry of the first feature for a valid GeoJSON', () => {
			const text = JSON.stringify({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.006, 40.7128, 100, 5],
						},
					},
				],
			});
			expect(getGeometryFromJSON(text)).toEqual({
				type: 'Point',
				coordinates: [-74.006, 40.7128, 100, 5],
			});
		});

		it('returns undefined for an invalid GeoJSON', () => {
			const empty = JSON.stringify({
				type: 'FeatureCollection',
				features: [],
			});
			expect(getGeometryFromJSON(empty)).toBeUndefined();

			const noGeometry = JSON.stringify({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
					},
				],
			});
			expect(getGeometryFromJSON(noGeometry)).toBeUndefined();

			const invalidJson = 'abc';
			expect(getGeometryFromJSON(invalidJson)).toBeUndefined();
		});
	});
});
