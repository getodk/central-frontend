import testData from '../../data';
import { formatDate } from '../../../src/util/util';
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
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('does not redirect a user with minimal grants', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/')
        .respondWithData(() => testData.extendedProjects.sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    for (const selector of ['.navbar-brand', '#navbar-projects-link']) {
      it(`navigates to the project list after a click on ${selector}`, () => {
        mockLogin();
        return mockRoute('/account/edit')
          .respondWithData(() => testData.standardUsers.first())
          .complete()
          .request(app => trigger.click(app, selector))
          .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });
    }
  });

  describe('Right Now', () => {
    it('shows users and projects', () => {
      mockLogin();
      return mockRoute('/')
        .respondWithData(() => testData.extendedProjects.createPast(2).sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(app => {
          const counts = app.find('.summary-item-heading');
          counts.map(count => count.text().trim()).should.eql(['1', '2']);
        });
    });

    const targets = [
      ['icon', '.summary-item-icon-container'],
      ['count', '.summary-item-heading a'],
      ['description', '.summary-item-body a']
    ];
    for (const [description, selector] of targets) {
      it(`renders a link to /users for the users ${description}`, () => {
        mockLogin();
        return mockRoute('/')
          .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
          .respondWithData(() => testData.administrators.sorted())
          .afterResponses(app => {
            app.first(selector).getAttribute('href').should.equal('#/users');
          });
      });

      it(`scrolls down the page upon a click on the projects ${description}`, () => {
        mockLogin();
        return mockRoute('/', { attachToDocument: true })
          .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
          .respondWithData(() => testData.administrators.sorted())
          .afterResponses(app => {
            window.pageYOffset.should.equal(0);
            return trigger.click(app.find(selector)[1]);
          })
          // Wait for the animation to complete.
          .then(() => new Promise(resolve => {
            setTimeout(resolve, 400);
          }))
          .then(() => {
            window.pageYOffset.should.not.equal(0);
          });
      });
    }

    it('does not show users if current user does not have a grant to user.list', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/')
        .respondWithData(() => testData.extendedProjects.createPast(2).sorted())
        .afterResponses(app => {
          const counts = app.find('.summary-item-heading');
          counts.length.should.equal(1);
          counts[0].text().trim().should.eql('2');
          counts[0].first('a').getAttribute('href').should.equal('#');
        });
    });
  });

  describe('after login as an administrator', () => {
    beforeEach(mockLogin);

    it('shows the table headers while the projects are loading', () =>
      mockRoute('/')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .beforeEachResponse(app => {
          app.find('thead tr').length.should.equal(1);
        }));

    it('lists the projects in the correct order', () =>
      mockRoute('/')
        .respondWithData(() => testData.extendedProjects
          .createPast(1, { name: 'a' })
          .createPast(1, { name: 'b' })
          .sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          const a = app.find('.project-list-project-name a');
          a.length.should.equal(2);
          const names = a.map(wrapper => wrapper.text().trim());
          names.should.eql(['a', 'b']);
        }));

    it('displays a row of the table correctly', () =>
      mockRoute('/')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { forms: 2 }).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          const td = app.find('#project-list-table td');
          const project = testData.extendedProjects.last();
          td.length.should.equal(3);
          const a = td[0].first('a');
          a.text().trim().should.equal(project.name);
          a.getAttribute('href').should.equal('#/projects/1');
          td[1].text().trim().should.equal('2 Forms');
          td[2].text().trim().should.equal(formatDate(project.lastSubmission, '(none)'));
        }));

    it('shows a message if there are no projects', () =>
      mockRoute('/')
        .respondWithData(() => testData.extendedProjects.sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(app => {
          app.find('.empty-table-message').length.should.equal(1);
        }));

    describe('archived project', () => {
      it('adds an HTML class to the row', () =>
        mockRoute('/')
          .respondWithData(() => testData.extendedProjects
            .createPast(1, { archived: true })
            .sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            const tr = app.first('#project-list-table tbody tr');
            tr.hasClass('archived').should.be.true();
          }));

      it("appends (archived) to the project's name", () =>
        mockRoute('/')
          .respondWithData(() => testData.extendedProjects
            .createPast(1, { name: 'My Project', archived: true })
            .sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            const name = app.first('.project-list-project-name a').text().trim();
            name.should.equal('My Project (archived)');
          }));
    });
  });
});
