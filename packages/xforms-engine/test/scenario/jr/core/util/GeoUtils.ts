const { PI } = Math;

export class GeoUtils {}

/**
 * JavaRosa exposes this as a static method on {@link GeoUtils}, but we expose
 * it as a named export as that is its typical usage in ported tests.
 */
export const EARTH_EQUATORIAL_RADIUS_METERS = 6_378_100;

export const EARTH_EQUATORIAL_CIRCUMFERENCE_METERS = 2 * EARTH_EQUATORIAL_RADIUS_METERS * PI;
