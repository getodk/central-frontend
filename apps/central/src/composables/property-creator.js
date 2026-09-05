import { equals } from 'ramda';
import { reactive, readonly } from 'vue';

/*
usePropertyCreator() creates one or more properties (either entity properties or
actor properties) in a series of requests. It can handle the case where one
property is created, but another fails. It tracks which properties have been
created successfully and doesn't try to create the same property twice.

If you're trying to create actor properties, use the more specialized
useActorPropertyCreator() instead of this composable. useActorPropertyCreator()
uses this composable under the hood. This composable holds the common behavior
shared between entity properties and actor properties.
*/
export default (request) => {
  // An array of the names of properties that have been created via create()
  // below (since the last clear())
  const created = reactive(new Set());

  // dbFields are the fields that are expected to be returned with a 409.3
  // Problem.
  const create = async (url, names, dbFields) => {
    if (names == null) return;
    for (const name of names) {
      if (created.has(name)) continue; // eslint-disable-line no-continue
      await request({ // eslint-disable-line no-await-in-loop
        method: 'POST',
        url,
        data: { name },
        // If the property has already been created somehow, that's not an
        // issue. We can just ignore the Problem response.
        fulfillProblem: ({ code, details }) =>
          code === 409.3 && equals(details.fields, dbFields)
      });
      created.add(name);
    }
  };

  return {
    request: create,
    created: readonly(created),
    clear: () => { created.clear(); }
  };
};
