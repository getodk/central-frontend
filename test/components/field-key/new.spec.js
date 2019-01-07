import FieldKeyList from '../../../lib/components/field-key/list.vue';
import FieldKeyNew from '../../../lib/components/field-key/new.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { submitForm, trigger } from '../../event';

const clickCreateButton = (wrapper) =>
  trigger.click(wrapper, '#field-key-list-new-button');

describe('FieldKeyNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponse(page => {
          page.first(FieldKeyNew).getProp('state').should.be.false();
        }));

    describe('after button click', () => {
      it('modal is shown', () =>
        mockHttp()
          .mount(FieldKeyList)
          .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
          .afterResponse(clickCreateButton)
          .then(page => page.first(FieldKeyNew).getProp('state').should.be.true()));

      it('focuses the nickname input', () =>
        mockRoute('/users/field-keys', { attachToDocument: true })
          .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
          .afterResponse(clickCreateButton)
          .then(app => {
            app.first('#field-key-new input').should.be.focused();
          }));
    });
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(FieldKeyNew, {
        propsData: {
          projectId: '1',
          state: false
        }
      })
      .request(modal => submitForm(modal, 'form', [
        ['input', testData.extendedFieldKeys.createNew().displayName]
      ]))
      .standardButton());

  describe('after successful submit', () => {
    let app;
    beforeEach(() => mockRoute('/users/field-keys', { attachToDocument: true })
      .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
      .afterResponse(component => {
        app = component;
      })
      .request(() => clickCreateButton(app)
        .then(() => submitForm(app, '#field-key-new form', [
          ['input', testData.extendedFieldKeys.createNew().displayName]
        ])))
      .respondWithData(() => testData.simpleFieldKeys.last()));

    const testCreationCompletion = () => {
      it('hides the modal', () => {
        app.first(FieldKeyNew).getProp('state').should.be.false();
      });

      it('updates the number of rows in the table', () => {
        app.find('#field-key-list-table tbody tr').length.should.equal(2);
      });

      it('shows a success message', () => {
        app.should.alert('success');
      });
    };
    describe('after the done button is clicked', () => {
      beforeEach(() => mockHttp()
        .request(() => trigger.click(app.first('#field-key-new .btn-primary')))
        .respondWithData(() => testData.extendedFieldKeys.sorted()));

      testCreationCompletion();
    });

    describe('after the "create another" button is clicked', () => {
      beforeEach(() => trigger.click(app.first('#field-key-new .btn-link')));

      it('does not hide the modal', () => {
        app.first(FieldKeyNew).getProp('state').should.be.true();
      });

      it('shows a blank nickname input', () => {
        app.first('#field-key-new input').element.value.should.be.empty();
      });

      it('focuses the nickname input', () => {
        app.first('#field-key-new input').should.be.focused();
      });

      describe('after the close button is clicked', () => {
        beforeEach(() => mockHttp()
          .request(() => trigger.click(app.first('#field-key-new .btn-link')))
          .respondWithData(() => testData.extendedFieldKeys.sorted()));

        testCreationCompletion();
      });
    });
  });
});
