import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError.ts';
import { SecondaryInstanceDefinition } from '../SecondaryInstanceDefinition.ts';
import { ExternalSecondaryInstanceSource } from './ExternalSecondaryInstanceSource.ts';

export class GeoJSONExternalSecondaryInstanceSource extends ExternalSecondaryInstanceSource<'geojson'> {
	parseDefinition(): SecondaryInstanceDefinition {
		throw new ErrorProductionDesignPendingError(
			'GeoJSON external secondary instance support pending'
		);
	}
}
