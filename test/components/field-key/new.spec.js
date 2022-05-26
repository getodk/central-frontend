import FieldKeyNew from '../../../src/components/field-key/new.vue';
import FieldKeyQrPanel from '../../../src/components/field-key/qr-panel.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true, managed: true },
  container: {
    requestData: { project: testData.extendedProjects.last() },
    router: mockRouter('/')
  }
});

describe('FieldKeyNew', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1);
    return load('/projects/1/app-users').testModalToggles({
      modal: FieldKeyNew,
      show: '#field-key-list-create-button',
      hide: '.btn-link'
    });
  });

  it('focuses the input', () => {
    testData.extendedProjects.createPast(1);
    const modal = mount(FieldKeyNew, mountOptions({ attachTo: document.body }));
    modal.get('input').should.be.focused();
  });

  it('implements some standard button things', () => {
    testData.extendedProjects.createPast(1);
    return mockHttp()
      .mount(FieldKeyNew, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('My Field Key');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('after a successful response', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
    });

    const create = (series) => series
      .request(async (app) => {
        await app.get('.heading-with-button button').trigger('click');
        const modal = app.getComponent(FieldKeyNew);
        await modal.get('input').setValue('input', 'My App User');
        return modal.get('form').trigger('submit');
      })
      .respondWithData(() => testData.standardFieldKeys.createNew({
        displayName: 'My App User'
      }));

    it("shows the app user's display name", () =>
      load('/projects/1/app-users')
        .complete()
        .modify(create)
        .afterResponses(app => {
          const p = app.get('#field-key-new .modal-introduction p');
          p.text().should.containEql('My App User');
        }));

    describe('QR code', () => {
      it('renders a FieldKeyQrPanel component for the app user', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(app => {
            const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
            const { id } = testData.extendedFieldKeys.last();
            panel.props().fieldKey.id.should.equal(id);
          }));

      it('defaults to a managed QR code', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(app => {
            const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
            panel.props().managed.should.be.true();
          }));

      describe('after user clicks link to switch to a legacy QR code', () => {
        it('shows a legacy QR code in the modal', () =>
          load('/projects/1/app-users', { attachTo: document.body })
            .complete()
            .modify(create)
            .afterResponses(async (app) => {
              const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
              await panel.get('.switch-code').trigger('click');
              panel.props().managed.should.be.false();
            }));

        it('shows a legacy QR code in the next popover', () =>
          load('/projects/1/app-users', { attachTo: document.body })
            .complete()
            .modify(create)
            .complete()
            .request(async (app) => {
              await app.get('#field-key-new .switch-code').trigger('click');
              await app.get('#field-key-new .btn-primary').trigger('click');
            })
            .respondWithData(() => testData.extendedFieldKeys.sorted())
            .afterResponse(async (app) => {
              await app.get('.field-key-row-popover-link').trigger('click');
              await app.vm.$nextTick();
              const panel = document.querySelector('.popover .field-key-qr-panel');
              panel.classList.contains('legacy').should.be.true();
            }));

        it('allows the user to switch back to a managed QR code', () =>
          load('/projects/1/app-users', { attachTo: document.body })
            .complete()
            .modify(create)
            .afterResponses(async (app) => {
              const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
              await panel.get('.switch-code').trigger('click');
              await panel.get('.switch-code').trigger('click');
              panel.props().managed.should.be.true();
            }));
      });

      it('shows a legacy QR code in modal after user switches in popover', () =>
        load('/projects/1/app-users', { attachTo: document.body })
          .afterResponses(async (app) => {
            await app.get('.field-key-row-popover-link').trigger('click');
            await app.vm.$nextTick();
            document.querySelector('.popover .switch-code').click();
          })
          .modify(create)
          .afterResponses(app => {
            const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
            panel.props().managed.should.be.false();
          }));
    });

    describe('after the Done button is clicked', () => {
      it('hides the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.getComponent(FieldKeyNew).props().state.should.be.false();
          }));

      it('updates the number of rows in the table', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.findAll('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.should.alert('success');
          }));
    });

    describe('after the "Create another" button is clicked', () => {
      it('does not hide the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            app.getComponent(FieldKeyNew).props().state.should.be.true();
          }));

      it('shows a blank input', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            app.get('#field-key-new input').element.value.should.equal('');
          }));

      it('focuses the input', () =>
        load('/projects/1/app-users', { attachTo: document.body })
          .complete()
          .modify(create)
          .afterResponses(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            app.get('#field-key-new input').should.be.focused();
          }));
    });

    describe('after "Create another" button, then Cancel button are clicked', () => {
      it('hides the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            return app.get('#field-key-new .btn-link').trigger('click');
          })
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.getComponent(FieldKeyNew).props().state.should.be.false();
          }));

      it('updates the number of rows in the table', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            return app.get('#field-key-new .btn-link').trigger('click');
          })
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.findAll('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            return app.get('#field-key-new .btn-link').trigger('click');
          })
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.should.alert('success');
          }));
    });

    it('fetches app users after link to Form Access tab is clicked', () =>
      load('/projects/1/app-users')
        .complete()
        .modify(create)
        .complete()
        .request(app => {
          const a = app.get('#field-key-new a[href$="/projects/1/form-access"]');
          return a.trigger('click');
        })
        .beforeEachResponse((_, { url }, index) => {
          if (index === 1) url.should.equal('/v1/projects/1/app-users');
        })
        .respondFor('/projects/1/form-access', { project: false }));
  });
});
