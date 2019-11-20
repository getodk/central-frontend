import FieldKeyNew from '../../../src/components/field-key/new.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { submitForm, trigger } from '../../event';

describe('FieldKeyNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('shows the modal after the create button is clicked', () =>
      mockRoute('/projects/1/app-users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponses(app => {
          app.first(FieldKeyNew).getProp('state').should.be.false();
          return trigger.click(app, '.heading-with-button button');
        })
        .then(app => {
          app.first(FieldKeyNew).getProp('state').should.be.true();
        }));

    it('focuses the nickname input after the create button is clicked', () =>
      mockRoute('/projects/1/app-users', { attachToDocument: true })
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponses(app =>
          trigger.click(app, '.heading-with-button button'))
        .then(app => {
          app.first('#field-key-new input').should.be.focused();
        }));
  });

  it('includes the project name in the first option of the access field', () => {
    const project = testData.extendedProjects.createPast(1).last();
    const modal = mountAndMark(FieldKeyNew, {
      propsData: { projectId: '1', state: false },
      requestData: { project }
    });
    const text = modal.first('option').text().trim().iTrim();
    text.should.equal(`All ${project.name} Forms`);
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
    const submit = () =>
      mockRoute('/projects/1/app-users', { attachToDocument: true })
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1).sorted())
        .complete()
        .request(app => trigger.click(app, '.heading-with-button button')
          .then(() => submitForm(app, '#field-key-new form', [
            ['input', testData.extendedFieldKeys.createNew().displayName]
          ])))
        .respondWithData(() => testData.standardFieldKeys.last());

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
          .afterResponse(app => trigger.click(app, '#field-key-new .btn-link'))
          .then(app => {
            app.first(FieldKeyNew).getProp('state').should.be.true();
          }));

      it('shows a blank nickname input', () =>
        submit()
          .afterResponse(app => trigger.click(app, '#field-key-new .btn-link'))
          .then(app => {
            app.first('#field-key-new input').element.value.should.equal('');
          }));

      it('focuses the nickname input', () =>
        submit()
          .afterResponse(app => trigger.click(app, '#field-key-new .btn-link'))
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
