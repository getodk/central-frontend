/*
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { pick } from 'ramda';

// Converts a string value or `null` to an OData literal value.
export const odataLiteral = (value) => (value != null
  ? `'${value.replaceAll("'", "''")}'`
  : 'null');

// Converts the OData for an entity to an entity in the format of a REST
// response.
export const odataEntityToRest = (odata, properties) => {
  const { creatorId, creatorName } = odata.__system;
  const creator = { id: creatorId, displayName: creatorName };

  const propertyData = Object.create(null);
  for (const { name, odataName } of properties) {
    const value = odata[odataName];
    if (value != null) propertyData[name] = value;
  }

  return {
    uuid: odata.__id,
    creatorId,
    creator,
    ...pick(
      ['conflict', 'updates', 'createdAt', 'updatedAt'],
      odata.__system
    ),
    currentVersion: {
      version: odata.__system.version,
      label: odata.label,
      data: propertyData
    }
  };
};
