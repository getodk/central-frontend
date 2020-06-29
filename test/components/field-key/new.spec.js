import FieldKeyNew from '../../../src/components/field-key/new.vue';
import testData from '../../data';
import { collectQrData } from '../../util/collect-qr';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { submitForm, trigger } from '../../util/event';

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
      .request(modal => submitForm(modal, 'form', [
        ['input', testData.extendedFieldKeys.createNew().displayName]
      ]))
      .standardButton());

  describe('after a successful response', () => {
    const submit = () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
      return load('/projects/1/app-users', { attachToDocument: true }, {})
        .complete()
        .request(app => trigger.click(app, '.heading-with-button button')
          .then(() => submitForm(app, '#field-key-new form', [
            ['input', 'My Field Key']
          ])))
        .respondWithData(() => testData.standardFieldKeys.createNew({
          displayName: 'My Field Key'
        }));
    };

    it("shows the field key's display name", () =>
      submit().then(app => {
        const p = app.first('#field-key-new .modal-introduction p');
        p.text().should.containEql('My Field Key');
      }));

    it('shows a QR code for the field key', () =>
      submit().then(app => {
        // avoriaz can't seem to find the <img> element (maybe because we use
        // v-html?). We use a little vanilla JavaScript to find it ourselves.
        const p = app.find('#field-key-new .modal-introduction p')[1].element;
        p.children.length.should.equal(1);
        const img = p.children[0];
        img.tagName.should.equal('IMG');
        const { token } = testData.extendedFieldKeys.last();
        collectQrData(img).should.eql({
          general: {
            server_url: `${window.location.origin}/v1/key/${token}/projects/1`
          },
          admin: {}
        });
      }));

    describe('after the Done button is clicked', () => {
      it('hides the modal', () =>
        submit()
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-primary'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.first(FieldKeyNew).getProp('state').should.be.false();
          }));

      it('updates the number of rows in the table', () =>
        submit()
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-primary'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.find('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        submit()
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-primary'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.should.alert('success');
          }));
    });

    describe('after the "Create another" button is clicked', () => {
      it('does not hide the modal', () =>
        submit()
          .then(trigger.click('#field-key-new .btn-link'))
          .then(app => {
            app.first(FieldKeyNew).getProp('state').should.be.true();
          }));

      it('shows a blank input', () =>
        submit()
          .then(trigger.click('#field-key-new .btn-link'))
          .then(app => {
            app.first('#field-key-new input').element.value.should.equal('');
          }));

      it('focuses the input', () =>
        submit()
          .then(trigger.click('#field-key-new .btn-link'))
          .then(app => {
            app.first('#field-key-new input').should.be.focused();
          }));
    });

    describe('after "Create another" button, then Cancel button are clicked', () => {
      it('hides the modal', () =>
        submit()
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-link')
            .then(() => trigger.click(app, '#field-key-new .btn-link')))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.first(FieldKeyNew).getProp('state').should.be.false();
          }));

      it('updates the number of rows in the table', () =>
        submit()
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-link')
            .then(() => trigger.click(app, '#field-key-new .btn-link')))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.find('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        submit()
          .complete()
          .request(app => trigger.click(app, '#field-key-new .btn-link')
            .then(() => trigger.click(app, '#field-key-new .btn-link')))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.should.alert('success');
          }));
    });

    it('fetches app users after link to Form Access tab is clicked', () =>
      submit()
        .complete()
        .request(app => trigger.click(app, '#field-key-new a[href="#"]'))
        .beforeEachResponse((app, config, index) => {
          if (index === 1) config.url.should.equal('/v1/projects/1/app-users');
        })
        .respondWithData(() => testData.extendedForms.sorted())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .respondWithData(() => testData.standardRoles.sorted())
        .respondWithData(() =>
          testData.standardFormSummaryAssignments.sorted()));
  });
});
