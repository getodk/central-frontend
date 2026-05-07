import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import { LineString, MultiPoint, Point, type Polygon } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import type { Rule } from 'ol/style/flat';
import mapLocationIcon from '@/assets/images/map-location.svg';
import mapSavedLocationIcon from '@/assets/images/map-saved-location.svg';
import type { StyleFunction } from 'ol/style/Style';
import { getFlatCoordinates } from '@/components/common/map/vertex-geometry.ts';
import { Map } from 'ol';
import { getPointResolution } from 'ol/proj';

const HIGHLIGHT_DRAW_COLOR = '#3488AF';
const DEFAULT_DRAW_LINE_COLOR = '#82C3E0';
const DEFAULT_VERTEX_FILL_COLOR = '#FFFFFF';
const DEFAULT_POLYGON_FILL_COLOR = 'rgba(233, 248, 255, 0.8)';
const DEFAULT_STROKE_COLOR = '#3E9FCC';
const DEFAULT_STROKE_WIDTH = 4;
const CLEAR_STROKE_COLOR = '#FFFFFF';

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

const SAVED_POINT_STYLE = {
	...DEFAULT_POINT_STYLE,
	'icon-src': mapSavedLocationIcon,
};

const DEFAULT_FEATURE_STYLE = {
	'stroke-width': DEFAULT_STROKE_WIDTH,
	'stroke-color': DEFAULT_STROKE_COLOR,
	'fill-color': DEFAULT_POLYGON_FILL_COLOR,
};

const SCALE_POINT_STYLE = {
	...DEFAULT_POINT_STYLE,
	'icon-width': 50,
	'icon-height': 50,
};

const SCALE_SAVED_POINT_STYLE = {
	...SCALE_POINT_STYLE,
	'icon-src': mapSavedLocationIcon,
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

const GREEN_GLOW_FEATURE_STYLE = {
	'stroke-width': OUTLINE_STROKE_WIDTH,
	'stroke-color': 'rgba(34, 197, 94, 0.6)',
	'fill-color': 'transparent',
};

// Increases the clickable area of the Line feature.
const LINE_HIT_TOLERANCE_COLOR = 'rgba( 255, 255, 255, 0.1)';
const LINE_HIT_TOLERANCE = {
	'stroke-width': OUTLINE_STROKE_WIDTH,
	'stroke-color': LINE_HIT_TOLERANCE_COLOR,
};

const LOCATION_POINT_FILL = '#6393F2';
const ACCURACY_FILL = 'rgba(99, 147, 242, 0.3)';
const ACCURACY_STROKE = 'rgba(99, 147, 242, 0.1)';

const getCircleStyle = (fillColor: string, strokeColor: string, radius = 8, strokeSize = 2) => {
	return new CircleStyle({
		radius: radius,
		fill: new Fill({ color: fillColor }),
		stroke: new Stroke({ color: strokeColor, width: strokeSize }),
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
			style: [SAVED_POINT_STYLE, DEFAULT_POINT_STYLE, SCALE_SAVED_POINT_STYLE],
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
		image: getCircleStyle(DEFAULT_VERTEX_FILL_COLOR, featureColor),
		geometry: () => (coords.length > 1 ? new MultiPoint(coords.slice(0, -1)) : undefined),
	});
};

const createSelectedVertexDrawStyle = (vertexIndex: number | undefined, coords: Coordinate[]) => {
	return new Style({
		image: getCircleStyle(HIGHLIGHT_DRAW_COLOR, CLEAR_STROKE_COLOR),
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
		image: getCircleStyle(DEFAULT_VERTEX_FILL_COLOR, HIGHLIGHT_DRAW_COLOR),
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
	const vertex = getCircleStyle(HIGHLIGHT_DRAW_COLOR, HIGHLIGHT_DRAW_COLOR, 4);

	// Make it transparent on touch devices to suppress phantom visibility
	const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	if (isTouchDevice) {
		vertex.setOpacity(0);
	}

	return new Style({ image: vertex });
}

const LOCATION_DOT_RADIUS = 13;
const LOCATION_DOT_STYLE = new Style({
	image: new CircleStyle({
		radius: LOCATION_DOT_RADIUS,
		fill: new Fill({ color: LOCATION_POINT_FILL }),
		stroke: new Stroke({ color: CLEAR_STROKE_COLOR, width: DEFAULT_STROKE_WIDTH }),
	}),
	zIndex: 2,
});
const ACCURACY_FILL_STYLE = new Fill({ color: ACCURACY_FILL });
const ACCURACY_STROKE_STYLE = new Stroke({ color: ACCURACY_STROKE, width: 1 });
const STYLE_UPDATE_TOLERANCE_PX = 5;

export function createCurrentLocationStyle(map: Map): StyleFunction {
	const DOT_ONLY = [LOCATION_DOT_STYLE];
	const projection = map.getView().getProjection();
	let lastRadius = 0;
	let lastStyles = DOT_ONLY;

	return (feature: FeatureLike, resolution: number): Style[] => {
		const accuracy = feature.get('accuracy') as number | undefined;
		const geometry = feature.getGeometry() as Point;

		let targetRadius = 0;
		if (accuracy && geometry) {
			const mPerPixel = getPointResolution(projection, resolution, geometry.getCoordinates(), 'm');
			if (mPerPixel > 0) {
				targetRadius = accuracy / mPerPixel;
			}
		}

		if (Math.abs(targetRadius - lastRadius) < STYLE_UPDATE_TOLERANCE_PX) {
			return lastStyles;
		}

		lastRadius = targetRadius;
		const mapWidth = map.getSize()?.[0] ?? 0;
		if (targetRadius < LOCATION_DOT_RADIUS || targetRadius * 2 > mapWidth) {
			lastStyles = DOT_ONLY;
			return lastStyles;
		}

		lastStyles = [
			new Style({
				image: new CircleStyle({
					radius: targetRadius,
					fill: ACCURACY_FILL_STYLE,
					stroke: ACCURACY_STROKE_STYLE,
				}),
				zIndex: 1,
			}),
			LOCATION_DOT_STYLE,
		];

		return lastStyles;
	};
}
