import ProjectArchive from '../../../src/components/project/archive.vue';
import ProjectSettings from '../../../src/components/project/settings.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mountAndMark } from '../../util/destroy';
import { trigger } from '../../util/event';

describe('ProjectArchive', () => {
  beforeEach(mockLogin);

  it('does not show the button for an archived project', () => {
    const component = mountAndMark(ProjectSettings, {
      requestData: {
        project: testData.extendedProjects
          .createPast(1, { archived: true })
          .last()
      }
    });
    component.find('#project-settings-archive-button').length.should.equal(0);
  });

  it('shows the modal after the button is clicked', () => {
    const component = mountAndMark(ProjectSettings, {
      requestData: { project: testData.extendedProjects.createPast(1).last() }
    });
    const modal = component.first(ProjectArchive);
    modal.getProp('state').should.be.false();
    return trigger.click(component, '#project-settings-archive-button')
      .then(() => {
        modal.getProp('state').should.be.true();
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

  describe('after a successful response', () => {
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
