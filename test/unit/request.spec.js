import createCentralI18n from '../../src/i18n';
import { apiPaths, isProblem, logAxiosError, queryString, requestAlertMessage, withAuth } from '../../src/util/request';

import { mockAxiosError } from '../util/axios';
import { mockLogger } from '../util/util';

describe('util/request', () => {
  describe('queryString()', () => {
    it('returns a query string', () => {
      queryString({ x: '1/2', y: '1 2' }).should.eql('?x=1%2F2&y=1+2');
    });

    it('skips a property whose value is null', () => {
      queryString({ x: 1, y: null }).should.eql('?x=1');
    });

    it('returns an empty string for an empty object', () => {
      queryString({}).should.equal('');
    });

    it('returns an empty string for null', () => {
      queryString(null).should.equal('');
    });
  });

  describe('apiPaths', () => {
    it('session', () => {
      apiPaths.session('xyz').should.equal('/v1/sessions/xyz');
    });

    it('users', () => {
      apiPaths.users().should.equal('/v1/users');
    });

    it('users?q', () => {
      apiPaths.users({ q: 'a b' }).should.equal('/v1/users?q=a+b');
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

    it('forms?ignoreWarnings', () => {
      const path = apiPaths.forms(1, { ignoreWarnings: true });
      path.should.equal('/v1/projects/1/forms?ignoreWarnings=true');
    });

    it('formSummaryAssignments', () => {
      const path = apiPaths.formSummaryAssignments(1, 'app-user');
      path.should.equal('/v1/projects/1/assignments/forms/app-user');
    });

    it('form', () => {
      apiPaths.form(1, 'a b').should.equal('/v1/projects/1/forms/a%20b');
    });

    describe('odataSvc', () => {
      it('returns the correct path', () => {
        const path = apiPaths.odataSvc(1, 'a b');
        path.should.equal('/v1/projects/1/forms/a%20b.svc');
      });

      it('returns the correct path for a form draft', () => {
        const path = apiPaths.odataSvc(1, 'a b', true);
        path.should.equal('/v1/projects/1/forms/a%20b/draft.svc');
      });
    });

    it('formActors', () => {
      const path = apiPaths.formActors(1, 'a b', 'app-user');
      path.should.equal('/v1/projects/1/forms/a%20b/assignments/app-user');
    });

    describe('fields', () => {
      it('returns the correct path for a form', () => {
        const path = apiPaths.fields(1, 'a b');
        path.should.equal('/v1/projects/1/forms/a%20b/fields');
      });

      it('returns the correct path for a form draft', () => {
        const path = apiPaths.fields(1, 'a b', true);
        path.should.equal('/v1/projects/1/forms/a%20b/draft/fields');
      });
    });

    it('formVersions', () => {
      const path = apiPaths.formVersions(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/versions');
    });

    it('formVersionDef', () => {
      const path = apiPaths.formVersionDef(1, 'a b', 'c d', '.xml');
      path.should.equal('/v1/projects/1/forms/a%20b/versions/c%20d.xml');
    });

    it('formVersionDef: empty version', () => {
      const path = apiPaths.formVersionDef(1, 'a b', '', '.xml');
      path.should.equal('/v1/projects/1/forms/a%20b/versions/___.xml');
    });

    it('formDraft', () => {
      const path = apiPaths.formDraft(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/draft');
    });

    it('formDraft?ignoreWarnings', () => {
      const path = apiPaths.formDraft(1, 'a b', { ignoreWarnings: true });
      path.should.equal('/v1/projects/1/forms/a%20b/draft?ignoreWarnings=true');
    });

    it('formDraftDef', () => {
      const path = apiPaths.formDraftDef(1, 'a b', '.xml');
      path.should.equal('/v1/projects/1/forms/a%20b/draft.xml');
    });

    it('serverUrlForFormDraft', () => {
      const path = apiPaths.serverUrlForFormDraft('xyz', 1, 'a b');
      path.should.equal('/v1/test/xyz/projects/1/forms/a%20b/draft');
    });

    it('publishFormDraft', () => {
      const path = apiPaths.publishFormDraft(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/draft/publish');
    });

    it('publishFormDraft?version', () => {
      const path = apiPaths.publishFormDraft(1, 'a b', { version: 'c d' });
      path.should.equal('/v1/projects/1/forms/a%20b/draft/publish?version=c+d');
    });

    it('formDraftAttachments', () => {
      const path = apiPaths.formDraftAttachments(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/draft/attachments');
    });

    it('formDraftAttachment', () => {
      const path = apiPaths.formDraftAttachment(1, 'a b', 'c d');
      path.should.equal('/v1/projects/1/forms/a%20b/draft/attachments/c%20d');
    });

    describe('submissions', () => {
      it('returns the correct path for a form', () => {
        const path = apiPaths.submissions(1, 'a b', false, '.csv.zip');
        path.should.equal('/v1/projects/1/forms/a%20b/submissions.csv.zip');
      });

      it('returns the correct path for a form draft', () => {
        const path = apiPaths.submissions(1, 'a b', true, '.csv.zip');
        path.should.equal('/v1/projects/1/forms/a%20b/draft/submissions.csv.zip');
      });

      it('returns a query string', () => {
        const path = apiPaths.submissions(1, 'a b', false, '.csv.zip', {
          attachments: false
        });
        path.should.equal('/v1/projects/1/forms/a%20b/submissions.csv.zip?attachments=false');
      });
    });

    describe('odataSubmissions', () => {
      it('returns the correct path for a form', () => {
        const path = apiPaths.odataSubmissions(1, 'a b');
        path.should.equal('/v1/projects/1/forms/a%20b.svc/Submissions');
      });

      it('returns the correct path for a form draft', () => {
        const path = apiPaths.odataSubmissions(1, 'a b', true);
        path.should.equal('/v1/projects/1/forms/a%20b/draft.svc/Submissions');
      });

      it('returns a query string', () => {
        const path = apiPaths.odataSubmissions(1, 'a b', false, { $count: true });
        path.should.equal('/v1/projects/1/forms/a%20b.svc/Submissions?%24count=true');
      });
    });

    describe('submissionKeys', () => {
      it('returns the correct path for a form', () => {
        const path = apiPaths.submissionKeys(1, 'a b');
        path.should.equal('/v1/projects/1/forms/a%20b/submissions/keys');
      });

      it('returns the correct path for a form draft', () => {
        const path = apiPaths.submissionKeys(1, 'a b', true);
        path.should.equal('/v1/projects/1/forms/a%20b/draft/submissions/keys');
      });
    });

    describe('submitters', () => {
      it('returns the correct path for a form', () => {
        const path = apiPaths.submitters(1, 'a b');
        path.should.equal('/v1/projects/1/forms/a%20b/submissions/submitters');
      });

      it('returns the correct path for a form draft', () => {
        const path = apiPaths.submitters(1, 'a b', true);
        path.should.equal('/v1/projects/1/forms/a%20b/draft/submissions/submitters');
      });
    });

    it('submission', () => {
      const path = apiPaths.submission(1, 'a b', 'c d');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d');
    });

    it('odataSubmission', () => {
      const path = apiPaths.odataSubmission(1, 'a b', "'c d'");
      path.should.equal("/v1/projects/1/forms/a%20b.svc/Submissions('''c%20d''')");
    });

    it('editSubmission', () => {
      const path = apiPaths.editSubmission(1, 'a b', 'c d');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/edit');
    });

    describe('submissionAttachment', () => {
      it('returns the correct path for a form', () => {
        const path = apiPaths.submissionAttachment(1, 'a b', false, 'c d', 'e f');
        path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/attachments/e%20f');
      });

      it('returns the correct path for a form draft', () => {
        const path = apiPaths.submissionAttachment(1, 'a b', true, 'c d', 'e f');
        path.should.equal('/v1/projects/1/forms/a%20b/draft/submissions/c%20d/attachments/e%20f');
      });
    });

    it('submissionVersionAttachment', () => {
      const path = apiPaths.submissionVersionAttachment(1, 'a b', 'c d', 'e f', 'g h');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/versions/e%20f/attachments/g%20h');
    });

    it('submissionAudits', () => {
      const path = apiPaths.submissionAudits(1, 'a b', 'c d');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/audits');
    });

    it('submissionComments', () => {
      const path = apiPaths.submissionComments(1, 'a b', 'c d');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/comments');
    });

    it('submissionVersion', () => {
      const path = apiPaths.submissionVersion(1, 'a b', 'c d', 'e f');
      path.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/versions/e%20f');
    });

    it('publicLinks', () => {
      const path = apiPaths.publicLinks(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/public-links');
    });

    it('datasets', () => {
      apiPaths.datasets(1).should.equal('/v1/projects/1/datasets');
    });

    it('entities', () => {
      const path = apiPaths.entities(1, 'á');
      path.should.equal('/v1/projects/1/datasets/%C3%A1/entities.csv');
    });

    it('fieldKeys', () => {
      apiPaths.fieldKeys(1).should.equal('/v1/projects/1/app-users');
    });

    it('serverUrlForFieldKey', () => {
      const path = apiPaths.serverUrlForFieldKey('xyz', 1);
      path.should.equal('/v1/key/xyz/projects/1');
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

  describe('withAuth()', () => {
    it('specifies the session token in the Authorization header', () => {
      withAuth({ url: '/v1/users' }, 'xyz').should.eql({
        url: '/v1/users',
        headers: { Authorization: 'Bearer xyz' }
      });
    });

    it('does not add an Authorization header if URL does not start with /v1', () => {
      const config = { url: '/version.txt' };
      withAuth(config, 'xyz').should.equal(config);
    });

    it('does not add an Authorization header if there is not a token', () => {
      const config = { url: '/v1/users' };
      withAuth(config, null).should.equal(config);
    });

    it('does not overwrite an existing Authorization header', () => {
      const config = {
        url: '/v1/users',
        headers: { Authorization: 'auth' }
      };
      withAuth(config, 'xyz').should.equal(config);
    });

    it('preserves other headers and options', () => {
      const config = {
        method: 'GET',
        url: '/v1/users',
        headers: { 'X-Extended-Metadata': 'true' }
      };
      withAuth(config, 'xyz').should.eql({
        method: 'GET',
        url: '/v1/users',
        headers: { 'X-Extended-Metadata': 'true', Authorization: 'Bearer xyz' }
      });
    });
  });

  describe('isProblem()', () => {
    it('returns true for a Problem', () => {
      isProblem({ code: 404.1, message: 'Not found.' }).should.be.true();
    });

    it('returns false for null', () => {
      isProblem(null).should.be.false();
    });

    it('returns false for a string', () => {
      isProblem('foo').should.be.false();
    });

    it('returns false for an object without a code property', () => {
      isProblem({ message: 'Not found.' }).should.be.false();
    });

    it('returns false for an object whose code property is not a number', () => {
      isProblem({ code: '404.1', message: 'Not found.' }).should.be.false();
    });

    it('returns false for an object without a message property', () => {
      isProblem({ code: 404.1 }).should.be.false();
    });

    it('returns false for an object whose message property is not a string', () => {
      isProblem({ code: 404.1, message: 123 }).should.be.false();
    });
  });

  describe('logAxiosError()', () => {
    it('does not log if there was a response', () => {
      const logger = mockLogger();
      const error = new Error();
      error.response = {};
      logAxiosError(logger, error);
      logger.log.called.should.be.false();
    });

    it('logs the request if there was one', () => {
      const logger = mockLogger();
      const error = new Error();
      error.request = {};
      logAxiosError(logger, error);
      logger.log.calledWith(error.request).should.be.true();
    });

    it('logs the error message if there was no request', () => {
      const logger = mockLogger();
      const error = new Error('foo');
      logAxiosError(logger, error);
      logger.log.calledWith('foo').should.be.true();
    });
  });

  describe('requestAlertMessage()', () => {
    const i18n = createCentralI18n().global;

    const errorWithProblem = (code = 500.1) => mockAxiosError({
      status: Math.floor(code),
      data: { code, message: 'Message from API' },
      config: { url: '/v1/projects/1/forms/f' }
    });

    it('returns a message if there was no request', () => {
      const message = requestAlertMessage(i18n, new Error());
      message.should.equal('Something went wrong: there was no request.');
    });

    it('returns a message if there was no response', () => {
      const error = new Error();
      error.request = {};
      const message = requestAlertMessage(i18n, error);
      message.should.equal('Something went wrong: there was no response to your request.');
    });

    it('returns a message with status code if request URL does not start with /v1', () => {
      const message = requestAlertMessage(i18n, mockAxiosError({
        status: 500,
        data: { code: 500.1, message: 'Message from Google' },
        config: { url: 'https://www.google.com' }
      }));
      message.should.equal('Something went wrong: error code 500.');
    });

    it('returns a message with status code if response is not a Problem', () => {
      const message = requestAlertMessage(i18n, mockAxiosError({
        status: 500,
        data: { x: 1 },
        config: { url: '/v1/projects/1/forms/f' }
      }));
      message.should.equal('Something went wrong: error code 500.');
    });

    it('returns the message of a Problem', () => {
      const message = requestAlertMessage(i18n, errorWithProblem());
      message.should.equal('Message from API');
    });

    describe('problemToAlert', () => {
      it('returns the message from the function', () => {
        const message = requestAlertMessage(
          i18n,
          errorWithProblem(),
          (problem) =>
            `Message from problemToAlert: ${problem.message} (${problem.code})`
        );
        message.should.equal('Message from problemToAlert: Message from API (500.1)');
      });

      it('returns the Problem message if the function returns null', () => {
        const message = requestAlertMessage(
          i18n,
          errorWithProblem(),
          () => null
        );
        message.should.equal('Message from API');
      });
    });
  });
});
