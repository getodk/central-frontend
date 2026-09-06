import { computed, inject, provide, reactive, readonly } from 'vue';

import usePropertyCreator from './property-creator';
import { apiPaths } from '../util/request';
import { useRequestData } from '../request-data';

const composableKey = Symbol('useActorPropertyCreator()');

/*
createActorPropertyCreator() returns an object to create one or more actor
properties. It lets the user specify one or more properties that they want to
create, then it creates them all at the same time in a series of requests. It
can handle the case where one property is created, but another fails. It tracks
which properties have been created and doesn't try to create the same property
twice.

The creator object is automatically provided to descendant components, which can
access it by calling useActorPropertyCreator().
*/
export const createActorPropertyCreator = (request) => {
  const { project, actorProperties } = useRequestData();

  const newProperties = reactive([]);
  // add() adds a property to a list for future creation. It doesn't actually
  // send a request to Backend to create the property: that's the responsibility
  // of create() below.
  const add = (name) => { newProperties.push(name); };
  const readonlyProperties = readonly(newProperties);

  // The names of both existing properties and new properties.
  const allProperties = computed(() => (!actorProperties.dataExists
    ? readonlyProperties
    : [...actorProperties.map(({ name }) => name), ...newProperties]));

  const basicCreator = usePropertyCreator(request);
  const create = () => {
    const url = apiPaths.actorProperties(project.id);
    return basicCreator.request(url, newProperties, ['projectId', 'name']);
  };

  const clear = () => {
    newProperties.splice(0);

    // Add the newly created properties to actorProperties.data. Sometimes we
    // want to do this a little after create() has been called, which is why
    // it happens here, not in create(). Adding properties to
    // actorProperties.data too soon could affect what's visible in the UI.
    if (basicCreator.created.size !== 0) {
      const newData = [...actorProperties.data];
      for (const name of basicCreator.created) newData.push({ name });
      actorProperties.data = newData;
      basicCreator.clear();
    }
  };

  const result = {
    newProperties: readonlyProperties,
    get allProperties() { return allProperties.value; },
    add,
    request: create,
    clear
  };
  provide(composableKey, result);
  return result;
};

const noRequest = () => Promise.reject(new Error('request() not provided'));

// Returns the creator object that an ancestor component created by calling
// createActorPropertyCreator().
export const useActorPropertyCreator = () =>
  // The default value here is meant to facilitate the testing of the components
  // ActorPropertiesUpsert and ActorPropertiesNew. In production, the parent
  // component of ActorPropertiesUpsert will generally call
  // createActorPropertyActorCreator(). However, in testing, there might not be
  // a parent component.
  inject(composableKey, () => createActorPropertyCreator(noRequest), true);
