/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import defineField from './field';
import defineForm from './form';
import defineProject from './project';
import defineUser from './user';

export default (container) => ({
  User: defineUser(container),
  Project: defineProject(container),
  Form: defineForm(container),
  Field: defineField(container)
});
