/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import AccountLogin from './components/account/login.vue';
import AsyncRoute from './components/async-route.vue';
import { routeProps } from './util/router';

/*
Lazy-Loading Routes
-------------------

We lazy-load all routes except for /login. We show a loading message while the
async component is loading and an alert if there is a load error. Note that
while Vue provides similar loading-state functionality for async components, Vue
Router does not support it directly: see
https://github.com/vuejs/vue-router/pull/2140. Instead, we use a wrapper
component, AsyncRoute, that will load and render the async component.

Because we use a wrapper component, navigation itself is not asynchronous. For
example, if a user clicks a link to /users but has not loaded UserList yet, they
will immediately navigate to /users, where they will see a loading message; they
will not stay on the previous page while UserList loads. However, a downside of
this approach is that an async component cannot use an in-component navigation
guard.

Route Names
-----------

All bottom-level routes should have a name. When lazy-loading routes, a
bottom-level route is automatically given the same name as its component by
default. Only bottom-level routes should have a name: otherwise, Vue Router will
log a warning (see https://github.com/vuejs/vue-router/issues/629).

In general, we try not to use route names to drive behavior. We use routes names
with the preserveData meta field below, but outside this file, we prefer route
paths to route names where possible.

Route Meta Fields
-----------------

The following meta fields are supported for bottom-level routes:

  Login
  -----

  - restoreSession (default: true). The router looks to restoreSession right
    after the user has navigated to Frontend, when the router is navigating to
    the first route. If restoreSession is `true` for the first route, the router
    will attempt to restore the user's session before navigating to the route.
    Note that even if restoreSession is `false`, the router will not delete any
    cookie that is set. That means that if the user navigates to a route for
    which `restoreSession` is `false`, then opens a new tab and navigates to a
    route for which `restoreSession` is `true`, the user's session may be
    restored in the second tab.
  - requireLogin (default: true). Indicates whether the user must be logged in
    in order to navigate to the route. If an anonymous user (a user who is
    logged out) navigates to the route, they will be redirected to login.
  - requireAnonymity (default: false)

    Indicates whether the user must be anonymous (logged out) in order to
    navigate to the route. If a user is logged in and navigates to the route,
    they will be redirected to the root page.

    In almost all cases, a route either requires login or requires anonymity.
    However, NotFound requires neither: a user can navigate to NotFound whether
    they are logged in or anonymous.

  Response Data
  -------------

  - preserveData (optional)

    By default, whenever the route changes, data is cleared for all request
    keys. preserveData specifies exceptions to that rule. Here is an example
    value:

    {
      // Do not clear data for the 'project' key if the user is navigating from
      // the route named 'ProjectList' and if the routes' params match on
      // 'projectId'.
      project: {
        ProjectList: ['projectId']
      },

      // Do not clear data for any key if the user is navigating from a route
      // named 'ProjectUserList' or FieldKeyList' and if the routes' params
      // match on ['projectId'].
      '*': {
        ProjectUserList: ['projectId']
        FieldKeyList: ['projectId']
      }
    }

    Do not set preserveData directly: use preserveDataForKey() instead.

  - validateData (optional)

    Some routes can be navigated to only if certain conditions are met. For
    example, the user may have to be able to perform certain verbs sitewide.

    validateData checks that conditions about the response data are met.
    (Perhaps more precisely, it checks that no condition is violated.) Here is
    an example value:

    {
      // Specifies a condition for currentUser: the user must be able to
      // user.list sitewide.
      currentUser: (currentUser) => currentUser.can('user.list'),
      // Specifies a condition for `project`: the user must be able to
      // assignment.list for the project.
      project: (project) => project.permits('assignment.list')
    }

    Before the user navigates to the route, any data that will be preserved
    after the route change is checked for whether it meets the specified
    conditions. If any condition is violated, the user is redirected to /.

    There may be data that will be cleared after the route change or that has
    never been requested, but will be requested after the component is created.
    That data can't be checked in a navigation guard, so a watcher is also added
    for each condition; the watcher will check the associated data as soon as it
    exists. The watcher will also continue watching the data, checking that it
    continues to meet the condition.
*/

/*
asyncRoute() returns a config for a route that is lazy-loaded. Specify a
standard route config to asyncRoute() with the following additions:

  - component. Instead of component options, specify the component name.
  - loading. Indicates how to render the loading message, which depends on how
    the component fits into the larger page structure. Specify 'page' if the
    component renders a page; specify 'tab' if it renders a tab pane.
  - key (optional)

    The `key` option determines whether a component is re-rendered after a route
    update, for example, after a param change.

    By default, we use the `key` attribute to re-render the component whenever
    the route path changes. In other words, we opt out of the default Vue
    Router behavior, which reuses the component instance. Re-rendering the
    component simplifies component code and makes it easier to reason about
    component state.

    However, when using nested routes, we may wish to reuse a parent component
    instance while re-rendering a child component. To reuse a component instance
    associated with a route, specify a function that returns a value for the
    `key` attribute. If the value does not change after the route update, the
    component instance will be reused. For example, to reuse a component
    instance associated with a parent route, you can specify a function that
    returns the part of the path that corresponds to the parent route. See the
    routes below for specific examples.
*/
const asyncRoute = (options) => {
  const { component, props, loading, key, ...config } = options;
  config.component = AsyncRoute;
  // Props for AsyncRoute
  config.props = (route) => ({
    componentName: component,
    // Props for the async component
    props: routeProps(route, props),
    loading,
    k: key != null ? key(route.params) : route.path
  });
  if (config.name == null && config.children == null) config.name = component;
  if (config.meta == null) config.meta = {};
  config.meta.asyncRoute = { componentName: component };
  return config;
};

