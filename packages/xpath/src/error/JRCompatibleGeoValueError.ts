import { JRCompatibleError } from './JRCompatibleError.ts';

// prettier-ignore
type JRCompatibleFallibleGeoFunction =
	| 'distance'
	| 'geofence' // TODO!
	;

export class JRCompatibleGeoValueError extends JRCompatibleError {
	constructor(geoFunction: JRCompatibleFallibleGeoFunction) {
		super(`The function '${geoFunction}' received a value that does not represent GPS coordinates`);
	}
}
