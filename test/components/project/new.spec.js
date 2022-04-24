import ProjectNew from '../../../src/components/project/new.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

describe('ProjectNew', () => {
  describe('New button', () => {
    it('toggles the modal', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      return load('/', { root: false }).testModalToggles({
        modal: ProjectNew,
        show: '#project-list-new-button',
        hide: '.btn-link'
      });
    });

    it('does not render button if user cannot project.create', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1);
      const component = await load('/', { root: false }, { users: false });
      component.find('#project-list-new-button').exists().should.be.false();
    });
  });

  it('focuses the input', () => {
    mockLogin();
    const modal = mount(ProjectNew, {
      props: { state: true },
      attachTo: document.body
    });
    modal.get('input').should.be.focused();
  });

  it('sends the correct request', () => {
    mockLogin();
    return mockHttp()
      .mount(ProjectNew, {
        props: { state: true }
      })
      .request(async (modal) => {
        await modal.get('input').setValue('My Project');
        return modal.get('form').trigger('submit');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects',
        data: { name: 'My Project' }
      }]);
  });

  it('implements some standard button things', () => {
    mockLogin();
    return mockHttp()
      .mount(ProjectNew, {
        props: { state: true }
      })
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('My Project');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('after a successful response', () => {
    const submit = () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      return load('/')
        .complete()
        .request(async (app) => {
          await app.get('#project-list-new-button').trigger('click');
          const modal = app.getComponent(ProjectNew);
          await modal.get('input').setValue('My Project');
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() =>
          testData.standardProjects.createNew({ name: 'My Project' }))
        .respondFor('/projects/2');
    };

    it('redirects to the project overview', async () => {
      const app = await submit();
      app.vm.$route.path.should.equal('/projects/2');
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });
  });
});
