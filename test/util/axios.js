const logUnhandledRequest = (config) => {
  // eslint-disable-next-line no-console
  console.error(config);
  // eslint-disable-next-line no-console
  console.error('A request was sent, but not handled. Are you using mockHttp() or load()?');
  return Promise.reject(new Error('unhandled request'));
};

export const mockAxios = () => {
  let respond = logUnhandledRequest;
  const http = async (config) => {
    const response = await respond(config);

    const { signal } = config;
    if (signal != null && signal.aborted) {
      const error = new Error('axios abort error');
      error.config = config;
      error.request = {};
      throw error;
    }

    return response;
  };
  http.respond = (f) => { respond = f != null ? f : logUnhandledRequest; };

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
  const error = new Error('axios response error');
  error.config = response.config;
  error.request = {};
  error.response = response;
  return error;
};
