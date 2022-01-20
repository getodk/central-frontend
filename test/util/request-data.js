import createRequestData from '../../src/request-data';

import { mockLogin } from './session';
import { mockResponse } from './axios';

function set(data) { this.setFromResponse({ status: 200, data }); }

// eslint-disable-next-line import/prefer-default-export
export const testRequestData = (seedData) => (container) => {
  const requestData = createRequestData(container);

  for (const resource of requestData.resources)
    resource.set = set;

  mockLogin.setRequestData(requestData);
  if (seedData != null) {
    for (const [key, value] of seedData)
      requestData[key].setFromResponse(mockResponse.of(value));
  }

  return requestData;
};
