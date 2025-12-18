import {
	getDrawStyles,
	getPhantomPointStyle,
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
import Feature from 'ol/Feature';
import { LineString, MultiPoint, Point, Polygon } from 'ol/geom';
import { Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { describe, it, expect } from 'vitest';

describe('Map Styles', () => {
	const featureIdProp = 'id';
	const selectedPropName = 'selectedId';
	const savedPropName = 'savedId';
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const iconMock: string = expect.any(String);

	it('returns style rules for unselected state', () => {
		const [pointRule, featureRule, hitToleranceRule] = getUnselectedStyles(
			featureIdProp,
			selectedPropName,
			savedPropName
		);

		expect(pointRule).toEqual({
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Point']]],
				['!=', ['get', 'id'], ['var', 'selectedId']],
				['!=', ['get', 'id'], ['var', 'savedId']],
			],
			style: {
				'icon-src': iconMock,
				'icon-width': 40,
				'icon-height': 40,
				'icon-anchor': [0.5, 0.95],
				'icon-anchor-x-units': 'fraction',
				'icon-anchor-y-units': 'fraction',
			},
		});

		expect(featureRule).toEqual({
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]],
				['!=', ['get', 'id'], ['var', 'selectedId']],
				['!=', ['get', 'id'], ['var', 'savedId']],
			],
			style: {
				'stroke-width': 4,
				'stroke-color': '#3E9FCC',
				'fill-color': 'rgba(233, 248, 255, 0.8)',
			},
		});

		expect(hitToleranceRule).toEqual({
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['LineString']]],
				['!=', ['get', 'id'], ['var', 'selectedId']],
				['!=', ['get', 'id'], ['var', 'savedId']],
			],
			style: {
				'stroke-width': 20,
				'stroke-color': 'rgba( 255, 255, 255, 0.1)',
			},
		});
	});

	it('returns style rules for selected state', () => {
		const [pointRule, featureRule] = getSelectedStyles(
			featureIdProp,
			selectedPropName,
			savedPropName
		);

		expect(pointRule).toEqual({
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Point']]],
				['==', ['get', 'id'], ['var', 'selectedId']],
				['!=', ['get', 'id'], ['var', 'savedId']],
			],
			style: [
				{
					'circle-radius': 30,
					'circle-fill-color': 'rgba(148, 224, 237, 0.7)',
					'circle-displacement': [0, 22],
				},
				{
					'icon-src': iconMock,
					'icon-width': 40,
					'icon-height': 40,
					'icon-anchor': [0.5, 0.95],
					'icon-anchor-x-units': 'fraction',
					'icon-anchor-y-units': 'fraction',
				},
				{
					'icon-src': iconMock,
					'icon-width': 50,
					'icon-height': 50,
					'icon-anchor': [0.5, 0.95],
					'icon-anchor-x-units': 'fraction',
					'icon-anchor-y-units': 'fraction',
				},
			],
		});

		expect(featureRule).toEqual({
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]],
				['==', ['get', 'id'], ['var', 'selectedId']],
				['!=', ['get', 'id'], ['var', 'savedId']],
			],
			style: [
				{
					'stroke-width': 20,
					'stroke-color': 'rgba(148, 224, 237, 0.7)',
					'fill-color': 'transparent',
				},
				{
					'stroke-width': 4,
					'stroke-color': '#3E9FCC',
					'fill-color': 'rgba(233, 248, 255, 0.8)',
				},
				{
					'stroke-width': 6,
				},
			],
		});
	});

	it('returns style rules for saved state', () => {
		const [pointRule, featureRule] = getSavedStyles(featureIdProp, savedPropName);

		expect(pointRule).toEqual({
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Point']]],
				['==', ['get', 'id'], ['var', 'savedId']],
			],
			style: [
				{
					'circle-radius': 30,
					'circle-fill-color': 'rgba(34, 197, 94, 0.6)',
					'circle-displacement': [0, 22],
				},
				{
					'icon-src': iconMock,
					'icon-width': 40,
					'icon-height': 40,
					'icon-anchor': [0.5, 0.95],
					'icon-anchor-x-units': 'fraction',
					'icon-anchor-y-units': 'fraction',
				},
				{
					'icon-src': iconMock,
					'icon-width': 50,
					'icon-height': 50,
					'icon-anchor': [0.5, 0.95],
					'icon-anchor-x-units': 'fraction',
					'icon-anchor-y-units': 'fraction',
				},
			],
		});

		expect(featureRule).toEqual({
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]],
				['==', ['get', 'id'], ['var', 'savedId']],
			],
			style: [
				{
					'stroke-width': 20,
					'stroke-color': 'rgba(34, 197, 94, 0.6)',
					'fill-color': 'transparent',
				},
				{
					'stroke-width': 4,
					'stroke-color': '#3E9FCC',
					'fill-color': 'rgba(233, 248, 255, 0.8)',
				},
				{
					'stroke-width': 6,
				},
			],
		});
	});

	it('returns the phantom point style', () => {
		const style = getPhantomPointStyle();
		expect(style).toBeInstanceOf(Style);
		const image = style?.getImage() as CircleStyle;
		expect(image).toBeInstanceOf(CircleStyle);
		expect(image.getRadius()).toBe(4);
		expect(image.getFill()?.getColor()).toBe('#3488AF');
		expect(image.getStroke()?.getColor()).toBe('#3488AF');
		expect(image.getStroke()?.getWidth()).toBe(2);
	});

	describe('getDrawStyles', () => {
		const isFeatureSelectedProp = 'isSelected';
		const selectedVertexIndexProp = 'selectedVertexIndex';
		const drawStyleFunction = getDrawStyles(isFeatureSelectedProp, selectedVertexIndexProp);
		const lineCoords = [
			[0, 0],
			[1, 1],
			[2, 2],
		];

		const expectVertexStyle = (
			image: CircleStyle,
			borderColor: string,
			fillColor: string,
			size = 8
		) => {
			expect(image).toBeInstanceOf(CircleStyle);
			expect(image.getRadius()).toBe(size);
			expect(image.getFill()?.getColor()).toBe(fillColor);
			expect(image.getStroke()?.getColor()).toBe(borderColor);
			expect(image.getStroke()?.getWidth()).toBe(2);
		};

		const expectFeatureDrawStyle = (
			style: Style,
			strokeColor: string,
			strokeWidth: number,
			fillColor: string
		) => {
			expect(style).toBeInstanceOf(Style);
			expect(style.getStroke()?.getColor()).toBe(strokeColor);
			expect(style.getStroke()?.getWidth()).toBe(strokeWidth);
			expect(style.getFill()?.getColor()).toBe(fillColor);
		};

		it('returns empty array for feature with no coordinates', () => {
			const feature = new Feature({ geometry: new LineString([]) });
			const styles = drawStyleFunction(feature, 0);
			expect(styles).toEqual([]);
		});

		it('returns draw styles for unselected LineString feature', () => {
			const feature = new Feature({ geometry: new LineString(lineCoords) });
			feature.set(isFeatureSelectedProp, false);
			const styles = drawStyleFunction(feature, 0) as Style[];
			expect(styles.length).toBe(4);

			const featureStyle = styles[0]!;
			expectFeatureDrawStyle(featureStyle, '#82C3E0', 4, 'rgba(233, 248, 255, 0.8)');

			const unselectedStyle = styles[1]!;
			const unselectedImage = unselectedStyle.getImage() as CircleStyle;
			expectVertexStyle(unselectedImage, '#82C3E0', '#FFFFFF');
			const unselectedGeom = unselectedStyle.getGeometryFunction()(feature) as MultiPoint;
			expect(unselectedGeom).toBeInstanceOf(MultiPoint);
			expect(unselectedGeom.getCoordinates()).toEqual([
				[0, 0],
				[1, 1],
			]);

			const lastStyle = styles[2]!;
			const lastImage = lastStyle.getImage() as CircleStyle;
			expectVertexStyle(lastImage, '#3488AF', '#FFFFFF');
			const lastGeom = lastStyle.getGeometryFunction()(feature) as Point;
			expect(lastGeom).toBeInstanceOf(Point);
			expect(lastGeom.getCoordinates()).toEqual([2, 2]);

			const selectedStyle = styles[3]!;
			const selectedGeom = selectedStyle.getGeometryFunction()(feature);
			expect(selectedGeom).toBeUndefined();
		});

		it('returns draw styles for selected LineString feature with no vertex selected', () => {
			const feature = new Feature({ geometry: new LineString(lineCoords) });
			feature.set(isFeatureSelectedProp, true);
			const styles = drawStyleFunction(feature, 0) as Style[];
			expect(styles.length).toBe(4);

			const featureStyle = styles[0]!;
			expectFeatureDrawStyle(featureStyle, '#3488AF', 4, 'rgba(233, 248, 255, 0.8)');

			const unselectedStyle = styles[1]!;
			const unselectedImage = unselectedStyle.getImage() as CircleStyle;
			expectVertexStyle(unselectedImage, '#3488AF', '#FFFFFF');

			const lastStyle = styles[2]!;
			const lastGeom = lastStyle.getGeometryFunction()(feature) as Point;
			expect(lastGeom.getCoordinates()).toEqual([2, 2]);

			const selectedStyle = styles[3]!;
			const selectedGeom = selectedStyle.getGeometryFunction()(feature);
			expect(selectedGeom).toBeUndefined();
		});

		it('returns draw styles for selected LineString feature with a vertex selected', () => {
			const feature = new Feature({ geometry: new LineString(lineCoords) });
			feature.set(isFeatureSelectedProp, true);
			feature.set(selectedVertexIndexProp, 1);
			const styles = drawStyleFunction(feature, 0) as Style[];
			expect(styles.length).toBe(4);

			const featureStyle = styles[0]!;
			expectFeatureDrawStyle(featureStyle, '#82C3E0', 4, 'rgba(233, 248, 255, 0.8)');

			const unselectedStyle = styles[1]!;
			const unselectedImage = unselectedStyle.getImage() as CircleStyle;
			expectVertexStyle(unselectedImage, '#82C3E0', '#FFFFFF');

			const lastStyle = styles[2]!;
			const lastGeom = lastStyle.getGeometryFunction()(feature) as Point;
			expect(lastGeom.getCoordinates()).toEqual([2, 2]);

			const selectedStyle = styles[3]!;
			const selectedImage = selectedStyle.getImage() as CircleStyle;
			expectVertexStyle(selectedImage, '#FFFFFF', '#3488AF');
			const selectedGeom = selectedStyle.getGeometryFunction()(feature) as Point;
			expect(selectedGeom).toBeInstanceOf(Point);
			expect(selectedGeom.getCoordinates()).toEqual([1, 1]);
		});

		it('returns draw styles for unselected Polygon feature', () => {
			const coords = [
				[
					[0, 0],
					[1, 1],
					[2, 2],
					[0, 0],
				],
			];
			const feature = new Feature({ geometry: new Polygon(coords) });
			feature.set(isFeatureSelectedProp, false);
			const styles = drawStyleFunction(feature, 0) as Style[];
			expect(styles.length).toBe(4);

			const featureStyle = styles[0]!;
			expectFeatureDrawStyle(featureStyle, '#82C3E0', 4, 'rgba(233, 248, 255, 0.8)');

			const unselectedStyle = styles[1]!;
			const unselectedGeom = unselectedStyle.getGeometryFunction()(feature) as MultiPoint;
			expect(unselectedGeom).toBeInstanceOf(MultiPoint);
			expect(unselectedGeom.getCoordinates()).toEqual([
				[0, 0],
				[1, 1],
				[2, 2],
			]);

			const lastStyle = styles[2]!;
			const lastGeom = lastStyle.getGeometryFunction()(feature) as Point;
			expect(lastGeom).toBeInstanceOf(Point);
			expect(lastGeom.getCoordinates()).toEqual([2, 2]);

			const selectedStyle = styles[3]!;
			const selectedGeom = selectedStyle.getGeometryFunction()(feature);
			expect(selectedGeom).toBeUndefined();
		});
	});
});