const routes = [
  {
    path: '/login',
    name: 'AccountLogin',
    component: AccountLogin,
    meta: { requireLogin: false, requireAnonymity: true }
  },
  asyncRoute({
    path: '/reset-password',
    component: 'AccountResetPassword',
    loading: 'page',
    meta: { requireLogin: false, requireAnonymity: true }
  }),
  asyncRoute({
    path: '/account/claim',
    component: 'AccountClaim',
    loading: 'page',
    meta: { restoreSession: false, requireLogin: false, requireAnonymity: true }
  }),

  asyncRoute({ path: '/', component: 'ProjectList', loading: 'page' }),
  asyncRoute({
    path: '/projects/:projectId([1-9]\\d*)',
    component: 'ProjectShow',
    props: true,
    loading: 'page',
    key: ({ projectId }) => `/projects/${projectId}`,
    children: [
      asyncRoute({
        path: '',
        component: 'ProjectOverview',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits('form.list')
          }
        }
      }),
      asyncRoute({
        path: 'users',
        component: 'ProjectUserList',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits([
              'assignment.list',
              'assignment.create',
              'assignment.delete'
            ])
          }
        }
      }),
      asyncRoute({
        path: 'app-users',
        component: 'FieldKeyList',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits([
              'field_key.list',
              'field_key.create',
              'session.end'
            ])
          }
        }
      }),
      asyncRoute({
        path: 'form-access',
        component: 'ProjectFormAccess',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits([
              'form.list',
              'field_key.list',
              'assignment.list',
              'project.update',
              'form.update',
              'assignment.create',
              'assignment.delete'
            ])
          }
        }
      }),
      asyncRoute({
        path: 'settings',
        component: 'ProjectSettings',
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits(['project.update'])
          }
        }
      })
    ]
  }),
  // Note the unlikely possibility that
  // form.publishedAt == null && formDraft.isEmpty(). In that case, the user
  // will be unable to navigate to a form route.
  asyncRoute({
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId',
    component: 'FormShow',
    props: true,
    loading: 'page',
    key: ({ projectId, xmlFormId }) =>
      `/projects/${projectId}/forms/${encodeURIComponent(xmlFormId)}`,
    children: [
      asyncRoute({
        path: '',
        component: 'FormOverview',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) =>
              // Including form.update in order to exclude project viewers and
              // Data Collectors.
              project.permits(['form.read', 'form.update']),
            form: (form) => form.publishedAt != null
          }
        }
      }),
      asyncRoute({
        path: 'versions',
        component: 'FormVersionList',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) =>
              // Including submission.list in order to exclude Data Collectors.
              project.permits(['form.read', 'submission.list']),
            form: (form) => form.publishedAt != null
          }
        }
      }),
      asyncRoute({
        path: 'submissions',
        component: 'FormSubmissions',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits([
              'form.read',
              'submission.list',
              'submission.read'
            ]),
            form: (form) => form.publishedAt != null
          }
        }
      }),
      asyncRoute({
        path: 'public-links',
        component: 'PublicLinkList',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits([
              'form.read',
              'public_link.list',
              'public_link.create',
              'session.end'
            ]),
            form: (form) => form.publishedAt != null
          }
        }
      }),
      asyncRoute({
        path: 'settings',
        component: 'FormSettings',
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) =>
              project.permits(['form.read', 'form.update', 'form.delete']),
            form: (form) => form.publishedAt != null
          }
        }
      }),
      asyncRoute({
        path: 'draft',
        component: 'FormDraftStatus',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) =>
              project.permits(['form.read', 'form.update', 'form.delete']),
            formDraft: (formDraft) => formDraft.isDefined()
          }
        }
      }),
      asyncRoute({
        path: 'draft/attachments',
        component: 'FormAttachmentList',
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits(['form.read', 'form.update']),
            attachments: (option) => option
              .map(attachments => attachments.length !== 0)
              .orElse(false)
          }
        }
      }),
      asyncRoute({
        path: 'draft/testing',
        component: 'FormDraftTesting',
        props: true,
        loading: 'tab',
        meta: {
          validateData: {
            project: (project) => project.permits([
              'form.read',
              'submission.list',
              'submission.read'
            ]),
            formDraft: (formDraft) => formDraft.isDefined()
          }
        }
      })
    ]
  }),
  asyncRoute({
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/:instanceId',
    component: 'SubmissionShow',
    props: true,
    loading: 'page',
    meta: {
      validateData: {
        project: (project) => project.permits('submission.read')
      }
    }
  }),

  asyncRoute({
    path: '/users',
    component: 'UserHome',
    loading: 'page',
    key: () => '/users',
    children: [
      asyncRoute({
        path: '',
        component: 'UserList',
        loading: 'tab',
        meta: {
          validateData: {
            currentUser: (currentUser) => currentUser.can([
              'user.list',
              'assignment.list',
              'user.create',
              'assignment.create',
              'assignment.delete',
              'user.password.invalidate',
              'user.delete'
            ])
          }
        }
      })
    ]
  }),
  asyncRoute({
    path: '/users/:id([1-9]\\d*)/edit',
    component: 'UserEdit',
    props: true,
    loading: 'page',
    meta: {
      validateData: {
        currentUser: (currentUser) =>
          currentUser.can(['user.read', 'user.update'])
      }
    }
  }),
  asyncRoute({
    path: '/account/edit',
    component: 'AccountEdit',
    loading: 'page'
  }),

  asyncRoute({
    path: '/system',
    component: 'SystemHome',
    loading: 'page',
    key: () => '/system',
    children: [
      asyncRoute({
        path: 'backups',
        component: 'BackupList',
        loading: 'tab',
        meta: {
          validateData: {
            currentUser: (currentUser) => currentUser.can([
              'config.read',
              'backup.create',
              'backup.run',
              'backup.terminate',
              'audit.read'
            ])
          }
        }
      }),
      asyncRoute({
        path: 'audits',
        component: 'AuditList',
        loading: 'tab',
        meta: {
          validateData: {
            currentUser: (currentUser) => currentUser.can('audit.read')
          }
        }
      })
    ]
  }),

  asyncRoute({
    path: '/dl/*',
    component: 'Download',
    loading: 'page',
    key: () => '/dl'
  }),

  asyncRoute({
    path: '*',
    component: 'NotFound',
    loading: 'page',
    meta: { restoreSession: false, requireLogin: false }
  })
];
export default routes;



