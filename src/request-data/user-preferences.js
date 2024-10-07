/* eslint-disable no-param-reassign */
import { shallowReactive, isReactive } from 'vue';
import { apiPaths, withAuth } from '../util/request';


export default class UserPreferences {
  constructor(preferenceData, session, http) {
    this.abortControllers = {};
    this.instanceID = crypto.randomUUID();
    this.site = this.makeSiteProxy(preferenceData.site);
    this.projects = this.makeProjectsProxy(preferenceData.projects);
    this.session = session;
    this.http = http;
  }

  propagate(k, v, projectId) {
    // As we need to be able to have multiple requests in-flight (not canceling eachother), we can't use resource.request() here.
    // However, we want to avoid stacking requests for the same key, so we abort preceding requests for the same key, if any.
    // Note that because locks are origin-scoped, we use a store instantiation identifier to scope them to this app instance.
    const keyLockName = `userPreferences-${this.instanceID}-keystack-${projectId}-${k}`;
    navigator.locks.request(
      `userPreferences-${this.instanceID}-lockops`,
      () => {
        navigator.locks.request(
          keyLockName,
          { ifAvailable: true },
          (lockForKey) => {
            const aborter = new AbortController();
            if (!lockForKey) {
              // Cancel the preceding request, a new one supersedes it.
              this.abortControllers[k].abort();
              return navigator.locks.request(
                keyLockName,
                () => {
                  this.abortControllers[k] = aborter;
                  return this.request(k, v, projectId, aborter);
                }
              );
            }
            this.abortControllers[k] = aborter;
            return this.request(k, v, projectId, aborter);
          },
        );
        return Promise.resolve(); // return asap with a resolved promise so the outer lockops lock gets released; we don't wan't to wait here for the inner keylock-enveloped requests.
      }
    );
  }

  request(k, v, projectId, aborter) {
    return this.http.request(
      withAuth(
        {
          method: (v === null) ? 'DELETE' : 'PUT',
          url: (projectId === null) ? `${apiPaths.userSitePreferences(k)}` : `${apiPaths.userProjectPreferences(projectId, k)}`,
          headers: {
            'Content-Type': 'application/json',
          },
          data: (v === null) ? undefined : { propertyValue: v },
          signal: aborter.signal,
        },
        this.session.token
      )
    );
  }

  makeSiteProxy(sitePreferenceData) {
    const userPreferences = this;
    return new Proxy(
      shallowReactive(sitePreferenceData),
      {
        deleteProperty(target, prop) {
          const retval = (delete target[prop]);
          userPreferences.propagate(prop, null, null); // DELETE to backend
          return retval;
        },
        set(target, prop, value) {
          // eslint-disable-next-line no-multi-assign
          const retval = (target[prop] = value);
          userPreferences.propagate(prop, value, null); // PUT to backend
          return retval;
        },
      }
    );
  }

  makeProjectsProxy(projectsPreferenceData) {
    const userPreferences = this;
    return new Proxy(
      projectsPreferenceData,
      {
        deleteProperty() {
          throw new Error('Deleting a project\'s whole property collection is not supported. Delete each property individually, eg "delete preferences.projects[3].foo".');
        },
        set() {
          throw new Error('Directly setting a project\'s whole property collection is not supported. Set each property individually, eg "preferences.projects[3].foo = \'bar\'"');
        },
        get(target, projectId) {
          if (Number.isNaN(parseInt(projectId, 10))) throw new TypeError(`Not an integer project ID: "${projectId}"`);
          const projectProps = target[projectId];
          if (projectProps === undefined || (!isReactive(projectProps))) { // not reentrant (TOCTOU issue) but there's no real way to solve it — as this is supposed to be a synchronous method we can't simply wrap it in a Lock
            target[projectId] = new Proxy(
              // make (potentially autovivicated) props reactive, and front them with a proxy to enable our setters/deleters
              shallowReactive(projectProps === undefined ? {} : projectProps),
              {
                deleteProperty(from, prop) {
                  const retval = (delete from[prop]);
                  userPreferences.propagate(prop, null, projectId); // DELETE to backend
                  return retval;
                },
                set(from, prop, propval) {
                  // eslint-disable-next-line no-multi-assign
                  const retval = (from[prop] = propval);
                  userPreferences.propagate(prop, propval, projectId); // PUT to backend
                  return retval;
                },
              }
            );
          }
          return target[projectId];
        },
      }
    );
  }
}
