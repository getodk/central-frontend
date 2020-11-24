import FieldKeyQrPanel from '../../../src/components/field-key/qr-panel.vue';
import FieldKeyNew from '../../../src/components/field-key/new.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('FieldKeyNew', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1);
    return load('/projects/1/app-users').testModalToggles(
      FieldKeyNew,
      '#field-key-list-create-button',
      '.btn-link'
    );
  });

  it('focuses the input', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1);
    return load('/projects/1/app-users', { attachToDocument: true }, {})
      .then(trigger.click('#field-key-list-create-button'))
      .then(app => {
        app.first('#field-key-new input').should.be.focused();
      });
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(FieldKeyNew, {
        propsData: { projectId: '1', state: false },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      })
      .request(trigger.submit('form', [
        ['input', testData.extendedFieldKeys.createNew().displayName]
      ]))
      .standardButton());

  describe('after a successful response', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
    });

    const create = (series) => series
      .request(async (app) => {
        await trigger.click(app, '.heading-with-button button');
        await trigger.submit(app, '#field-key-new form', [
          ['input', 'My App User']
        ]);
      })
      .respondWithData(() => testData.standardFieldKeys.createNew({
        displayName: 'My App User'
      }));

    it("shows the app user's display name", () =>
      load('/projects/1/app-users')
        .complete()
        .modify(create)
        .afterResponses(app => {
          const p = app.first('#field-key-new .modal-introduction p');
          p.text().should.containEql('My App User');
        }));

    describe('QR code', () => {
      it('renders a FieldKeyQrPanel component for the app user', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(app => {
            const panel = app.first(FieldKeyNew).first(FieldKeyQrPanel);
            const { id } = testData.extendedFieldKeys.last();
            panel.getProp('fieldKey').id.should.equal(id);
          }));

      it('defaults to a managed code', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(app => {
            const panel = app.first(FieldKeyNew).first(FieldKeyQrPanel);
            panel.getProp('managed').should.be.true();
          }));

      describe('after user clicks link to switch to a legacy code', () => {
        it('shows a legacy code in the modal', () =>
          load('/projects/1/app-users', { attachToDocument: true }, {})
            .complete()
            .modify(create)
            .afterResponses(async (app) => {
              const panel = app.first(FieldKeyNew).first(FieldKeyQrPanel);
              await trigger.click(panel, '.switch-code');
              panel.getProp('managed').should.be.false();
            }));

        it('shows a legacy code in the next popover', () =>
          load('/projects/1/app-users', { attachToDocument: true }, {})
            .complete()
            .modify(create)
            .complete()
            .request(async (app) => {
              await trigger.click(app, '#field-key-new .switch-code');
              await trigger.click(app, '#field-key-new .btn-primary');
            })
            .respondWithData(() => testData.extendedFieldKeys.sorted())
            .afterResponse(async (app) => {
              await trigger.click(app, '.field-key-row-popover-link');
              await app.vm.$nextTick();
              const panel = document.querySelector('.popover .field-key-qr-panel');
              panel.classList.contains('legacy').should.be.true();
            }));

        it('allows the user to switch back to a managed code', () =>
          load('/projects/1/app-users', { attachToDocument: true }, {})
            .complete()
            .modify(create)
            .afterResponses(async (app) => {
              const panel = app.first(FieldKeyNew).first(FieldKeyQrPanel);
              await trigger.click(panel, '.switch-code');
              await trigger.click(panel, '.switch-code');
              panel.getProp('managed').should.be.true();
            }));
      });

      it('shows a legacy code in modal after user switches in popover', () =>
        load('/projects/1/app-users', { attachToDocument: true }, {})
          .afterResponses(async (app) => {
            await trigger.click(app, '.field-key-row-popover-link');
            await app.vm.$nextTick();
            document.querySelector('.popover .switch-code').click();
          })
          .modify(create)
          .afterResponses(app => {
            const panel = app.first(FieldKeyNew).first(FieldKeyQrPanel);
            panel.getProp('managed').should.be.false();
          }));
    });

    describe('after the Done button is clicked', () => {
      it('hides the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(trigger.click('#field-key-new .btn-primary'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.first(FieldKeyNew).getProp('state').should.be.false();
          }));

      it('updates the number of rows in the table', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(trigger.click('#field-key-new .btn-primary'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.find('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(trigger.click('#field-key-new .btn-primary'))
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
          .then(trigger.click('#field-key-new .btn-link'))
          .then(app => {
            app.first(FieldKeyNew).getProp('state').should.be.true();
          }));

      it('shows a blank input', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .then(trigger.click('#field-key-new .btn-link'))
          .then(app => {
            app.first('#field-key-new input').element.value.should.equal('');
          }));

      it('focuses the input', () =>
        load('/projects/1/app-users', { attachToDocument: true }, {})
          .complete()
          .modify(create)
          .then(trigger.click('#field-key-new .btn-link'))
          .then(app => {
            app.first('#field-key-new input').should.be.focused();
          }));
    });

    describe('after "Create another" button, then Cancel button are clicked', () => {
      it('hides the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-link')
            .then(() => trigger.click(app, '#field-key-new .btn-link')))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.first(FieldKeyNew).getProp('state').should.be.false();
          }));

      it('updates the number of rows in the table', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-link')
            .then(() => trigger.click(app, '#field-key-new .btn-link')))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.find('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-link')
            .then(() => trigger.click(app, '#field-key-new .btn-link')))
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
        .request(trigger.click('#field-key-new a[href="/projects/1/form-access"]'))
        .beforeEachResponse((_, { url }, index) => {
          if (index === 1) url.should.equal('/v1/projects/1/app-users');
        })
        .respondFor('/projects/1/form-access', { project: false }));
  });
});
