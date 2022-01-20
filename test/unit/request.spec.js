import sinon from 'sinon';
import { F, T } from 'ramda';

import createCentralI18n from '../../src/i18n';
import { apiPaths, isProblem, queryString, request } from '../../src/util/request';
import { noop } from '../../src/util/util';

import createTestContainer from '../util/container';
import testData from '../data';
import { mockAxios } from '../util/axios';
import { mockHttp } from '../util/http';

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

    it('publicLinks', () => {
      const path = apiPaths.publicLinks(1, 'a b');
      path.should.equal('/v1/projects/1/forms/a%20b/public-links');
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

  describe('request()', () => {
    describe('file size exceeds limit', () => {
      const largeFile = (name) => {
        const file = new File([''], name);
        // At least in Headless Chrome, `file` does not have its own `size`
        // property, but rather uses the Blob.prototype.size getter.
        Object.prototype.hasOwnProperty.call(file, 'size').should.be.false();
        Object.defineProperty(file, 'size', { value: 100000001 });
        return file;
      };

      it('does not send a request', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .testNoRequest(() => request(container, {
            method: 'POST',
            url: '/v1/projects/1/forms',
            data: largeFile('form.xml')
          }).catch(noop));
      });

      it('returns a rejected promise', () => {
        const result = request(createTestContainer(), {
          method: 'POST',
          url: '/v1/projects/1/forms',
          data: largeFile('form.xml')
        });
        return result.should.be.rejected();
      });

      it('shows a danger alert', () => {
        const container = createTestContainer();
        request(container, {
          method: 'POST',
          url: '/v1/projects/1/forms',
          data: largeFile('form.xml')
        }).catch(noop);
        const { alert } = container;
        alert.data.type.should.equal('danger');
        alert.data.message.should.containEql('form.xml');
      });
    });

    describe('Authorization header', () => {
      it('specifies the session token in the Authorization header', () => {
        const container = createTestContainer({
          requestData: { session: testData.sessions.createNew({ token: 'xyz' }) }
        });
        return mockHttp(container)
          .request(() => request(container, '/v1/projects'))
          .beforeEachResponse((_, { headers }) => {
            headers.Authorization.should.equal('Bearer xyz');
          })
          .respondWithData(() => []);
      });

      it('does not add an Authorization header if URL does not start with /v1', () => {
        const container = createTestContainer({
          requestData: { session: testData.sessions.createNew({ token: 'xyz' }) }
        });
        return mockHttp(container)
          .request(() => request(container, '/version.txt'))
          .beforeEachResponse((_, { headers }) => {
            should.not.exist(headers.Authorization);
          })
          .respondWithData(() => 'v1.4');
      });

      it('does not add an Authorization header if there is no session', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(() => request(container, '/v1/projects'))
          .beforeEachResponse((_, { headers }) => {
            should.not.exist(headers.Authorization);
          })
          .respondWithData(() => []);
      });

      it('does not overwrite an existing Authorization header', () => {
        const container = createTestContainer({
          requestData: { session: testData.sessions.createNew({ token: 'xyz' }) }
        });
        return mockHttp(container)
          .request(() => request(container, {
            url: '/v1/projects',
            headers: { Authorization: 'auth' }
          }))
          .beforeEachResponse((_, { headers }) => {
            headers.Authorization.should.equal('auth');
          })
          .respondWithData(() => []);
      });
    });

    describe('fulfillProblem', () => {
      it('rejects if fulfillProblem returns false', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(() => {
            const promise = request(container, {
              method: 'DELETE',
              url: '/v1/projects/1',
              fulfillProblem: F
            });
            return promise.should.be.rejected();
          })
          .respondWithProblem();
      });

      it('fulfills to the response if fulfillProblem returns true', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(async () => {
            const { data } = await request(container, {
              method: 'DELETE',
              url: '/v1/projects/1',
              fulfillProblem: T
            });
            data.code.should.equal(500.1);
          })
          .respondWithProblem();
      });

      it('passes the Problem to fulfillProblem', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(async () => {
            const fulfillProblem = sinon.fake.returns(true);
            await request(container, {
              method: 'DELETE',
              url: '/v1/projects/1',
              fulfillProblem
            });
            fulfillProblem.getCall(0).args[0].code.should.equal(500.1);
          })
          .respondWithProblem();
      });
    });

    describe('error logging', () => {
      it('does not log if there was a response', () => {
        const http = mockAxios(() => {
          const error = new Error();
          error.response = {};
          return Promise.reject(error);
        });
        const log = sinon.fake();
        const logger = { log };
        return request(createTestContainer({ http, logger }), '/v1/projects')
          .catch(noop)
          .then(() => {
            log.called.should.be.false();
          });
      });

      it('logs the request if there was one', () => {
        const error = new Error();
        error.request = {};
        const http = mockAxios(() => Promise.reject(error));
        const log = sinon.fake();
        const logger = { log };
        return request(createTestContainer({ http, logger }), '/v1/projects')
          .catch(noop)
          .then(() => {
            log.calledWith(error.request).should.be.true();
          });
      });

      it('logs the error message if there was no request', () => {
        const http = mockAxios(() => Promise.reject(new Error('foo')));
        const log = sinon.fake();
        const logger = { log };
        return request(createTestContainer({ http, logger }), '/v1/projects')
          .catch(noop)
          .then(() => {
            log.calledWith('foo').should.be.true();
          });
      });
    });

    describe('alert after unsuccessful response', () => {
      it('shows an alert if there was no request', () => {
        const http = mockAxios(() => Promise.reject(new Error()));
        const container = createTestContainer({ http });
        return request(container, '/v1/projects/1/forms/f')
          .catch(noop)
          .then(() => {
            const { message } = container.alert.data;
            message.should.equal('Something went wrong: there was no request.');
          });
      });

      it('shows an alert if there was no response', () => {
        const http = mockAxios(() => {
          const error = new Error();
          error.request = {};
          return Promise.reject(error);
        });
        const container = createTestContainer({ http });
        return request(container, '/v1/projects/1/forms/f')
          .catch(noop)
          .then(() => {
            const { message } = container.alert.data;
            message.should.equal('Something went wrong: there was no response to your request.');
          });
      });

      it('shows a message with status code if request URL does not start with /v1', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(() => request(container, 'https://www.google.com').catch(noop))
          .respondWithProblem({ code: 500.1, message: 'Message from Google' })
          .afterResponse(() => {
            const { message } = container.alert.data;
            message.should.equal('Something went wrong: error code 500.');
          });
      });

      it('shows a message with status code if response is not a Problem', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(() => request(container, '/v1/projects/1/forms/f').catch(noop))
          .respond(() => ({
            status: 500,
            data: { x: 1 }
          }))
          .afterResponse(() => {
            const { message } = container.alert.data;
            message.should.equal('Something went wrong: error code 500.');
          });
      });

      it('shows the message of a Problem', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(() => request(container, '/v1/projects/1/forms/f').catch(noop))
          .respondWithProblem({ code: 500.1, message: 'Message from API' })
          .afterResponse(() => {
            const { message } = container.alert.data;
            message.should.equal('Message from API');
          });
      });

      it('shows a danger alert', () => {
        const container = createTestContainer();
        return mockHttp(container)
          .request(() => request(container, '/v1/projects/1/forms/f').catch(noop))
          .respondWithProblem()
          .afterResponse(() => {
            const { alert } = container;
            alert.data.type.should.equal('danger');
          });
      });

      describe('problemToAlert', () => {
        it('shows the message from the function', () => {
          const container = createTestContainer();
          return mockHttp(container)
            .request(() => request(container, {
              url: '/v1/projects/1/forms/f',
              problemToAlert: ({ code, message }) =>
                `Message from problemToAlert: ${message} (${code})`
            }).catch(noop))
            .respondWithProblem({ code: 500.1, message: 'Message from API' })
            .afterResponse(() => {
              const { message } = container.alert.data;
              message.should.equal('Message from problemToAlert: Message from API (500.1)');
            });
        });

        it('shows the Problem message if the function returns null', () => {
          const container = createTestContainer();
          return mockHttp(container)
            .request(() => request(container, {
              url: '/v1/projects/1/forms/f',
              problemToAlert: () => null
            }).catch(noop))
            .respondWithProblem({ code: 500.1, message: 'Message from API' })
            .afterResponse(() => {
              const { message } = container.alert.data;
              message.should.equal('Message from API');
            });
        });
      });

      describe('i18n', () => {
        const i18n = createCentralI18n();
        i18n.setLocaleMessage('la', {
          problem: {
            '401_2': 'Message for locale: {message} ({code})'
          }
        });
        i18n.locale = 'la';
        i18n.setLocaleMessage('ett', {
          problem: {
            '401_2': 'Message for fallback (401.2)',
            '404_1': 'Message for fallback (404.1)'
          }
        });
        i18n.fallbackLocale = 'ett';

        it('shows an i18n message for the Problem code', () => {
          const container = createTestContainer({ i18n });
          return mockHttp(container)
            .request(() => request(container, '/v1/projects/1/forms/f').catch(noop))
            .respondWithProblem({ code: 401.2, message: 'Message from API' })
            .afterResponse(() => {
              const { message } = container.alert.data;
              message.should.equal('Message for locale: Message from API (401.2)');
            });
        });

        it('shows the Problem message if there is no i18n message', () => {
          const container = createTestContainer({ i18n });
          return mockHttp(container)
            .request(() => request(container, '/v1/projects/1/forms/f').catch(noop))
            .respondWithProblem({ code: 500.1, message: 'Message from API' })
            .afterResponse(() => {
              const { message } = container.alert.data;
              message.should.equal('Message from API');
            });
        });

        it('shows an i18n message for the fallback locale', () => {
          const container = createTestContainer({ i18n });
          return mockHttp(container)
            .request(() => request(container, '/v1/projects/1/forms/f').catch(noop))
            .respondWithProblem({ code: 404.1, message: 'Message from API' })
            .afterResponse(() => {
              const { message } = container.alert.data;
              message.should.equal('Message for fallback (404.1)');
            });
        });

        it('does not show i18n message if problemToAlert function returns string', () => {
          const container = createTestContainer({ i18n });
          return mockHttp(container)
            .request(() => request(container, {
              url: '/v1/projects/1/forms/f',
              problemToAlert: () => 'Message from problemToAlert'
            }).catch(noop))
            .respondWithProblem({ code: 401.2, message: 'Message from API' })
            .afterResponse(() => {
              const { message } = container.alert.data;
              message.should.equal('Message from problemToAlert');
            });
        });

        it('does not show i18n message if problemToAlert function returns null', () => {
          const container = createTestContainer({ i18n });
          return mockHttp(container)
            .request(() => request(container, {
              url: '/v1/projects/1/forms/f',
              problemToAlert: () => null
            }).catch(noop))
            .respondWithProblem({ code: 401.2, message: 'Message from API' })
            .afterResponse(() => {
              const { message } = container.alert.data;
              message.should.equal('Message from problemToAlert');
            });
        });
      });
    });
  });
});
