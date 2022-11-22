import ProjectEnableEncryption from '../../../src/components/project/enable-encryption.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true },
  container: {
    requestData: { project: testData.extendedProjects.last() }
  }
});

describe('ProjectEnableEncryption', () => {
  beforeEach(mockLogin);

  describe('enable encryption button', () => {
    it('renders the button if managed encryption is not enabled', async () => {
      testData.extendedProjects.createPast(1);
      const component = await load('/projects/1/settings', { root: false });
      const button = component.find('#project-settings-enable-encryption-button');
      button.exists().should.be.true();
    });

    it('does not render the button if managed encryption is enabled', async () => {
      const key = testData.standardKeys.createPast(1, { managed: true }).last();
      testData.extendedProjects.createPast(1, { key });
      const component = await load('/projects/1/settings', { root: false });
      const button = component.find('#project-settings-enable-encryption-button');
      button.exists().should.be.false();
    });
  });

  it('toggles the modal', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/settings', { root: false }).testModalToggles({
      modal: ProjectEnableEncryption,
      show: '#project-settings-enable-encryption-button',
      hide: '.btn-link'
    });
  });

  it('first shows information in the modal', () => {
    testData.extendedProjects.createPast(1);
    const modal = mount(ProjectEnableEncryption, mountOptions());
    modal.find('.info-item').exists().should.be.true();
  });

  it('focuses the passphrase input', async () => {
    testData.extendedProjects.createPast(1);
    const modal = mount(ProjectEnableEncryption, mountOptions({
      attachTo: document.body
    }));
    await modal.get('.btn-primary').trigger('click');
    modal.get('input[placeholder="Passphrase *"]').should.be.focused();
  });

  it('shows a danger alert if the passphrase is too short', async () => {
    testData.extendedProjects.createPast(1);
    const modal = mount(ProjectEnableEncryption, mountOptions());
    await modal.get('.btn-primary').trigger('click');
    await modal.get('input[placeholder="Passphrase *"]').setValue('x');
    await modal.get('form').trigger('submit');
    modal.should.alert('danger', 'Please input a passphrase at least 10 characters long.');
  });

  it('resets the modal after it is hidden', async () => {
    testData.extendedProjects.createPast(1);
    const modal = mount(ProjectEnableEncryption, mountOptions());
    await modal.get('.btn-primary').trigger('click');
    await modal.get('input[placeholder="Passphrase *"]').setValue('supersecret');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.find('.info-item').exists().should.be.true();
    await modal.get('.btn-primary').trigger('click');
    modal.get('input[placeholder="Passphrase *"]').element.value.should.equal('');
  });

  describe('request', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1);
    });

    it('sends the correct request', () =>
      mockHttp()
        .mount(ProjectEnableEncryption, mountOptions())
        .request(async (modal) => {
          await modal.get('.btn-primary').trigger('click');
          await modal.get('input[placeholder="Passphrase *"]').setValue('supersecret');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/key');
          data.should.eql({ passphrase: 'supersecret' });
        })
        .respondWithProblem());

    it('sends the hint if there is one', () =>
      mockHttp()
        .mount(ProjectEnableEncryption, mountOptions())
        .request(async (modal) => {
          await modal.get('.btn-primary').trigger('click');
          await modal.get('input[placeholder="Passphrase *"]').setValue('supersecret');
          const hint = modal.get('input[placeholder="Passphrase hint (optional)"]');
          await hint.setValue('bar');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { data }) => {
          data.hint.should.equal('bar');
        })
        .respondWithProblem());
  });

  it('implements some standard button things', () => {
    testData.extendedProjects.createPast(1);
    return mockHttp()
      .mount(ProjectEnableEncryption, mountOptions())
      .afterResponses(modal => modal.get('.btn-primary').trigger('click'))
      .testStandardButton({
        button: 'button[type="submit"]',
        disabled: ['.btn-link'],
        request: async (modal) => {
          await modal.get('input[placeholder="Passphrase *"]').setValue('supersecret');
          return modal.get('form').trigger('submit');
        },
        modal: true
      });
  });

  describe('after a successful response', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1);
    });

    it('shows a success icon', () =>
      mockHttp()
        .mount(ProjectEnableEncryption, mountOptions())
        .request(async (modal) => {
          await modal.get('.btn-primary').trigger('click');
          await modal.get('input[placeholder="Passphrase *"]').setValue('supersecret');
          return modal.get('form').trigger('submit');
        })
        .respondWithSuccess()
        .afterResponse(modal => {
          modal.find('.icon-check-circle').exists().should.be.true();
        }));

    it('hides an alert about the passphrase length', () =>
      mockHttp()
        .mount(ProjectEnableEncryption, mountOptions())
        .request(async (modal) => {
          await modal.get('.btn-primary').trigger('click');
          const passphrase = modal.get('input[placeholder="Passphrase *"]');
          await passphrase.setValue('x');
          const form = modal.get('form');
          await form.trigger('submit');
          await passphrase.setValue('supersecret');
          return form.trigger('submit');
        })
        .respondWithSuccess()
        .afterResponse(modal => {
          modal.should.not.alert();
        }));

    it('does not show the button after the modal is hidden', () =>
      load('/projects/1/settings')
        .complete()
        .request(async (app) => {
          await app.get('#project-settings-enable-encryption-button').trigger('click');
          const modal = app.getComponent(ProjectEnableEncryption);
          await modal.get('.btn-primary').trigger('click');
          await modal.get('input[placeholder="Passphrase *"]').setValue('supersecret');
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() => {
          const key = testData.standardKeys.createNew({ managed: true });
          testData.extendedProjects.update(-1, { keyId: key.id });
          return { success: true };
        })
        .complete()
        .request(app =>
          app.get('#project-enable-encryption .btn-primary').trigger('click'))
        .respondWithData(() => testData.extendedProjects.last())
        .afterResponse(app => {
          const button = app.find('#project-settings-enable-encryption-button');
          button.exists().should.be.false();
        }));
  });
});
