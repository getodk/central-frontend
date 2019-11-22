/*
This file used to import ../store, but it resulted in an error, I think because
of the order in which files are imported. Frontend imports requestData() from
../store/modules/request.js before it imports ../store. However, because
../store/modules/request.js imports this file, and ../store imports
../store/modules/request.js, if this file imports ../store, then I think
../store will not be able to import ../store/modules/request.js, which it needs
to use immediately. The import order in that case would be:

  1. ../store/modules/request.js
  2. this file
  3. ../store
  4. ../store/modules/request.js -> error
*/

import Vue from 'vue';

export const configForPossibleBackendRequest = (config, token) => {
  if (!config.url.startsWith('/')) return config;
  const { url, headers } = config;
  return {
    ...config,
    url: `/v1${url}`,
    headers: token == null || (headers != null && headers.Authorization != null)
      ? headers
      : { ...headers, Authorization: `Bearer ${token}` }
  };
};

// Returns `true` if `data` looks like a Backend Problem and `false` if not.
export const isProblem = (data) => data != null && typeof data === 'object' &&
  data.code != null && data.message != null;

export const logAxiosError = (error) => {
  if (error.response)
    Vue.prototype.$logger.log(error.response.data);
  else if (error.request)
    Vue.prototype.$logger.log(error.request);
  else
    Vue.prototype.$logger.log('Error', error.message);
};

export const requestAlertMessage = (error, problemToAlert) => {
  if (error.request == null)
    return 'Something went wrong: there was no request.';
  if (error.response == null)
    return 'Something went wrong: there was no response to your request.';
  if (!isProblem(error.response.data))
    return 'Something went wrong: the server returned an invalid error.';
  const problem = error.response.data;
  if (problemToAlert == null) return problem.message;
  const message = problemToAlert(problem);
  return message != null ? message : problem.message;
};
