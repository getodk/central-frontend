import { COORDINATE_LAYOUT_XYZM } from '@/components/common/map/useMapViewControls.ts';
import type { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import { Point, LineString, Polygon } from 'ol/geom';

export const getFlatCoordinates = (geometry: LineString | Polygon | undefined) => {
	if (!geometry) {
		return [];
	}

	if (geometry instanceof LineString) {
		return geometry.getCoordinates();
	}

	return geometry.getCoordinates()[0] ?? [];
};

const getDeltaBetweenPoints = (pointA: number[], pointB: number[]) => {
	const isDefined = (point: number[]) => point.length > 1 && point[0] != null && point[1] != null;
	if (!isDefined(pointA) || !isDefined(pointB)) {
		return { deltaX: 0, deltaY: 0 };
	}

	const [ax, ay] = pointA as [number, number];
	const [bx, by] = pointB as [number, number];
	return { deltaX: ax - bx, deltaY: ay - by };
};

/**
 * Computes the squared Euclidean distance between two points using the Pythagorean theorem.
 */
const getDistanceBetweenPoints = (deltaX: number, deltaY: number) => {
	// prettier-ignore
	return (deltaX ** 2) + (deltaY ** 2);
};

const getClosestPointOnSegment = (
	point: Coordinate,
	segmentStart: Coordinate,
	segmentEnd: Coordinate
): Coordinate => {
	const { deltaX, deltaY } = getDeltaBetweenPoints(segmentEnd, segmentStart);
	const segmentSize = getDistanceBetweenPoints(deltaX, deltaY);
	// Is it really a segment?
	if (segmentSize === 0) {
		return segmentStart;
	}

	const { deltaX: dxToStart, deltaY: dyToStart } = getDeltaBetweenPoints(point, segmentStart);
	// Projection (scalar factor) along the segment from start (0) to end (1) to land the point
	const projection = (dxToStart * deltaX + dyToStart * deltaY) / segmentSize;
	const clampedProjection = Math.max(0, Math.min(1, projection));

	// Calculate actual coordinates and return.
	const [startX = 0, startY = 0] = segmentStart;
	return [startX + clampedProjection * deltaX, startY + clampedProjection * deltaY];
};

const getClosestSegmentAndIndex = (
	coords: Coordinate[],
	point: Coordinate
): { segmentIndex: number; closest: Coordinate; squaredDist: number } => {
	let minSquaredDist = Infinity;
	let bestIndex = -1;
	let bestClosest: Coordinate = [];

	coords.forEach((startSegment, index) => {
		const endSegment = coords[index + 1];
		if (!startSegment || !endSegment) {
			return;
		}

		const closest = getClosestPointOnSegment(point, startSegment, endSegment);
		const { deltaX, deltaY } = getDeltaBetweenPoints(point, closest);
		const distance = getDistanceBetweenPoints(deltaX, deltaY);
		if (distance < minSquaredDist) {
			minSquaredDist = distance;
			bestIndex = index;
			bestClosest = closest;
		}
	});

	return { segmentIndex: bestIndex, closest: bestClosest, squaredDist: minSquaredDist };
};

export const isCoordsEqual = (coordA: Coordinate | undefined, coordB: Coordinate | undefined) => {
	return coordA && coordB && coordA[0] === coordB[0] && coordA[1] === coordB[1];
};

const isWithinHitTolerance = (squaredDist: number, resolution: number, hitTolerance: number) => {
	const tolerance = resolution * hitTolerance;
	return squaredDist <= tolerance ** 2;
};

export const isNearVertex = (
	feature: Feature | undefined,
	point: Coordinate,
	resolution: number,
	hitTolerance: number
): boolean => {
	const geometry = feature?.getGeometry();
	if (!geometry || (!(geometry instanceof LineString) && !(geometry instanceof Polygon))) {
		return false;
	}

	return getFlatCoordinates(geometry).some((vertex) => {
		const { deltaX, deltaY } = getDeltaBetweenPoints(point, vertex);
		const squaredDist = getDistanceBetweenPoints(deltaX, deltaY);
		return isWithinHitTolerance(squaredDist, resolution, hitTolerance);
	});
};

export const isOnFeatureEdge = (
	feature: Feature | undefined,
	point: Coordinate,
	resolution: number,
	hitTolerance: number
): boolean => {
	const geometry = feature?.getGeometry();
	if (geometry instanceof LineString) {
		return true;
	}

	if (geometry instanceof Polygon) {
		const ring = getFlatCoordinates(geometry);
		if (ring.length < 2) {
			return false;
		}

		const { squaredDist } = getClosestSegmentAndIndex(ring, point);
		return isWithinHitTolerance(squaredDist, resolution, hitTolerance);
	}

	return false;
};

export const addTraceVertex = (
	resolution: number,
	newVertex: Coordinate,
	feature: Feature | undefined,
	hitTolerance: number
) => {
	if (!feature) {
		return new Feature({
			geometry: new LineString([newVertex]),
		});
	}

	const geometry = (feature as Feature<LineString>).getGeometry();
	const coords = getFlatCoordinates(geometry);
	if (!coords.length) {
		return;
	}

	const { segmentIndex, closest, squaredDist } = getClosestSegmentAndIndex(coords, newVertex);
	if (segmentIndex >= 0 && isWithinHitTolerance(squaredDist, resolution, hitTolerance)) {
		coords.splice(segmentIndex + 1, 0, closest);
	} else {
		coords.push(newVertex);
	}

	geometry?.setCoordinates(coords, COORDINATE_LAYOUT_XYZM);
	return feature;
};

export const addShapeVertex = (
	resolution: number,
	newVertex: Coordinate,
	feature: Feature | undefined,
	hitTolerance: number
) => {
	if (!feature) {
		return new Feature({
			geometry: new Polygon([[newVertex]]),
		});
	}

	const geometry = (feature as Feature<Polygon>).getGeometry();
	const ring = getFlatCoordinates(geometry);
	if (!ring.length) {
		return;
	}

	if (ring.length < 3) {
		ring.push(newVertex);
	} else {
		const { segmentIndex, closest, squaredDist } = getClosestSegmentAndIndex(ring, newVertex);
		if (segmentIndex >= 0 && isWithinHitTolerance(squaredDist, resolution, hitTolerance)) {
			ring.splice(segmentIndex + 1, 0, closest);
		} else {
			ring.splice(ring.length - 1, 0, newVertex);
		}
	}

	// Autoclose if it hasn't been closed yet.
	const firstVertex = ring[0];
	const lastVertex = ring[ring.length - 1];
	if (ring.length >= 3 && firstVertex && !isCoordsEqual(firstVertex, lastVertex)) {
		ring.push([...firstVertex]);
	}

	geometry?.setCoordinates([ring], COORDINATE_LAYOUT_XYZM);
	return feature;
};

export const getVertexIndex = (
	feature: Feature<LineString | Polygon> | undefined,
	vertexToSelect: Feature<Point> | undefined
) => {
	const featureGeometry = feature?.getGeometry();
	const vertexGeometry = vertexToSelect?.getGeometry();
	if (!featureGeometry || !vertexGeometry) {
		return;
	}

	const vertexCoords = vertexGeometry.getCoordinates();
	const featureCoords = getFlatCoordinates(featureGeometry);
	const index = featureCoords.findIndex((coord) => isCoordsEqual(coord, vertexCoords));
	return index === -1 ? undefined : index;
};

export const getVertexByIndex = (
	feature: Feature | undefined,
	index: number | undefined
): Coordinate => {
	if (!feature || index === undefined) {
		return [];
	}
	const geometry = feature.getGeometry() as LineString | Polygon;
	const coordinates = getFlatCoordinates(geometry);
	return coordinates[index] ?? [];
};

const deleteVertexFromLine = (coords: Coordinate[], index: number) => {
	coords.splice(index, 1);
	return coords;
};

const deleteVertexFromPolygon = (coords: Coordinate[], index: number) => {
	// To simplify the many possible cases, we'll just remove the last closing point
	// and let it reevaluate if it needs to close the polygon.
	const isClosed = isCoordsEqual(coords[0], coords[coords.length - 1]);
	if (isClosed) {
		index = index === coords.length - 1 ? 0 : index;
		coords.pop();
	}

	coords.splice(index, 1);
	const newFirst = coords[0];
	if (coords.length > 2 && !isCoordsEqual(newFirst, coords[coords.length - 1])) {
		coords.push([...newFirst!]);
	}

	return [coords];
};

export const deleteVertexFromFeature = (
	feature: Feature<LineString | Polygon> | undefined,
	index: number
): number => {
	const geometry = feature?.getGeometry();
	const coords = getFlatCoordinates(geometry);

	if (geometry && index >= 0 && index < coords.length) {
		const updatedCoords =
			geometry instanceof LineString
				? deleteVertexFromLine(coords, index)
				: deleteVertexFromPolygon(coords, index);
		geometry.setCoordinates(updatedCoords as Coordinate[] & Coordinate[][], COORDINATE_LAYOUT_XYZM);
	}

	return coords.length;
};

export const updateVertexCoordinate = (
	feature: Feature<LineString | Polygon> | undefined,
	index: number,
	newCoordinates: Coordinate
) => {
	const geometry = feature?.getGeometry();
	const coords = getFlatCoordinates(geometry);

	if (geometry && index >= 0 && index < coords.length) {
		coords[index] = newCoordinates;
		const updatedCoords = geometry instanceof LineString ? coords : [coords];
		geometry.setCoordinates(updatedCoords as Coordinate[] & Coordinate[][], COORDINATE_LAYOUT_XYZM);
	}
};
