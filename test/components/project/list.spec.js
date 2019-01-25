import pluralize from 'pluralize';

import testData from '../../data';
import { formatDate } from '../../../lib/util';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../event';

describe('ProjectList', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('redirects user to project list upon a click on .navbar-brand', () => {
      mockLogin();
      return mockRoute('/users')
        .respondWithData(() => testData.administrators.sorted())
        .complete()
        .request(app => trigger.click(app, '.navbar-brand'))
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('lists the projects in the correct order', () =>
      mockRoute('/')
        .respondWithData(() => testData.extendedProjects
          .createPast(1, { name: 'a' })
          .createPast(1, { name: 'b' })
          .sorted())
        .afterResponse(app => {
          const a = app.find('.project-list-project-name a');
          a.length.should.equal(2);
          const names = a.map(wrapper => wrapper.text().trim());
          names.should.eql(['a', 'b']);
        }));

    it('displays a row of the table correctly', () =>
      mockRoute('/')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .afterResponse(app => {
          const td = app.find('#project-list-table td');
          const project = testData.extendedProjects.last();
          td.length.should.equal(3);
          const a = td[0].first('a');
          a.text().trim().should.equal(project.name);
          a.getAttribute('href').should.equal('#/projects/1');
          td[1].text().trim().should.equal(pluralize('form', project.forms, true));
          td[2].text().trim().should.equal(formatDate(project.lastSubmission, '(none)'));
        }));

    it('shows a message if there are no projects', () =>
      mockRoute('/')
        .respondWithData(() => testData.extendedProjects.sorted())
        .afterResponse(app => {
          app.find('#project-list-empty-message').length.should.equal(1);
        }));
  });
});
