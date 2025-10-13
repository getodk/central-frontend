import { describe, it, expect, vi } from 'vitest';
import { createFeatureCollectionAndProps } from '@/components/common/map/createFeatureCollectionAndProps';
import type { SelectItem } from '@getodk/xforms-engine';

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
						coordinates: [-74.006, 40.7128],
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

		expect(orderedExtraPropsMap).toEqual(new Map([['point1', []]]));
	});

	it('converts an ODK trace to a GeoJSON LineString feature', () => {
		const odkFeatures: SelectItem[] = [
			createSelectItem('trace1', 'Trace 1', '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5', [
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
							[-74.0061, 40.7129],
						],
					},
					properties: {
						odk_label: 'Trace 1',
						odk_value: 'trace1',
						odk_geometry: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5',
						odk_stroke: '#0000ff',
					},
				},
			],
		});

		expect(orderedExtraPropsMap).toEqual(new Map([['trace1', []]]));
	});

	it('converts an ODK shape to a GeoJSON Polygon feature', () => {
		const odkFeatures: SelectItem[] = [
			createSelectItem(
				'shape1',
				'Shape 1',
				'40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
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
								[-74.006, 40.7128],
								[-74.0061, 40.7129],
								[-74.006, 40.7128],
							],
						],
					},
					properties: {
						odk_label: 'Shape 1',
						odk_value: 'shape1',
						odk_geometry: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
						odk_fill: '#00ff00',
					},
				},
			],
		});

		expect(orderedExtraPropsMap).toEqual(new Map([['shape1', []]]));
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
						coordinates: [-74.006, 40.7128],
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
		expect(orderedExtraPropsMap).toEqual(
			new Map([
				['invalid1', []],
				['point1', []],
			])
		);
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
						coordinates: [-74.006, 40.7128],
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
		expect(orderedExtraPropsMap).toEqual(
			new Map([
				['empty1', []],
				['point1', []],
			])
		);
	});

	it('handles undefined odkFeatures input', () => {
		const { featureCollection, orderedExtraPropsMap } = createFeatureCollectionAndProps(undefined);

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
						coordinates: [-74.006, 40.7128],
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
						coordinates: [-74.006, 40.7128],
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

		expect(orderedExtraPropsMap).toEqual(new Map([['point1', []]]));
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
						coordinates: [-74.006, 40.7128],
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
		expect(orderedExtraPropsMap).toEqual(
			new Map([
				['invalid1', []],
				['point1', []],
			])
		);
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

		expect(orderedExtraPropsMap).toEqual(new Map([['point1', []]]));
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
						coordinates: [-74.006, 40.7128],
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

		expect(orderedExtraPropsMap).toEqual(new Map([['point1', []]]));
	});

	it('converts multiple ODK features (Point, LineString, Polygon, invalid) to a GeoJSON FeatureCollection', () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const odkFeatures: SelectItem[] = [
			createSelectItem('point1', 'Point 1', '40.7128 -74.0060 100 5', [
				['marker-color', '#ff0000'],
				['custom-prop', 'value1'],
			]),
			createSelectItem('trace1', 'Trace 1', '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5', [
				['stroke', '#0000ff'],
			]),
			createSelectItem(
				'shape1',
				'Shape 1',
				'40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
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
						coordinates: [-74.006, 40.7128],
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
						odk_geometry: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5',
						odk_stroke: '#0000ff',
					},
				},
				{
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[-74.006, 40.7128],
								[-74.0061, 40.7129],
								[-74.006, 40.7128],
							],
						],
					},
					properties: {
						odk_label: 'Shape 1',
						odk_value: 'shape1',
						odk_geometry: '40.7128 -74.0060 100 5;40.7129 -74.0061 100 5;40.7128 -74.0060 100 5',
						odk_fill: '#00ff00',
					},
				},
			],
		});

		expect(orderedExtraPropsMap).toEqual(
			new Map([
				['point1', [['custom-prop', 'value1']]],
				['trace1', []],
				['shape1', [['another-prop', 'value2']]],
				['invalid1', []],
			])
		);

		// eslint-disable-next-line no-console
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining('Invalid geo point coordinates: invalid-geometry')
		);
	});
});
