import {
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
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
});
