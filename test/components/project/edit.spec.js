import ProjectSettings from '../../../src/components/project/settings.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';
import { mountAndMark } from '../../util/destroy';
import { submitForm } from '../../util/event';

describe('ProjectEdit', () => {
  beforeEach(mockLogin);

  describe('name input', () => {
    it("shows the project's name", () => {
      const component = mountAndMark(ProjectSettings, {
        requestData: {
          project: testData.extendedProjects
            .createPast(1, { name: 'My Project' })
            .last()
        }
      });
      component.first('input').element.value.should.equal('My Project');
    });

    it("updates project's name if user navigates to a different project", () =>
      mockRoute('/projects/1/settings')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { name: 'Project 1' }).last())
        .complete()
        .route('/projects/2/settings')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { name: 'Project 2' }).last())
        .afterResponse(app => {
          const input = app.first('#project-edit input');
          input.element.value.should.equal('Project 2');
        }));
  });

  it('implements some standard button things', () =>
    mockRoute('/projects/1/settings')
      .respondWithData(() =>
        testData.extendedProjects.createPast(1, { name: 'Old Name' }).last())
      .complete()
      .request(component =>
        submitForm(component, 'form', [['input', 'New Name']]))
      .standardButton());

  describe('after a successful submit', () => {
    it('shows a success alert', () =>
      mockRoute('/projects/1/settings')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { name: 'Old Name' }).last())
        .complete()
        .request(app => submitForm(app, '#project-edit form', [
          ['input', 'New Name']
        ]))
        .respondWithData(() => testData.extendedProjects.update(
          testData.extendedProjects.last(),
          { name: 'New Name' }
        ))
        .afterResponse(app => {
          app.should.alert('success');
        }));

    it("updates the project's name", () =>
      mockRoute('/projects/1/settings')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { name: 'Old Name' }).last())
        .complete()
        .request(app => submitForm(app, '#project-edit form', [
          ['input', 'New Name']
        ]))
        .respondWithData(() => testData.extendedProjects.update(
          testData.extendedProjects.last(),
          { name: 'New Name' }
        ))
        .afterResponse(app => {
          app.first('#page-head-title').text().trim().should.equal('New Name');
        }));
  });
});
