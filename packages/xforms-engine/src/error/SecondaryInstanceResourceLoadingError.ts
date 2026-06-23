import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';
import { ErrorProductionDesignPendingError } from './ErrorProductionDesignPendingError';
import type { FetchResourceResponse } from '../client';

export class SecondaryInstanceResourceLoadingError extends ErrorProductionDesignPendingError {
  constructor(resourceURL: JRResourceURL, response: FetchResourceResponse) {
    const filename = resourceURL.pathname.slice(1);
    const message =
      response.status === 404
        ? 'is missing.'
        : `failed to load with error code: ${response.status}`;
    super(`Required attachment "${filename}" ${message}`);
  }
}
