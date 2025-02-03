import { JRCompatibleError } from './JRCompatibleError.ts';

export class JRCompatibleGeoValueError extends JRCompatibleError {
	constructor() {
		super("The function 'distance' received a value that does not represent GPS coordinates");
	}
}
