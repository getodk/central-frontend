import ProjectArchive from '../../../src/components/project/archive.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectArchive', () => {
  beforeEach(mockLogin);

  it('does not render the button for an archived project', async () => {
    testData.extendedProjects.createPast(1, { archived: true });
    const component = await load('/projects/1/settings', { root: false });
    component.find('#project-settings-archive-button').exists().should.be.false();
  });

  it('toggles the modal', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/settings', { root: false }).testModalToggles({
      modal: ProjectArchive,
      show: '#project-settings-archive-button',
      hide: '.btn-link'
    });
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(ProjectArchive, {
        props: { state: true },
        container: {
          requestData: { project: testData.extendedProjects.createPast(1).last() }
        }
      })
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const submit = () => {
      testData.extendedProjects.createPast(1, { name: 'My Project' });
      return load('/projects/1/settings')
        .complete()
        .request(async (app) => {
          await app.get('#project-settings-archive-button').trigger('click');
          return app.get('#project-archive .btn-danger').trigger('click');
        })
        .respondWithData(() =>
          testData.extendedProjects.update(-1, { archived: true }))
        .respondWithData(() => testData.extendedForms.sorted())
        .respondWithData(() => []);
    };

    it('redirects the user to the project overview', async () => {
      const app = await submit();
      app.vm.$route.path.should.equal('/projects/1');
    });

    it("appends (archived) to project's name in project overview", async () => {
      const app = await submit();
      app.get('#page-head-title').text().should.equal('My Project (archived)');
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });
  });
});
