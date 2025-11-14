import type { Rule } from 'ol/style/flat';
import mapLocationIcon from '@/assets/images/map-location.svg';

const DEFAULT_STROKE_COLOR = '#3E9FCC';

const ICON_ANCHOR = {
	'icon-anchor': [0.5, 0.95],
	'icon-anchor-x-units': 'fraction' as const,
	'icon-anchor-y-units': 'fraction' as const,
};

const DEFAULT_POINT_STYLE = {
	'icon-src': mapLocationIcon,
	'icon-width': 40,
	'icon-height': 40,
	...ICON_ANCHOR,
};

const DEFAULT_FEATURE_STYLE = {
	'stroke-width': 4,
	'stroke-color': DEFAULT_STROKE_COLOR,
	'fill-color': 'rgba(233, 248, 255, 0.8)',
};

const SCALE_POINT_STYLE = {
	'icon-src': mapLocationIcon,
	'icon-width': 50,
	'icon-height': 50,
	...ICON_ANCHOR,
};

const SCALE_FEATURE_STYLE = {
	'stroke-width': 6,
};

const OUTLINE_STROKE_WIDTH = 20;

const BLUE_GLOW_COLOR = 'rgba(148, 224, 237, 0.7)';

const BLUE_GLOW_POINT_STYLE = {
	'circle-radius': 30,
	'circle-fill-color': BLUE_GLOW_COLOR,
	'circle-displacement': [0, 22],
};

const BLUE_GLOW_FEATURE_STYLE = {
	'stroke-width': OUTLINE_STROKE_WIDTH,
	'stroke-color': BLUE_GLOW_COLOR,
	'fill-color': 'transparent',
};

const GREEN_GLOW_COLOR = 'rgba(34, 197, 94, 0.6)';

const GREEN_GLOW_POINT_STYLE = {
	'circle-radius': 30,
	'circle-fill-color': GREEN_GLOW_COLOR,
	'circle-displacement': [0, 22],
};

const GREEN_GLOW_FEATURE_STYLE = {
	'stroke-width': OUTLINE_STROKE_WIDTH,
	'stroke-color': GREEN_GLOW_COLOR,
	'fill-color': 'transparent',
};

// Increases the clickable area of the Line feature.
const LINE_HIT_TOLERANCE = {
	'stroke-width': OUTLINE_STROKE_WIDTH,
	'stroke-color': 'rgba( 255, 255, 255, 0.1)',
};

const makeFilter = (types: string[], additionalFilters: unknown[]) => {
	return ['all', ['in', ['geometry-type'], ['literal', types]], ...additionalFilters];
};

export function getUnselectedStyles(
	featureIdProp: string,
	selectedPropName: string,
	savedPropName: string
): Rule[] {
	const filters = [
		['!=', ['get', featureIdProp], ['var', selectedPropName]],
		['!=', ['get', featureIdProp], ['var', savedPropName]],
	];

	return [
		{
			filter: makeFilter(['Point'], filters),
			style: DEFAULT_POINT_STYLE,
		},
		{
			filter: makeFilter(['LineString', 'Polygon'], filters),
			style: DEFAULT_FEATURE_STYLE,
		},
		{
			filter: makeFilter(['LineString'], filters),
			style: LINE_HIT_TOLERANCE,
		},
	];
}

export function getSelectedStyles(
	featureIdProp: string,
	selectedPropName: string,
	savedPropName: string
): Rule[] {
	const filters = [
		['==', ['get', featureIdProp], ['var', selectedPropName]],
		['!=', ['get', featureIdProp], ['var', savedPropName]],
	];

	return [
		{
			filter: makeFilter(['Point'], filters),
			style: [BLUE_GLOW_POINT_STYLE, DEFAULT_POINT_STYLE, SCALE_POINT_STYLE],
		},
		{
			filter: makeFilter(['LineString', 'Polygon'], filters),
			style: [BLUE_GLOW_FEATURE_STYLE, DEFAULT_FEATURE_STYLE, SCALE_FEATURE_STYLE],
		},
	];
}

export function getSavedStyles(featureIdProp: string, savedPropName: string): Rule[] {
	const filter = ['==', ['get', featureIdProp], ['var', savedPropName]];

	return [
		{
			filter: makeFilter(['Point'], [filter]),
			style: [GREEN_GLOW_POINT_STYLE, DEFAULT_POINT_STYLE, SCALE_POINT_STYLE],
		},
		{
			filter: makeFilter(['LineString', 'Polygon'], [filter]),
			style: [GREEN_GLOW_FEATURE_STYLE, DEFAULT_FEATURE_STYLE, SCALE_FEATURE_STYLE],
		},
	];
}
