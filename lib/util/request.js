import Vue from 'vue';

// eslint-disable-next-line import/prefer-default-export
export const logRequestError = (error) => {
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
  const problem = error.response.data;
  if (problem == null || problem.code == null || problem.message == null)
    return 'Something went wrong: the server returned an invalid error.';
  if (problemToAlert == null) return problem.message;
  const message = problemToAlert(problem);
  return message != null ? message : problem.message;
};
