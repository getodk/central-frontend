import { apiPaths, configForPossibleBackendRequest } from '../../src/util/request';

describe('util/request', () => {
  describe('apiPaths', () => {
    it('session', () => {
      apiPaths.session('xyz').should.equal('/v1/sessions/xyz');
    });

    it('users', () => {
      apiPaths.users().should.equal('/v1/users');
    });

    it('users?q', () => {
      apiPaths.users({ q: 'a b' }).should.equal('/v1/users?q=a%20b');
    });

    it('user', () => {
      apiPaths.user(1).should.equal('/v1/users/1');
    });

    it('password', () => {
      apiPaths.password(1).should.equal('/v1/users/1/password');
    });

    it('assignment', () => {
      apiPaths.assignment('admin', 1).should.equal('/v1/assignments/admin/1');
    });

    it('project', () => {
      apiPaths.project(1).should.equal('/v1/projects/1');
    });

    it('projectAssignments', () => {
      apiPaths.projectAssignments(1).should.equal('/v1/projects/1/assignments');
    });

    it('projectAssignment', () => {
      const path = apiPaths.projectAssignment(1, 'admin', 2);
      path.should.equal('/v1/projects/1/assignments/admin/2');
    });

    it('projectKey', () => {
      apiPaths.projectKey(1).should.equal('/v1/projects/1/key');
    });

    it('forms', () => {
      apiPaths.forms(1).should.equal('/v1/projects/1/forms');
    });

    it('forms?ignoreWarnings=true', () => {
      const path = apiPaths.forms(1, { ignoreWarnings: true });
      path.should.equal('/v1/projects/1/forms?ignoreWarnings=true');
    });

    it('forms?ignoreWarnings=false', () => {
      const path = apiPaths.forms(1, { ignoreWarnings: false });
      path.should.equal('/v1/projects/1/forms');
    });

    it('formSummaryAssignments', () => {
      const path = apiPaths.formSummaryAssignments(1, 'app-user');
      path.should.equal('/v1/projects/1/assignments/forms/app-user');
    });

    it('form', () => {
      apiPaths.form(1, 'a b').should.equal('/v1/projects/1/forms/a%20b');
    });

    it('schema', () => {
      const path = apiPaths.schema(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b.schema.json?flatten=true&odata=true');
    });

    it('oDataSvc', () => {
      const path = apiPaths.oDataSvc(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b.svc');
    });

    it('formActors', () => {
      const path = apiPaths.formActors(1, 'a b', 'app-user');
      path.should.equal('/v1/projects/1/forms/a%20b/assignments/app-user');
    });

    it('formKeys', () => {
      const path = apiPaths.formKeys(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/keys');
    });

    it('formVersionXml', () => {
      const path = apiPaths.formVersionXml(1, 'a b', 'c d');
      path.should.equal('/v1/projects/1/forms/a%20b/versions/c%20d.xml');
    });

    it('formVersionXml: empty version', () => {
      const path = apiPaths.formVersionXml(1, 'a b', '');
      path.should.equal('/v1/projects/1/forms/a%20b/versions/___.xml');
    });

    it('formDraft', () => {
      const path = apiPaths.formDraft(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/draft');
    });

    it('formDraft?ignoreWarnings=true', () => {
      const path = apiPaths.formDraft(1, 'a b', { ignoreWarnings: true });
      path.should.equal('/v1/projects/1/forms/a%20b/draft?ignoreWarnings=true');
    });

    it('formDraft?ignoreWarnings=false', () => {
      const path = apiPaths.formDraft(1, 'a b', { ignoreWarnings: false });
      path.should.equal('/v1/projects/1/forms/a%20b/draft');
    });

    it('formDraftXml', () => {
      const path = apiPaths.formDraftXml(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/draft.xml');
    });

    it('publishFormDraft', () => {
      const path = apiPaths.publishFormDraft(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/draft/publish');
    });

    it('publishFormDraft?version', () => {
      const path = apiPaths.publishFormDraft(1, 'a b', { version: 'c d' });
      path.should.equal('/v1/projects/1/forms/a%20b/draft/publish?version=c%20d');
    });

    it('formDraftAttachments', () => {
      const path = apiPaths.formDraftAttachments(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/draft/attachments');
    });

    it('formDraftAttachment', () => {
      const path = apiPaths.formDraftAttachment(1, 'a b', 'c d');
      path.should.equal('/v1/projects/1/forms/a%20b/draft/attachments/c%20d');
    });

    it('submissionsZip', () => {
      const path = apiPaths.submissionsZip(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions.csv.zip');
    });

    it('submissionsOData', () => {
      const path = apiPaths.submissionsOData(1, 'a b', { top: 250 });
      path.should.equal('/v1/projects/1/forms/a%20b.svc/Submissions?%24top=250&%24skip=0&%24count=true');
    });

    it('submissionsOData?skip', () => {
      const path = apiPaths.submissionsOData(1, 'a b', { top: 250, skip: 500 });
      path.should.equal('/v1/projects/1/forms/a%20b.svc/Submissions?%24top=250&%24skip=500&%24count=true');
    });

    it('submissionAttachment', () => {
      const path = apiPaths.submissionAttachment(1, 'a b', 'c d', 'e f');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/attachments/e%20f');
    });

    it('fieldKeys', () => {
      apiPaths.fieldKeys(1).should.equal('/v1/projects/1/app-users');
    });

    it('audits', () => {
      const path = apiPaths.audits({ action: 'backup' });
      path.should.equal('/v1/audits?action=backup');
    });

    it('audits?start', () => {
      const path = apiPaths.audits({
        action: 'backup',
        start: '2020-01-01T00:00:00.000Z'
      });
      path.should.equal('/v1/audits?action=backup&start=2020-01-01T00%3A00%3A00.000Z');
    });

    it('audits?end', () => {
      const path = apiPaths.audits({
        action: 'backup',
        end: '2020-01-01T00:00:00.000Z'
      });
      path.should.equal('/v1/audits?action=backup&end=2020-01-01T00%3A00%3A00.000Z');
    });

    it('audits?limit', () => {
      const path = apiPaths.audits({ action: 'backup', limit: 10 });
      path.should.equal('/v1/audits?action=backup&limit=10');
    });
  });

  describe('configForPossibleBackendRequest()', () => {
    it('prepends /v1 to a URL that starts with /', () => {
      const { url } = configForPossibleBackendRequest({ url: '/users' }, 'xyz');
      url.should.equal('/v1/users');
    });

    it('does not prepend /v1 to a URL that does not start with /', () => {
      const { url } = configForPossibleBackendRequest(
        { url: 'https://www.google.com/' },
        'xyz'
      );
      url.should.equal('https://www.google.com/');
    });

    it('does not prepend /v1 to a URL that starts with /v1', () => {
      const { url } = configForPossibleBackendRequest(
        { url: '/v1/users' },
        'xyz'
      );
      url.should.equal('/v1/users');
    });

    it('specifies an Authorization header if the URL starts with /', () => {
      const { headers } = configForPossibleBackendRequest(
        { url: '/users' },
        'xyz'
      );
      headers.Authorization.should.equal('Bearer xyz');
    });

    it('does not specify Authorization if URL does not start with /', () => {
      const { headers } = configForPossibleBackendRequest(
        { url: 'https://www.google.com/' },
        'xyz'
      );
      should.not.exist(headers);
    });

    it('does not overwrite an existing Authorization header', () => {
      const { headers } = configForPossibleBackendRequest(
        { url: '/users', headers: { Authorization: 'auth' } },
        'xyz'
      );
      headers.Authorization.should.equal('auth');
    });
  });
});
