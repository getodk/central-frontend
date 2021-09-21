export const mockAxios = (respond) => {
  const http = (config) => respond(config);
  http.request = http;
  http.get = (url, config) => http({ ...config, method: 'GET', url });
  http.post = (url, data, config) => {
    const full = { ...config, method: 'POST', url };
    if (data != null) full.data = data;
    return http(full);
  };
  http.put = (url, data, config) => http({ ...config, method: 'PUT', url, data });
  http.patch = (url, data, config) => http({ ...config, method: 'PATCH', url, data });
  http.delete = (url, config) => http({ ...config, method: 'DELETE', url });
  http.defaults = {
    headers: {
      common: {}
    }
  };
  return http;
};

export const mockResponse = {
  // Given a Problem object or a Problem code, returns a Problem response. (Note
  // that the response will not have a `config` property.)
  problem: (problemOrCode = 500.1) => {
    const data = typeof problemOrCode === 'object'
      ? problemOrCode
      : { code: problemOrCode, message: 'There was a problem.' };
    return { status: Math.floor(data.code), data };
  },
  // Converts an object that may be a response to a response. If the object
  // looks like a response, it is returned as-is. Otherwise a 200 response is
  // returned, with the object as the response data. (In that case, the response
  // will not have a `config` property.)
  of: (responseOrData) => {
    if (typeof responseOrData === 'object' &&
      typeof responseOrData.status === 'number' && responseOrData.data != null)
      return responseOrData;
    return { status: 200, data: responseOrData };
  }
};

export const mockAxiosError = (response) => {
  const error = new Error();
  error.config = response.config;
  error.request = {};
  error.response = response;
  return error;
};
