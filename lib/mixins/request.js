/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import axios from 'axios';

function request(config) {
  this.awaitingResponse = true;
  return axios(config)
    .then(response => {
      this.awaitingResponse = false;
      return response;
    })
    .catch(error => {
      this.awaitingResponse = false;
      const message = error.response != null && error.response.data.message != null
        ? error.response.data.message
        : 'Something went wrong.';
      this.alert('danger', message);
      throw error;
    });
}

function get(url, config) {
  const fullConfig = Object.assign({}, config, { method: 'get', url });
  return this.request(fullConfig);
}

function post(url, data, config) {
  const fullConfig = Object.assign({}, config, { method: 'post', url, data });
  return this.request(fullConfig);
}

export default {
  methods: { request, get, post }
};
