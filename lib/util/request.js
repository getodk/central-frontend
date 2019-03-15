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
