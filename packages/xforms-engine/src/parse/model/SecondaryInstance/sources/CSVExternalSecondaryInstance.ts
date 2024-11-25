import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError.ts';
import { SecondaryInstanceDefinition } from '../SecondaryInstanceDefinition.ts';
import { ExternalSecondaryInstanceSource } from './ExternalSecondaryInstanceSource.ts';

export class CSVExternalSecondaryInstanceSource extends ExternalSecondaryInstanceSource<'csv'> {
	parseDefinition(): SecondaryInstanceDefinition {
		throw new ErrorProductionDesignPendingError('CSV external secondary instance support pending');
	}
}
