import ProjectEnableEncryption from '../../../src/components/project/enable-encryption.vue';
import ProjectSettings from '../../../src/components/project/settings.vue';
import testData from '../../data';
import { fillForm, submitForm, trigger } from '../../event';
import { mockHttp } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';

describe('ProjectEnableEncryption', () => {
  beforeEach(mockLogin);

  describe('enable encryption button', () => {
    it('renders the button if managed encryption is not enabled', () => {
      const component = mountAndMark(ProjectSettings, {
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      component.find('#enable-encryption-button').length.should.equal(1);
    });

    it('does not render the button if managed encryption is enabled', () => {
      const key = testData.standardKeys.createPast(1, { managed: true }).last();
      const project = testData.extendedProjects.createPast(1, { key }).last();
      const component = mountAndMark(ProjectSettings, {
        requestData: { project }
      });
      component.find('#enable-encryption-button').length.should.equal(0);
    });
  });

  it('shows the modal after the button is clicked', () => {
    const component = mountAndMark(ProjectSettings, {
      requestData: { project: testData.extendedProjects.createPast(1).last() }
    });
    const modal = component.first(ProjectEnableEncryption);
    modal.getProp('state').should.be.false();
    return trigger.click(component, '#enable-encryption-button').then(() => {
      modal.getProp('state').should.be.true();
    });
  });

  it('first shows information in the modal', () => {
    const modal = mountAndMark(ProjectEnableEncryption, {
      propsData: {
        state: true
      },
      requestData: { project: testData.extendedProjects.createPast(1).last() }
    });
    modal.find('.info-item').length.should.not.equal(0);
  });

  describe('form', () => {
    it('focuses the passphrase input', () => {
      const component = mountAndMark(ProjectSettings, {
        requestData: {
          project: testData.extendedProjects.createPast(1).last()
        },
        attachToDocument: true
      });
      return trigger.click(component, '#enable-encryption-button')
        .then(() => {
          const modal = component.first(ProjectEnableEncryption);
          return trigger.click(modal, '.btn-primary');
        })
        .then(modal => {
          modal.first('input').should.be.focused();
        });
    });

    it('resets the modal if it is closed', () => {
      const component = mountAndMark(ProjectSettings, {
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      const modal = component.first(ProjectEnableEncryption);
      return trigger.click(component, '#enable-encryption-button')
        .then(() => trigger.click(modal, '.btn-primary'))
        .then(() => fillForm(modal, [
          ['input[placeholder="Passphrase *"]', 'passphrase']
        ]))
        .then(() => trigger.click(modal, '.btn-link'))
        .then(() => trigger.click(component, '#enable-encryption-button'))
        .then(() => {
          modal.find('.info-item').length.should.not.equal(0);
        });
    });

    it('implements some standard button thinking things', () =>
      mockHttp()
        .mount(ProjectEnableEncryption, {
          propsData: {
            state: true
          },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => trigger.click(modal, '.btn-primary')
          .then(() => submitForm(modal, 'form', [
            ['input[placeholder="Passphrase *"]', 'passphrase']
          ])))
        .standardButton());

    it('sends the hint to Backend if the user specifies one', () =>
      mockHttp()
        .mount(ProjectEnableEncryption, {
          propsData: {
            state: true
          },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => trigger.click(modal, '.btn-primary')
          .then(() => submitForm(modal, 'form', [
            ['input[placeholder="Passphrase *"]', 'passphrase'],
            ['input[placeholder="Passphrase hint (optional)"]', 'some hint']
          ])))
        .beforeEachResponse((modal, config) => {
          config.data.hint.should.equal('some hint');
        })
        .respondWithSuccess());
  });

  describe('after a successful response', () => {
    it('indicates success in the modal', () =>
      mockHttp()
        .mount(ProjectEnableEncryption, {
          propsData: {
            state: true
          },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => trigger.click(modal, '.btn-primary')
          .then(() => submitForm(modal, 'form', [
            ['input[placeholder="Passphrase *"]', 'passphrase']
          ])))
        .respondWithSuccess()
        .afterResponse(modal => {
          modal.find('.icon-check-circle').length.should.equal(1);
        }));

    it('does not show the button after the modal is closed', () =>
      mockHttp()
        .mount(ProjectSettings, {
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(component =>
          trigger.click(component, '#enable-encryption-button')
            .then(() => {
              const modal = component.first('#project-enable-encryption');
              return trigger.click(modal, '.btn-primary');
            })
            .then(modal => submitForm(modal, 'form', [
              ['input[placeholder="Passphrase *"]', 'passphrase']
            ])))
        .respondWithSuccess()
        .complete()
        .request(component =>
          trigger.click(component, '#project-enable-encryption .btn-primary'))
        .respondWithData(() => testData.projects.update(
          testData.projects.last(),
          { keyId: testData.standardKeys.createNew({ managed: true }).id }
        ))
        .afterResponse(component => {
          component.find('#enable-encryption-button').length.should.equal(0);
        }));
  });
});
