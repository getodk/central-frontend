import type { Coordinate } from 'ol/coordinate';
import { LineString, MultiPoint, Point, type Polygon } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import type { Rule } from 'ol/style/flat';
import mapLocationIcon from '@/assets/images/map-location.svg';
import type { StyleFunction } from 'ol/style/Style';
import { getFlatCoordinates } from '@/components/common/map/vertex-geometry.ts';

const HIGHLIGHT_DRAW_COLOR = '#3488AF';
const DEFAULT_DRAW_LINE_COLOR = '#82C3E0';
const DEFAULT_VERTEX_FILL_COLOR = '#FFFFFF';
const DEFAULT_POLYGON_FILL_COLOR = 'rgba(233, 248, 255, 0.8)';
const DEFAULT_STROKE_COLOR = '#3E9FCC';
const DEFAULT_STROKE_WIDTH = 4;

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
	'stroke-width': DEFAULT_STROKE_WIDTH,
	'stroke-color': DEFAULT_STROKE_COLOR,
	'fill-color': DEFAULT_POLYGON_FILL_COLOR,
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

const BLUE_GLOW_COLOR = 'rgba(148, 224, 237, 0.7)';

const BLUE_GLOW_POINT_STYLE = {
	'circle-radius': 30,
	'circle-fill-color': BLUE_GLOW_COLOR,
	'circle-displacement': [0, 22],
};

const OUTLINE_STROKE_WIDTH = 20;
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
const LINE_HIT_TOLERANCE_COLOR = 'rgba( 255, 255, 255, 0.1)';
const LINE_HIT_TOLERANCE = {
	'stroke-width': OUTLINE_STROKE_WIDTH,
	'stroke-color': LINE_HIT_TOLERANCE_COLOR,
};

const getVertexStyle = (borderColor: string, fillColor: string, size = 8) => {
	return new CircleStyle({
		radius: size,
		fill: new Fill({ color: fillColor }),
		stroke: new Stroke({ color: borderColor, width: 2 }),
	});
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

const createFeatureDrawStyle = (featureColor: string) => {
	return new Style({
		stroke: new Stroke({ color: featureColor, width: DEFAULT_STROKE_WIDTH }),
		fill: new Fill({ color: DEFAULT_POLYGON_FILL_COLOR }),
	});
};

const createUnselectedVertexDrawStyle = (featureColor: string, coords: Coordinate[]) => {
	return new Style({
		image: getVertexStyle(featureColor, DEFAULT_VERTEX_FILL_COLOR),
		geometry: () => (coords.length > 1 ? new MultiPoint(coords.slice(0, -1)) : undefined),
	});
};

const createSelectedVertexDrawStyle = (vertexIndex: number | undefined, coords: Coordinate[]) => {
	return new Style({
		image: getVertexStyle('#FFFFFF', HIGHLIGHT_DRAW_COLOR),
		geometry: () => {
			if (vertexIndex === undefined) {
				return;
			}
			const selectedCoords = coords[vertexIndex];
			if (selectedCoords?.length) {
				return new Point(selectedCoords);
			}
		},
	});
};

const createLastVertexDrawStyle = (offset: number, coords: Coordinate[]) => {
	return new Style({
		image: getVertexStyle(HIGHLIGHT_DRAW_COLOR, DEFAULT_VERTEX_FILL_COLOR),
		geometry: () => {
			const firstCoordinate = coords[0];
			if (coords.length === 1 && firstCoordinate) {
				return new Point(firstCoordinate);
			}

			const lastAdded = coords.length === 2 ? coords[1] : coords[coords.length - offset];
			if (lastAdded) {
				return new Point(lastAdded);
			}
		},
	});
};

export function getDrawStyles(
	isFeatureSelectedProp: string,
	selectedVertexIndexProp: string
): StyleFunction {
	return (feature) => {
		const geometry = feature?.getGeometry() as LineString | Polygon;
		const coords = getFlatCoordinates(geometry);
		if (!coords.length) {
			return [];
		}

		const isFeatureSelected = !!feature.get(isFeatureSelectedProp);
		const vertexIndex = isFeatureSelected
			? (feature.get(selectedVertexIndexProp) as number | undefined)
			: undefined;
		// Selected vertex has priority, so the feature is only highlighted if no vertex is selected.
		const featureColor =
			isFeatureSelected && vertexIndex === undefined
				? HIGHLIGHT_DRAW_COLOR
				: DEFAULT_DRAW_LINE_COLOR;

		// LineString doesn’t auto-close; Polygon does.
		// For Polygon, the user’s last added vertex is the second-to-last point.
		const offset = geometry instanceof LineString ? 1 : 2;

		return [
			createFeatureDrawStyle(featureColor),
			createUnselectedVertexDrawStyle(featureColor, coords),
			createLastVertexDrawStyle(offset, coords),
			createSelectedVertexDrawStyle(vertexIndex, coords),
		];
	};
}

export function getPhantomPointStyle(): Style | undefined {
	const vertex = getVertexStyle(HIGHLIGHT_DRAW_COLOR, HIGHLIGHT_DRAW_COLOR, DEFAULT_STROKE_WIDTH);

	// Make it transparent on touch devices to suppress phantom visibility
	const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	if (isTouchDevice) {
		vertex.setOpacity(0);
	}

	return new Style({ image: vertex });
}
