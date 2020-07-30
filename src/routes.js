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
import AccountClaim from './components/account/claim.vue';
import AccountLogin from './components/account/login.vue';
import AccountResetPassword from './components/account/reset-password.vue';
import AuditList from './components/audit/list.vue';
import BackupList from './components/backup/list.vue';
import FieldKeyList from './components/field-key/list.vue';
import FormAttachmentList from './components/form-attachment/list.vue';
import FormDraftStatus from './components/form-draft/status.vue';
import FormDraftTesting from './components/form-draft/testing.vue';
import FormOverview from './components/form/overview.vue';
import FormSettings from './components/form/settings.vue';
import FormShow from './components/form/show.vue';
import FormSubmissions from './components/form/submissions.vue';
import FormVersionList from './components/form-version/list.vue';
import NotFound from './components/not-found.vue';
import ProjectFormAccess from './components/project/form-access.vue';
import ProjectHome from './components/project/home.vue';
import ProjectList from './components/project/list.vue';
import ProjectOverview from './components/project/overview.vue';
import ProjectSettings from './components/project/settings.vue';
import ProjectShow from './components/project/show.vue';
import ProjectUserList from './components/project/user/list.vue';
import PublicLinkList from './components/public-link/list.vue';
import SystemHome from './components/system/home.vue';
import UserEdit from './components/user/edit.vue';
import UserHome from './components/user/home.vue';
import UserList from './components/user/list.vue';
import store from './store';

/*
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

  Response data
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

    Note: You must use a mixin in combination with this meta field.

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
    That data can't be checked in a navigation guard, so a watcher is added to
    the component for each condition: the watcher will check the associated data
    as soon as it exists. The watcher will also continue watching the data,
    checking that it continues to meet the condition.

    The component must use the validateData mixin: this is what actually defines
    the navigation guards and the watchers. The router only defines the
    validateData conditions; the mixin is what implements them. The mixin does
    so by using the validateData meta field of this.$route.
*/
const routes = [
  {
    path: '/login',
    component: AccountLogin,
    meta: { requireLogin: false, requireAnonymity: true }
  },
  {
    path: '/reset-password',
    component: AccountResetPassword,
    meta: { requireLogin: false, requireAnonymity: true }
  },
  {
    path: '/account/claim',
    component: AccountClaim,
    meta: { restoreSession: false, requireLogin: false, requireAnonymity: true }
  },

  { path: '/', component: ProjectList },
  {
    path: '/projects/:projectId([1-9]\\d*)',
    component: ProjectHome,
    props: true,
    children: [
      {
        path: '',
        component: ProjectShow,
        props: true,
        children: [
          {
            path: '',
            component: ProjectOverview,
            props: true,
            meta: {
              validateData: {
                project: (project) => project.permits('form.list')
              }
            }
          },
          {
            path: 'users',
            component: ProjectUserList,
            props: true,
            meta: {
              validateData: {
                project: (project) => project.permits([
                  'assignment.list',
                  'assignment.create',
                  'assignment.delete'
                ])
              }
            }
          },
          {
            path: 'app-users',
            component: FieldKeyList,
            props: true,
            meta: {
              validateData: {
                // We do not check whether the user can revoke the app user's
                // access, since the actee of that assignment is the app user,
                // not the project.
                project: (project) =>
                  project.permits(['field_key.list', 'field_key.create'])
              }
            }
          },
          {
            path: 'form-access',
            component: ProjectFormAccess,
            props: true,
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
          },
          {
            path: 'settings',
            component: ProjectSettings,
            meta: {
              validateData: {
                project: (project) => project.permits(['project.update'])
              }
            }
          }
        ]
      },
      // Note the unlikely possibility that
      // form.publishedAt == null && formDraft.isEmpty(). In that case, the user
      // will be unable to navigate to a form route.
      {
        path: 'forms/:xmlFormId',
        component: FormShow,
        props: true,
        children: [
          {
            path: '',
            component: FormOverview,
            props: true,
            meta: {
              validateData: {
                project: (project) =>
                  project.permits(['form.read', 'assignment.list']),
                form: (form) => form.publishedAt != null
              }
            }
          },
          {
            path: 'versions',
            component: FormVersionList,
            props: true,
            meta: {
              validateData: {
                project: (project) =>
                  // Including submission.list in order to exclude Data
                  // Collectors.
                  project.permits(['form.read', 'submission.list']),
                form: (form) => form.publishedAt != null
              }
            }
          },
          {
            path: 'submissions',
            component: FormSubmissions,
            props: true,
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
          },
          {
            path: 'public-links',
            component: PublicLinkList,
            props: true,
            meta: {
              validateData: {
                // We do not check whether the user can revoke the public link,
                // since the actee of that assignment is the public link, not
                // the project.
                project: (project) => project.permits([
                  'form.read',
                  'public_link.list',
                  'public_link.create'
                ]),
                form: (form) => form.publishedAt != null
              }
            }
          },
          {
            path: 'settings',
            component: FormSettings,
            meta: {
              validateData: {
                project: (project) =>
                  project.permits(['form.read', 'form.update', 'form.delete']),
                form: (form) => form.publishedAt != null
              }
            }
          },
          {
            path: 'draft',
            component: FormDraftStatus,
            props: true,
            meta: {
              validateData: {
                project: (project) =>
                  project.permits(['form.read', 'form.update', 'form.delete']),
                formDraft: (formDraft) => formDraft.isDefined()
              }
            }
          },
          {
            path: 'draft/attachments',
            component: FormAttachmentList,
            meta: {
              validateData: {
                project: (project) =>
                  project.permits(['form.read', 'form.update']),
                attachments: (option) => option
                  .map(attachments => attachments.length !== 0)
                  .orElse(false)
              }
            }
          },
          {
            path: 'draft/testing',
            component: FormDraftTesting,
            props: true,
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
          }
        ]
      }
    ]
  },

  {
    path: '/users',
    component: UserHome,
    children: [
      {
        path: '',
        component: UserList,
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
      }
    ]
  },
  {
    path: '/users/:id([1-9]\\d*)/edit',
    component: UserEdit,
    props: true,
    meta: {
      validateData: {
        currentUser: (currentUser) =>
          currentUser.can(['user.read', 'user.update'])
      }
    }
  },
  {
    path: '/account/edit',
    name: 'AccountEdit',
    component: UserEdit,
    props: () => ({ id: store.state.request.data.currentUser.id.toString() })
  },

  {
    path: '/system',
    component: SystemHome,
    children: [
      {
        path: 'backups',
        component: BackupList,
        meta: {
          validateData: {
            currentUser: (currentUser) => currentUser.can([
              'config.read',
              'backup.create',
              'backup.terminate',
              'audit.read'
            ])
          }
        }
      },
      {
        path: 'audits',
        component: AuditList,
        meta: {
          validateData: {
            currentUser: (currentUser) => currentUser.can('audit.read')
          }
        }
      }
    ]
  },

  {
    path: '*',
    component: NotFound,
    meta: { restoreSession: false, requireLogin: false }
  }
];
export default routes;



