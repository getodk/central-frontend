import ProjectArchive from '../../../lib/components/project/archive.vue';
import ProjectSettings from '../../../lib/components/project/settings.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../event';

describe('ProjectArchive', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('does not show the modal initially', () => {
      const component = mountAndMark(ProjectSettings, {
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      component.first(ProjectArchive).getProp('state').should.be.false();
    });

    it('shows the modal after the archive button is clicked', () => {
      const component = mountAndMark(ProjectSettings, {
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      return trigger.click(component, '#project-settings-archive-button')
        .then(() => {
          component.first(ProjectArchive).getProp('state').should.be.true();
        });
    });
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(ProjectArchive, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      })
      .request(modal => trigger.click(modal, '.btn-danger'))
      .standardButton('.btn-danger'));

  describe('after a successful PATCH request', () => {
    let app;
    beforeEach(() => mockRoute('/projects/1/settings')
      .respondWithData(() =>
        testData.extendedProjects.createPast(1, { name: 'My Project' }).last())
      .afterResponse(component => {
        app = component;
      })
      .request(() => trigger.click(app, '#project-settings-archive-button')
        .then(() => trigger.click(app, '#project-archive .btn-danger')))
      .respondWithData(() => testData.extendedProjects.update(
        testData.extendedProjects.last(),
        { archived: true }
      ))
      .respondWithData(() => testData.extendedForms.sorted()));

    it('redirects the user to the project overview', () => {
      app.vm.$route.path.should.equal('/projects/1');
    });

    it("appends (archived) to project's name in project overview", () => {
      const title = app.first('#page-head-title').text().trim();
      title.should.equal('My Project (archived)');
    });

    it('shows a success alert', () => {
      app.should.alert('success');
    });
  });
});