////////////////////////////////////////////////////////////////////////////////
// TRAVERSE ROUTES

const routesByName = {};
{
  // Normalizes the values of meta fields, including by setting defaults.
  const normalizeMeta = (meta) => ({
    restoreSession: true,
    requireLogin: true,
    requireAnonymity: false,
    preserveData: {},
    ...meta,
    validateData: meta != null && meta.validateData != null
      ? Object.entries(meta.validateData)
      : []
  });

  const stack = [...routes];
  while (stack.length !== 0) {
    const route = stack.pop();
    if (route.children != null) {
      if (route.meta == null) route.meta = {};

      for (const child of route.children)
        stack.push(child);
    } else {
      route.meta = normalizeMeta(route.meta);
      routesByName[route.name] = route;
    }
  }
}



////////////////////////////////////////////////////////////////////////////////
// PRESERVE DATA

/*
preserveDataForKey() sets the preserveData meta field so that when the route
changes from `from` to `to`, and the routes' params match on `params`, the data
for `key` is not cleared.

  - key. A request key or '*'.
  - to. An array of route names.
  - from (default: `to`). An array of route names.
  - params. An array of param names.
*/
const preserveDataForKey = ({ key, to, params, from = to }) => {
  for (const toName of to) {
    const { preserveData } = routesByName[toName].meta;
    if (preserveData[key] == null) preserveData[key] = {};
    const paramsByFrom = preserveData[key];
    for (const fromName of from)
      paramsByFrom[fromName] = params;
  }
};

// Data that does not change with navigation
{
  const names = Object.keys(routesByName);
  for (const key of ['session', 'currentUser', 'roles'])
    preserveDataForKey({ key, to: names, params: [] });
}

// Tabs
preserveDataForKey({
  key: '*',
  to: [
    'ProjectOverview',
    'ProjectUserList',
    'FieldKeyList',
    'ProjectFormAccess',
    'ProjectSettings'
  ],
  params: ['projectId']
});
preserveDataForKey({
  key: '*',
  to: [
    'FormOverview',
    'FormVersionList',
    'FormSubmissions',
    'PublicLinkList',
    'FormSettings',
    'FormDraftStatus',
    'FormAttachmentList',
    'FormDraftTesting'
  ],
  params: ['projectId', 'xmlFormId']
});

preserveDataForKey({
  key: 'project',
  to: [
    // ProjectShow
    'ProjectOverview',
    'ProjectUserList',
    'FieldKeyList',
    'ProjectFormAccess',
    'ProjectSettings',
    // FormShow
    'FormOverview',
    'FormVersionList',
    'FormSubmissions',
    'PublicLinkList',
    'FormSettings',
    'FormDraftStatus',
    'FormAttachmentList',
    'FormDraftTesting',
    // SubmissionShow
    'SubmissionShow'
  ],
  params: ['projectId']
});