////////////////////////////////////////////////////////////////////////////////
// TRAVERSE ROUTES

const flattenedRoutes = [];
const bottomRoutes = [];
{
  const stack = [...routes];
  while (stack.length !== 0) {
    const route = stack.pop();
    flattenedRoutes.push(route);
    if (route.children != null) {
      for (const child of route.children)
        stack.push(child);
    } else {
      bottomRoutes.push(route);
    }
  }
}



////////////////////////////////////////////////////////////////////////////////
// ROUTE NAMES

// All bottom-level routes (and only bottom-level routes) should have a name. If
// a name is not specified for a bottom-level route above, it is given the same
// name as its component.
const routesByName = {};
for (const route of bottomRoutes) {
  if (route.name == null) {
    if (route.component.name == null)
      throw new Error('component without a name');
    route.name = route.component.name;
  }

  if (routesByName[route.name] != null) throw new Error('duplicate route name');
  routesByName[route.name] = route;
}



////////////////////////////////////////////////////////////////////////////////
// NORMALIZE META FIELDS

// All bottom-level routes (and only bottom-level routes) should have meta
// fields. Here we normalize the values of meta fields, including by setting
// defaults.
for (const route of flattenedRoutes) {
  if (route.children != null) {
    if (route.meta != null)
      throw new Error('only bottom-level routes can have meta fields');
  } else {
    route.meta = {
      restoreSession: true,
      requireLogin: true,
      requireAnonymity: false,
      preserveData: {},
      ...route.meta
    };
    const { meta } = route;
    meta.validateData = meta.validateData != null
      ? Object.entries(meta.validateData)
      : [];
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
for (const key of ['session', 'currentUser', 'roles']) {
  preserveDataForKey({
    key,
    to: bottomRoutes.map(route => route.name),
    params: []
  });
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
    'FormDraftTesting'
  ],
  params: ['projectId']
});
