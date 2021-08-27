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

export const mockAxiosResponse = (data, config = undefined) => {
  const response = { config };
  if (data.problem == null) {
    response.status = 200;
    response.data = data;
  } else {
    const problem = typeof data.problem === 'object'
      ? data.problem
      : { code: data.problem, message: 'There was a problem.' };
    response.status = Math.floor(problem.code);
    response.data = problem;
  }
  return response;
};

export const mockAxiosError = (response) => {
  const error = new Error();
  error.config = response.config;
  error.request = {};
  error.response = response;
  return error;
};
