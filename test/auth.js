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

import Session from '../lib/session';
import User from '../lib/user';
import { logIn, logOut } from '../lib/auth';

const mockSession = () => {
  const token = 'a'.repeat(64);
  const tomorrow = moment(new Date()).add(1, 'days');
  return new Session({ token, expiresAt: tomorrow });
};

const mockUser = () => new User({ email: 'test@opendatakit.org' });

const mockLogIn = () => logIn(mockSession(), mockUser());

export { mockSession, mockUser, mockLogIn as logIn, logOut };
