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
import moment from 'moment';

import mockHttp from './http';
import { fillForm, mockRoute, trigger } from './util';
import { logIn, resetSession } from '../lib/session';

export { resetSession };

export const mockSession = () => {
  const token = 'a'.repeat(64);
  const tomorrow = moment(new Date()).add(1, 'days').utc().format();
  return { token, expiresAt: tomorrow };
};

export const mockUser = () => ({ id: 1, email: 'user@test.com' });

export const mockLogin = () => logIn(mockSession(), mockUser());

export const submitLoginForm = (wrapper) => {
  const promise = fillForm(wrapper, [
    ['#session-login-email', mockUser().email],
    ['#session-login-password', 'password']
  ]);
  return promise
    .then(() => trigger('submit', wrapper.first('#session-login-form')))
    .then(() => wrapper);
};

export const mockRouteThroughLogin = (location, mountOptions = {}) =>
  mockRoute(location, mountOptions)
    .then(app => mockHttp()
      .request(() => submitLoginForm(app))
      .respondWithData(mockSession())
      .respondWithData(mockUser())
      .complete()
      .then(() => app));
