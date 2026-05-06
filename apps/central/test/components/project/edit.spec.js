import ProjectEdit from '../../../src/components/project/edit.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountOptions = () => ({
  container: {
    requestData: { project: testData.extendedProjects.last() }
  }
});

describe('ProjectEdit', () => {
  beforeEach(mockLogin);

  it('sets the value of the input to the current name', () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    const { value } = mount(ProjectEdit, mountOptions()).get('input').element;
    value.should.equal('My Project');
  });

  it('sets the value of the textarea to the current description', () => {
    testData.extendedProjects.createPast(1, { description: 'Description of my project.' });
    const { value } = mount(ProjectEdit, mountOptions()).get('textarea').element;
    value.should.equal('Description of my project.');
  });

  it('resets the form if the route changes', () => {
    testData.extendedProjects
      .createPast(1, { name: 'Project 1' })
      .createPast(1, { name: 'Project 2' });
    return load('/projects/1/settings', {}, {
      project: () => testData.extendedProjects.first()
    })
      .complete()
      .load('/projects/2/settings')
      .afterResponses(app => {
        app.get('#project-edit input').element.value.should.equal('Project 2');
      });
  });

  it('sends the correct request', () => {
    testData.extendedProjects.createPast(1, { name: 'Old Name' });
    return mockHttp()
      .mount(ProjectEdit, mountOptions())
      .request(async (component) => {
        component.get('input').setValue('New Name');
        component.get('textarea').setValue('New Description');
        return component.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PATCH');
        url.should.equal('/v1/projects/1');
        data.should.eql({ name: 'New Name', description: 'New Description' });
      })
      .respondWithProblem();
  });

  it('implements some standard button things', () => {
    testData.extendedProjects.createPast(1, { name: 'Old Name' });
    return mockHttp()
      .mount(ProjectEdit, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (component) => {
          component.get('input').setValue('New Name');
          return component.get('form').trigger('submit');
        }
      });
  });

  describe('after a successful response', () => {
    const submit = () => {
      testData.extendedProjects.createPast(1, { name: 'Old Name' });
      return load('/projects/1/settings')
        .complete()
        .request(async (app) => {
          const component = app.getComponent(ProjectEdit);
          component.get('input').setValue('New Name');
          return component.get('form').trigger('submit');
        })
        .respondWithData(() => {
          testData.extendedProjects.update(-1, { name: 'New Name' });
          return testData.standardProjects.last();
        });
    };

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });

    it("updates the project's name", async () => {
      const app = await submit();
      app.get('#page-head-title').text().should.equal('New Name');
    });
  });
});
