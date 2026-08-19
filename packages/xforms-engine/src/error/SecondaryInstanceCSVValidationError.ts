import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';
import { ErrorProductionDesignPendingError } from './ErrorProductionDesignPendingError';

export class CSVExternalSecondaryInstanceValidationError extends ErrorProductionDesignPendingError {
  constructor(
    resourceURL: JRResourceURL,
    rowIndex: number | null,
    columnIndex: number | null,
    message: string
  ) {
    const rowMessage = rowIndex !== null ? `, row ${rowIndex + 1}` : '';
    const columnMessage = columnIndex !== null ? `, column ${columnIndex + 1}` : '';
    super(`Failed to parse CSV ${resourceURL.href}${rowMessage}${columnMessage}: ${message}`);
  }
}
